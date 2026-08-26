import type {
  ModelContext,
  ModelContextHost,
  ModelContextToolDescriptor,
  RegisterToolOptions,
  ToolResponse,
} from "./types";

/**
 * Global fallback bridge. When the browser has no WebMCP implementation we
 * still publish the tool table on `window.__webmcp__` so extensions, polyfills
 * and test harnesses can discover and drive the page.
 */
export const BRIDGE_KEY = "__webmcp__";

export interface WebMCPBridge {
  version: 1;
  /** Provider that published these tools ("@warpy-auth-sdk/core"). */
  provider: string;
  tools: ModelContextToolDescriptor[];
  call: (name: string, args?: Record<string, unknown>) => Promise<ToolResponse>;
}

type BridgeHost = Record<string, unknown> & { [BRIDGE_KEY]?: WebMCPBridge };

function globalScope(): BridgeHost | null {
  return typeof globalThis === "undefined"
    ? null
    : (globalThis as unknown as BridgeHost);
}

/**
 * Locates the `modelContext` binding.
 *
 * `document.modelContext` is the current spec surface;
 * `navigator.modelContext` is the deprecated pre-Chrome 150 location and is
 * still what ships in a number of Chromium builds, so both are probed.
 */
export function getModelContext(): {
  context: ModelContext | null;
  host: ModelContextHost;
} {
  const scope = globalScope() as
    | (BridgeHost & {
        document?: { modelContext?: ModelContext };
        navigator?: { modelContext?: ModelContext };
      })
    | null;

  if (!scope) return { context: null, host: "none" };

  const fromDocument = scope.document?.modelContext;
  if (fromDocument) return { context: fromDocument, host: "document" };

  const fromNavigator = scope.navigator?.modelContext;
  if (fromNavigator) return { context: fromNavigator, host: "navigator" };

  return { context: null, host: "none" };
}

/** True when the page can register tools with a real WebMCP implementation. */
export function isWebMCPSupported(): boolean {
  const { context } = getModelContext();
  if (!context) return false;
  return (
    typeof context.registerTool === "function" ||
    typeof context.provideContext === "function"
  );
}

/**
 * WebMCP requires a secure context. Registration silently no-ops on plain HTTP,
 * so surfacing this lets callers warn during development.
 */
export function isSecureContext(): boolean {
  const scope = globalScope() as
    | (BridgeHost & {
        isSecureContext?: boolean;
        location?: { protocol?: string; hostname?: string };
      })
    | null;
  if (!scope) return false;
  if (typeof scope.isSecureContext === "boolean") return scope.isSecureContext;
  const protocol = scope.location?.protocol;
  const hostname = scope.location?.hostname;
  return (
    protocol === "https:" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

export interface RegistrationHandle {
  host: ModelContextHost;
  registered: string[];
  dispose: () => void;
}

/**
 * Registers descriptors with the browser and returns a handle that removes them
 * again. Unregistration follows the current spec (abort the signal passed to
 * `registerTool`) and falls back to `unregisterTool`/`provideContext` on older
 * builds.
 */
export async function registerTools(
  descriptors: ModelContextToolDescriptor[],
  options: RegisterToolOptions & {
    bridge?: WebMCPBridge;
  } = {}
): Promise<RegistrationHandle> {
  const { context, host } = getModelContext();
  const controller = new AbortController();
  const registered: string[] = [];

  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener("abort", () => controller.abort());
  }

  if (options.bridge) publishBridge(options.bridge);

  if (context && typeof context.registerTool === "function") {
    for (const descriptor of descriptors) {
      await context.registerTool(descriptor, {
        signal: controller.signal,
        ...(options.exposedTo ? { exposedTo: options.exposedTo } : {}),
      });
      registered.push(descriptor.name);
    }
  } else if (context && typeof context.provideContext === "function") {
    // Legacy bulk API: it replaces the whole tool table, so tools registered by
    // other scripts on the page would be dropped. Merge with whatever the page
    // already published through the bridge before replacing.
    context.provideContext({ tools: descriptors });
    registered.push(...descriptors.map((tool) => tool.name));
  }

  const dispose = () => {
    controller.abort();
    if (context && typeof context.unregisterTool === "function") {
      // Older builds ignore the abort signal; ask explicitly as well.
      for (const name of registered) {
        try {
          context.unregisterTool(name);
        } catch (_error) {
          // Best effort: the tool may already be gone.
        }
      }
    } else if (
      context &&
      typeof context.registerTool !== "function" &&
      typeof context.provideContext === "function"
    ) {
      context.provideContext({ tools: [] });
    }
    if (options.bridge) removeBridge(options.bridge);
  };

  return {
    host: context ? host : options.bridge ? "bridge" : "none",
    registered,
    dispose,
  };
}

function publishBridge(bridge: WebMCPBridge): void {
  const scope = globalScope();
  if (!scope) return;
  scope[BRIDGE_KEY] = bridge;
  const dispatch = (
    scope as unknown as {
      dispatchEvent?: (event: unknown) => void;
      CustomEvent?: new (type: string, init?: unknown) => unknown;
    }
  ).dispatchEvent;
  const CustomEventCtor = (
    scope as unknown as {
      CustomEvent?: new (type: string, init?: unknown) => unknown;
    }
  ).CustomEvent;
  if (typeof dispatch === "function" && CustomEventCtor) {
    try {
      dispatch.call(
        scope,
        new CustomEventCtor("webmcp:toolschanged", {
          detail: { tools: bridge.tools.map((tool) => tool.name) },
        })
      );
    } catch (_error) {
      // Event dispatch is advisory only.
    }
  }
}

function removeBridge(bridge: WebMCPBridge): void {
  const scope = globalScope();
  if (!scope) return;
  if (scope[BRIDGE_KEY] === bridge) delete scope[BRIDGE_KEY];
}

/** Normalizes any tool return value into the `ToolResponse` shape hosts expect. */
export function toToolResponse(
  value: unknown,
  options: { isError?: boolean; maxChars?: number } = {}
): ToolResponse {
  const maxChars = options.maxChars ?? 20000;

  if (isToolResponse(value)) {
    return options.isError ? { ...value, isError: true } : value;
  }

  let text: string;
  let structured: unknown;

  if (typeof value === "string") {
    text = value;
  } else if (value === undefined || value === null) {
    text = options.isError ? "Tool failed." : "Done.";
  } else {
    structured = value;
    try {
      text = JSON.stringify(value, null, 2);
    } catch (_error) {
      text = String(value);
    }
  }

  if (text.length > maxChars) {
    text = `${text.slice(0, maxChars)}\n…[truncated ${text.length - maxChars} characters]`;
  }

  return {
    content: [{ type: "text", text }],
    ...(structured !== undefined ? { structuredContent: structured } : {}),
    ...(options.isError ? { isError: true } : {}),
  };
}

function isToolResponse(value: unknown): value is ToolResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { content?: unknown };
  return (
    Array.isArray(candidate.content) &&
    candidate.content.every(
      (block) =>
        !!block &&
        typeof block === "object" &&
        (block as { type?: unknown }).type === "text"
    )
  );
}
