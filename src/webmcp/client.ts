import type {
  ModelContextHost,
  ModelContextToolDescriptor,
  ToolResponse,
  WebMCPEndpoints,
  WebMCPPolicy,
  WebMCPSession,
  WebMCPToolDefinition,
} from "./types";
import {
  isSecureContext,
  isWebMCPSupported,
  registerTools,
  toToolResponse,
  type RegistrationHandle,
  type WebMCPBridge,
} from "./runtime";
import { GrantStore } from "./grant";
import { EntitlementStore } from "./paywall/entitlement";
import type { PricingTable } from "./paywall/types";
import { RateLimiter, guardTool, type GuardContext } from "./policy";
import { createAuthTools, type AuthToolsOptions } from "./auth-tools";
import { createPageTools, resetRefs, type PageToolsOptions } from "./page";

export type WebMCPAuthOptions = Omit<AuthToolsOptions, "endpoints" | "grants">;

export interface WebMCPConfig {
  /** Base path of the auth routes. Default: "/api/auth". */
  basePath?: string;
  /** Override individual endpoints derived from `basePath`. */
  endpoints?: Partial<WebMCPEndpoints>;
  /** Built-in auth tools. `false` disables them. */
  auth?: boolean | WebMCPAuthOptions;
  /** Page translation tools. `false` disables them. */
  page?: boolean | PageToolsOptions;
  /**
   * Your own application tools. Pass a function to compute them on every
   * refresh, for tool sets that change with the page or with app state.
   */
  tools?: WebMCPToolDefinition[] | (() => WebMCPToolDefinition[]);
  /** Security policy applied to every tool. */
  policy?: WebMCPPolicy;
  /**
   * Paywall settings for this page.
   *
   * `pricing` is what agents are told a tool costs; the server's own pricing
   * table is what actually gets charged, so the two should agree but only one
   * of them is trusted.
   */
  paywall?: {
    pricing?: PricingTable;
    /** Notified whenever a call is blocked pending payment. */
    onPaymentRequired?: (event: { tool: string; message: string }) => void;
  };
  /** Prefix added to every tool name, e.g. "acme" -> "acme_page_snapshot". */
  namespace?: string;
  /**
   * Re-scan and re-register when the route or DOM changes, so agents see the
   * page they are actually looking at. Default: true.
   */
  watch?: boolean;
  /** Supply the session yourself instead of fetching it (see the React hook). */
  session?: WebMCPSession | null;
  /** Custom session resolver. Defaults to fetching the session endpoint. */
  getSession?: () => Promise<WebMCPSession | null>;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  onReady?: (handle: WebMCPHandle) => void;
  onError?: (error: Error) => void;
}

export interface WebMCPHandle {
  /** Whether a real WebMCP implementation accepted the tools. */
  readonly supported: boolean;
  /** Where the tools ended up: the spec API, the legacy API, or the bridge. */
  readonly host: ModelContextHost;
  readonly tools: string[];
  readonly grants: GrantStore;
  /** Receipts held for paywalled tools. */
  readonly entitlements: EntitlementStore;
  /** Re-scan the page and re-register. Safe to call often. */
  refresh: () => Promise<void>;
  /** Unregister everything and stop watching. */
  dispose: () => void;
  getSession: (force?: boolean) => Promise<WebMCPSession | null>;
  /** Invoke a tool directly — used by the bridge, tests and custom agents. */
  execute: (
    name: string,
    args?: Record<string, unknown>
  ) => Promise<ToolResponse>;
}

const SESSION_CACHE_MS = 5_000;

export function resolveEndpoints(
  basePath = "/api/auth",
  overrides: Partial<WebMCPEndpoints> = {}
): WebMCPEndpoints {
  const base = basePath.replace(/\/$/, "");
  return {
    session: `${base}/session`,
    signIn: `${base}/signin/email`,
    signOut: `${base}/signout`,
    twoFactor: `${base}/twofa/verify`,
    action: `${base}/webmcp/action`,
    grant: `${base}/webmcp/grant`,
    revoke: `${base}/webmcp/revoke`,
    paywallQuote: `${base}/webmcp/paywall/quote`,
    paywallSettle: `${base}/webmcp/paywall/settle`,
    ...overrides,
  };
}

/**
 * Makes the current page WebMCP-ready.
 *
 * Registers three families of tools with the browser's agent runtime: the
 * page translation tools (so an agent can read and navigate the DOM), the auth
 * tools (so it can see and extend its own authority), and whatever the
 * application adds. Every one of them passes through the same policy guard:
 * authentication, scoped delegation, rate limiting, human confirmation, audit.
 */
export function createWebMCP(config: WebMCPConfig = {}): WebMCPHandle {
  const endpoints = resolveEndpoints(config.basePath, config.endpoints);
  const grants = new GrantStore();
  const entitlements = new EntitlementStore();
  const policy = config.policy ?? {};
  const rateLimiter = new RateLimiter(
    policy.rateLimit ?? { limit: 30, windowMs: 60_000 }
  );
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;

  let cachedSession: WebMCPSession | null = config.session ?? null;
  let cachedAt = config.session !== undefined ? Date.now() : 0;

  const getSession = async (force = false): Promise<WebMCPSession | null> => {
    if (config.getSession) return config.getSession();
    if (config.session !== undefined && !force) return config.session;
    if (!force && cachedAt && Date.now() - cachedAt < SESSION_CACHE_MS) {
      return cachedSession;
    }

    if (typeof fetchImpl !== "function") return null;

    try {
      const response = await fetchImpl(endpoints.session, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        cachedSession = null;
      } else {
        const data = (await response.json()) as {
          session?: WebMCPSession | null;
        } & Partial<WebMCPSession>;
        cachedSession =
          (data?.session ?? (data?.user ? (data as WebMCPSession) : null)) ||
          null;
      }
    } catch (_error) {
      cachedSession = null;
    }

    cachedAt = Date.now();
    return cachedSession;
  };

  const guardContext: GuardContext = {
    policy,
    endpoints,
    grants,
    getSession: () => getSession(),
    rateLimiter,
    entitlements,
    ...(config.paywall?.pricing ? { pricing: config.paywall.pricing } : {}),
    ...(config.fetchImpl ? { fetchImpl: config.fetchImpl } : {}),
  };

  const namespaced = (name: string) =>
    config.namespace ? `${config.namespace}_${name}` : name;

  const buildTools = (): WebMCPToolDefinition[] => {
    const collected: WebMCPToolDefinition[] = [];

    if (config.auth !== false) {
      const authOptions = typeof config.auth === "object" ? config.auth : {};
      collected.push(...createAuthTools({ ...authOptions, endpoints, grants }));
    }

    if (config.page !== false) {
      const pageOptions = typeof config.page === "object" ? config.page : {};
      collected.push(...createPageTools(pageOptions));
    }

    const appTools =
      typeof config.tools === "function" ? config.tools() : config.tools;
    if (appTools?.length) collected.push(...appTools);

    // Later definitions win, so an app can override a built-in by name.
    const byName = new Map<string, WebMCPToolDefinition>();
    for (const tool of collected) {
      byName.set(tool.name, { ...tool, name: namespaced(tool.name) });
    }
    return Array.from(byName.values());
  };

  let descriptors = new Map<string, ModelContextToolDescriptor>();
  let registration: RegistrationHandle | null = null;
  let disposed = false;
  let refreshing: Promise<void> | null = null;
  const cleanups: Array<() => void> = [];

  const execute = async (
    name: string,
    args: Record<string, unknown> = {}
  ): Promise<ToolResponse> => {
    const descriptor = descriptors.get(name);
    if (!descriptor) {
      return toToolResponse(
        {
          error: "unknown_tool",
          message: `No tool named "${name}". Available: ${Array.from(descriptors.keys()).join(", ")}`,
        },
        { isError: true }
      );
    }
    return (await descriptor.execute(args)) as ToolResponse;
  };

  const bridge: WebMCPBridge = {
    version: 1,
    provider: "@warpy-auth-sdk/core",
    tools: [],
    call: (name, args) => execute(name, args ?? {}),
  };

  /**
   * Shape of the published tool table. Re-registration is driven by this, not by
   * the implementations behind it: a host that sees a `toolchange` on every DOM
   * mutation churns its tool list for nothing.
   */
  const signatureOf = (tools: ModelContextToolDescriptor[]): string =>
    JSON.stringify(
      tools.map((tool) => [
        tool.name,
        tool.description,
        tool.inputSchema ?? null,
        tool.annotations ?? null,
      ])
    );

  let signature = "";

  const register = async (): Promise<void> => {
    if (disposed) return;

    const next = buildTools().map((tool) => guardTool(tool, guardContext));
    descriptors = new Map(next.map((tool) => [tool.name, tool]));

    const nextSignature = signatureOf(next);
    if (registration && nextSignature === signature) {
      // Same tool table, possibly new implementations behind it. What the
      // browser holds delegates through `descriptors`, so it is already current.
      return;
    }
    signature = nextSignature;

    // Delegate rather than hand the guarded closures over directly: the browser
    // keeps these objects for the lifetime of the registration, and a tool's
    // implementation can change without its shape changing.
    const published: ModelContextToolDescriptor[] = next.map((tool) => ({
      name: tool.name,
      description: tool.description,
      ...(tool.inputSchema ? { inputSchema: tool.inputSchema } : {}),
      ...(tool.annotations ? { annotations: tool.annotations } : {}),
      execute: (args: Record<string, unknown>) => execute(tool.name, args),
    }));

    bridge.tools = published;

    registration?.dispose();
    registration = await registerTools(published, {
      bridge,
      ...(policy.exposedTo ? { exposedTo: policy.exposedTo } : {}),
    });
  };

  const refresh = (): Promise<void> => {
    if (refreshing) return refreshing;
    refreshing = register()
      .catch((error: unknown) => {
        const wrapped =
          error instanceof Error ? error : new Error(String(error));
        if (config.onError) config.onError(wrapped);
        else console.error("[webmcp] registration failed:", wrapped);
      })
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  };

  const handle: WebMCPHandle = {
    get supported() {
      return isWebMCPSupported();
    },
    get host() {
      return registration?.host ?? "none";
    },
    get tools() {
      return Array.from(descriptors.keys());
    },
    grants,
    entitlements,
    refresh,
    getSession,
    execute,
    dispose: () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
      cleanups.length = 0;
      registration?.dispose();
      registration = null;
      descriptors = new Map();
      grants.clear();
      entitlements.clear();
    },
  };

  if (config.watch !== false) {
    cleanups.push(
      ...watchPage({
        // A route change replaces the page, so refs issued against the old one
        // must not resolve against the new one.
        onNavigate: () => {
          resetRefs();
          void refresh();
        },
        // A DOM edit only changes what is on the page. Refs stay valid, and
        // resolveRef already rejects elements that have since been removed.
        onMutate: () => void refresh(),
      })
    );
  }

  void refresh().then(() => {
    if (disposed) return;
    if (!isSecureContext()) {
      console.warn(
        "[webmcp] Not a secure context. Browsers only expose WebMCP over HTTPS (or localhost); tools were published to the fallback bridge only."
      );
    }
    config.onReady?.(handle);
  });

  return handle;
}

/**
 * Watches for changes to the page the user is looking at: SPA route transitions
 * (history API and back/forward) call `onNavigate`, structural DOM edits that
 * may add or remove annotated forms call `onMutate`. Both are debounced.
 */
function watchPage(handlers: {
  onNavigate: () => void;
  onMutate: () => void;
}): Array<() => void> {
  const scope = globalThis as unknown as {
    window?: Window & typeof globalThis;
    document?: Document;
    MutationObserver?: typeof MutationObserver;
    setTimeout?: typeof setTimeout;
    clearTimeout?: typeof clearTimeout;
  };

  const win = scope.window;
  const doc = scope.document;
  if (!win || !doc) return [];

  const cleanups: Array<() => void> = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  let pendingNavigation = false;

  const schedule = (navigation: boolean) => {
    pendingNavigation = pendingNavigation || navigation;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const navigated = pendingNavigation;
      pendingNavigation = false;
      if (navigated) handlers.onNavigate();
      else handlers.onMutate();
    }, 300);
  };

  const onPopState = () => schedule(true);
  win.addEventListener("popstate", onPopState);
  cleanups.push(() => win.removeEventListener("popstate", onPopState));

  // History methods do not emit events, so wrap them once and restore on dispose.
  const history = win.history as History & { __webmcpPatched?: boolean };
  if (history && !history.__webmcpPatched) {
    const originalPush = history.pushState;
    const originalReplace = history.replaceState;

    history.pushState = function patchedPushState(
      ...args: Parameters<History["pushState"]>
    ) {
      const result = originalPush.apply(this, args);
      schedule(true);
      return result;
    };
    history.replaceState = function patchedReplaceState(
      ...args: Parameters<History["replaceState"]>
    ) {
      const result = originalReplace.apply(this, args);
      schedule(true);
      return result;
    };
    history.__webmcpPatched = true;

    cleanups.push(() => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      delete history.__webmcpPatched;
    });
  }

  if (typeof scope.MutationObserver === "function" && doc.body) {
    const observer = new scope.MutationObserver((records) => {
      // Only structural changes can add or remove tools; ignore text edits.
      const structural = records.some(
        (record) =>
          record.type === "childList" &&
          (record.addedNodes.length > 0 || record.removedNodes.length > 0)
      );
      if (structural) schedule(false);
    });
    observer.observe(doc.body, { childList: true, subtree: true });
    cleanups.push(() => observer.disconnect());
  }

  cleanups.push(() => {
    if (timer) clearTimeout(timer);
  });

  return cleanups;
}
