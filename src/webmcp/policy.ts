import type {
  ConfirmHandler,
  ConfirmRequest,
  JSONSchema,
  ModelContextToolDescriptor,
  ToolResponse,
  WebMCPAuditEvent,
  WebMCPDenialReason,
  WebMCPEndpoints,
  WebMCPFetch,
  WebMCPPolicy,
  WebMCPRateLimit,
  WebMCPSession,
  WebMCPToolDefinition,
} from "./types";
import type { GrantStore } from "./grant";
import { toToolResponse } from "./runtime";
import type { EntitlementStore } from "./paywall/entitlement";
import type {
  PaymentChallenge,
  PaymentReceipt,
  PricingTable,
  ToolPrice,
} from "./paywall/types";
import { requestQuote, requestSettle } from "./paywall/client";

const DEFAULT_RATE_LIMIT: WebMCPRateLimit = { limit: 30, windowMs: 60_000 };
const DEFAULT_REDACT = [
  "password",
  "token",
  "secret",
  "code",
  "otp",
  "captchaToken",
  "authorization",
  // A payment payload is a signed instruction to move money. It never belongs
  // in a log line.
  "payment",
  "apiKey",
  "accessToken",
  "refreshToken",
  "creditCard",
  "cardNumber",
  "cvv",
  "ssn",
];

/** Sliding-window rate limiter, keyed by tool name. */
export class RateLimiter {
  private calls = new Map<string, number[]>();

  constructor(private readonly fallback: WebMCPRateLimit | false) {}

  check(tool: string, override?: WebMCPRateLimit): boolean {
    const limit = override ?? this.fallback;
    if (limit === false) return true;

    const now = Date.now();
    const window =
      this.calls.get(tool)?.filter((at) => now - at < limit.windowMs) ?? [];

    if (window.length >= limit.limit) {
      this.calls.set(tool, window);
      return false;
    }

    window.push(now);
    this.calls.set(tool, window);
    return true;
  }

  reset(tool?: string): void {
    if (tool) this.calls.delete(tool);
    else this.calls.clear();
  }
}

/** Replaces the value of any key that looks sensitive with `[redacted]`. */
export function redact(
  value: unknown,
  keys: string[] = DEFAULT_REDACT,
  depth = 0
): unknown {
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry, keys, depth + 1));
  }

  const lowered = keys.map((key) => key.toLowerCase());
  const output: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const isSensitive = lowered.some((needle) =>
      key.toLowerCase().includes(needle)
    );
    output[key] = isSensitive ? "[redacted]" : redact(entry, keys, depth + 1);
  }

  return output;
}

/** Default confirmation UI: the browser's own modal, which agents cannot forge. */
export function defaultConfirmHandler(request: ConfirmRequest): boolean {
  const scope = globalThis as unknown as {
    confirm?: (message?: string) => boolean;
  };
  if (typeof scope.confirm !== "function") {
    // No UI available (SSR, worker, test). Fail closed on destructive work.
    return !request.destructive;
  }
  return scope.confirm(request.message);
}

export interface GuardContext {
  policy: WebMCPPolicy;
  endpoints: WebMCPEndpoints;
  grants: GrantStore;
  getSession: () => Promise<WebMCPSession | null>;
  rateLimiter: RateLimiter;
  /** Receipts for paywalled tools. */
  entitlements?: EntitlementStore;
  /** Prices shown to agents. The server's table decides what is charged. */
  pricing?: PricingTable;
  /** Overridable for tests. Defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
}

export class ToolDenied extends Error {
  constructor(
    readonly reason: WebMCPDenialReason,
    message: string
  ) {
    super(message);
    this.name = "ToolDenied";
  }
}

/**
 * Argument an agent uses to retry a paid call with its proof of payment. Named
 * with a leading underscore so it cannot collide with a tool's own parameters.
 */
export const PAYMENT_ARG = "_payment";

let callCounter = 0;

function nextCallId(): string {
  callCounter += 1;
  return `wmcp_${Date.now().toString(36)}_${callCounter.toString(36)}`;
}

function isDestructive(tool: WebMCPToolDefinition): boolean {
  if (tool.annotations?.readOnlyHint) return false;
  // Matches the MCP default: absent `destructiveHint` means "assume destructive".
  return tool.annotations?.destructiveHint !== false;
}

function shouldConfirm(
  tool: WebMCPToolDefinition,
  policy: WebMCPPolicy
): boolean {
  const mode = tool.confirm ?? policy.confirm ?? "auto";
  if (mode === "never") return false;
  if (mode === "always") return true;
  return isDestructive(tool);
}

function confirmMessage(
  tool: WebMCPToolDefinition,
  args: Record<string, unknown>
): string {
  const custom = tool.confirmMessage;
  if (typeof custom === "function") return custom(args);
  if (typeof custom === "string") return custom;

  const summary = Object.entries(args)
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${summarize(value)}`)
    .join("\n");

  return [
    `An AI agent wants to run "${tool.name}" on this page.`,
    "",
    tool.description,
    summary ? `\n${summary}` : "",
    "",
    "Allow this action?",
  ].join("\n");
}

function summarize(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 120 ? `${value.slice(0, 120)}…` : value;
  }
  try {
    const json = JSON.stringify(value);
    return json && json.length > 120 ? `${json.slice(0, 120)}…` : String(json);
  } catch (_error) {
    return String(value);
  }
}

/**
 * Wraps a tool definition into a plain WebMCP descriptor, enforcing the auth
 * policy first: authentication, scoped delegation, rate limit and human
 * confirmation all run before `execute` is reached, and every outcome is
 * audited.
 */
export function guardTool(
  tool: WebMCPToolDefinition,
  context: GuardContext
): ModelContextToolDescriptor {
  const { policy } = context;
  const redactKeys = policy.redact ?? DEFAULT_REDACT;

  const audit = (event: Omit<WebMCPAuditEvent, "timestamp">) => {
    if (!policy.onAudit) return;
    try {
      policy.onAudit({ ...event, timestamp: new Date().toISOString() });
    } catch (_error) {
      // Auditing must never break a tool call.
    }
  };

  const requiredScopes = [...(policy.scopes ?? []), ...(tool.scopes ?? [])];
  const requiresAuth =
    tool.requireAuth ??
    (requiredScopes.length > 0 || policy.requireAuth === true);

  const price = tool.price ?? context.pricing?.[tool.name];

  return {
    name: tool.name,
    // Price belongs in the description: it is the one place every agent reads
    // before deciding whether to call a tool at all.
    description: price
      ? `${tool.description} (costs ${price.amount} ${price.currency ?? "USD"} per call${price.freeCalls ? `, first ${price.freeCalls} free` : ""})`
      : tool.description,
    inputSchema: price ? withPaymentArg(tool.inputSchema) : tool.inputSchema,
    annotations: {
      // Confirmed destructive tools still carry the hint so the host can add
      // its own gate on top of ours.
      destructiveHint: isDestructive(tool),
      ...tool.annotations,
    },
    execute: async (rawArgs: Record<string, unknown>) => {
      const args = (rawArgs ?? {}) as Record<string, unknown>;
      const id = nextCallId();
      const startedAt = Date.now();
      const safeArgs = redact(args, redactKeys) as Record<string, unknown>;

      audit({ id, tool: tool.name, phase: "start", args: safeArgs });

      const deny = (
        reason: WebMCPDenialReason,
        message: string,
        session: WebMCPSession | null
      ): ToolResponse => {
        audit({
          id,
          tool: tool.name,
          phase: "denied",
          reason,
          message,
          args: safeArgs,
          userId: session?.user?.id,
          durationMs: Date.now() - startedAt,
        });
        return toToolResponse(
          { error: reason, message },
          { isError: true, maxChars: policy.maxOutputChars }
        );
      };

      let session: WebMCPSession | null = null;

      try {
        session = await context.getSession();
      } catch (_error) {
        session = null;
      }

      if (requiresAuth && !session) {
        return deny(
          "unauthenticated",
          `"${tool.name}" requires a signed-in user. Ask the person to sign in, or call "auth_sign_in_email" first.`,
          session
        );
      }

      if (requiredScopes.length > 0) {
        const sessionScopes = session?.scopes ?? [];
        const coveredBySession =
          session?.type === "mcp-agent" &&
          requiredScopes.every((scope) => sessionScopes.includes(scope));

        if (!coveredBySession && !context.grants.has(requiredScopes)) {
          const missing = context.grants.missing(requiredScopes);
          return deny(
            "missing_scope",
            `"${tool.name}" needs delegated scopes [${missing.join(", ")}]. Call "auth_request_access" with those scopes; the person will be asked to approve.`,
            session
          );
        }
      }

      if (!context.rateLimiter.check(tool.name, tool.rateLimit)) {
        return deny(
          "rate_limited",
          `"${tool.name}" has been called too often. Wait before retrying.`,
          session
        );
      }

      // ---------------------------------------------------------------
      // Payment. Quoting never moves money; settling happens after the
      // person has approved, so a declined call is never a charged one.
      // ---------------------------------------------------------------
      const payment = args[PAYMENT_ARG];
      delete args[PAYMENT_ARG];

      let receipt: PaymentReceipt | null = null;
      let challenge: PaymentChallenge | null = null;

      if (price) {
        const entitlements = context.entitlements;
        if (!entitlements) {
          return deny(
            "policy",
            `"${tool.name}" is priced but this page has no paywall configured.`,
            session
          );
        }

        receipt = entitlements.get(tool.name);

        if (!receipt) {
          const quoted = await requestQuote(
            {
              quote: context.endpoints.paywallQuote,
              settle: context.endpoints.paywallSettle,
            },
            tool.name,
            paywallRequestOptions(context)
          );

          if (quoted.status === "error") {
            return deny("payment_required", quoted.message, session);
          }

          if (quoted.status === "paid") {
            receipt = quoted.receipt;
            entitlements.set(receipt);
          } else {
            challenge = quoted.challenge;

            // Nothing has happened yet, so hand the agent the challenge rather
            // than prompting a human about a call that cannot run.
            if (payment === undefined) {
              audit({
                id,
                tool: tool.name,
                phase: "denied",
                reason: "payment_required",
                message: challenge.instructions,
                args: safeArgs,
                userId: session?.user?.id,
                durationMs: Date.now() - startedAt,
              });

              return toToolResponse(
                {
                  error: "payment_required",
                  message: challenge.instructions,
                  price: challenge.price,
                  provider: challenge.provider,
                  ...(challenge.x402 ? { x402: challenge.x402 } : {}),
                  ...(challenge.extra ? { details: challenge.extra } : {}),
                  retry: `Call "${tool.name}" again with "${PAYMENT_ARG}" set to your proof of payment.`,
                },
                { isError: true, maxChars: policy.maxOutputChars }
              );
            }
          }
        }
      }

      const confirmHandler: ConfirmHandler =
        policy.confirmHandler ?? defaultConfirmHandler;

      const askUser = async (message: string): Promise<boolean> => {
        const approved = await confirmHandler({
          tool: tool.name,
          message,
          args: safeArgs,
          destructive: isDestructive(tool),
          scopes: requiredScopes,
          session,
        });
        return approved === true;
      };

      // Spending the person's own balance always asks, whatever the tool's
      // own annotations say. An agent paying from its own wallet does not.
      const spendsUserMoney = challenge?.chargesUser === true;

      if (shouldConfirm(tool, policy) || spendsUserMoney) {
        const approved = await askUser(
          priceAwareMessage(confirmMessage(tool, args), price, challenge)
        );
        if (!approved) {
          return deny(
            "declined_by_user",
            `The person declined "${tool.name}". Do not retry it without asking them first.`,
            session
          );
        }
      }

      if (price && !receipt) {
        const settled = await requestSettle(
          {
            quote: context.endpoints.paywallQuote,
            settle: context.endpoints.paywallSettle,
          },
          tool.name,
          payment,
          paywallRequestOptions(context)
        );

        if (settled.status !== "paid") {
          const message =
            settled.status === "error"
              ? settled.message
              : settled.challenge.instructions;

          audit({
            id,
            tool: tool.name,
            phase: "denied",
            reason: "payment_failed",
            message,
            args: safeArgs,
            userId: session?.user?.id,
            durationMs: Date.now() - startedAt,
          });

          return toToolResponse(
            { error: "payment_failed", message },
            { isError: true, maxChars: policy.maxOutputChars }
          );
        }

        receipt = settled.receipt;
        context.entitlements?.set(receipt);
      }

      // Spend one call from the receipt. The server meters the same receipt, so
      // this is a courtesy to the agent rather than the enforcement point.
      if (price && receipt) context.entitlements?.consume(tool.name);

      audit({
        id,
        tool: tool.name,
        phase: "allowed",
        args: safeArgs,
        scopes: requiredScopes,
        userId: session?.user?.id,
        agentId: context.grants.get()?.agentId,
      });

      try {
        const result = await tool.execute(args, {
          toolName: tool.name,
          session,
          scopes: requiredScopes,
          receipt,
          fetch: createToolFetch(tool.name, context, receipt),
          confirm: askUser,
        });

        audit({
          id,
          tool: tool.name,
          phase: "success",
          args: safeArgs,
          userId: session?.user?.id,
          durationMs: Date.now() - startedAt,
        });

        return toToolResponse(result, { maxChars: policy.maxOutputChars });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Tool execution failed";

        if (error instanceof ToolDenied) {
          return deny(error.reason, message, session);
        }

        audit({
          id,
          tool: tool.name,
          phase: "error",
          message,
          args: safeArgs,
          userId: session?.user?.id,
          durationMs: Date.now() - startedAt,
        });

        return toToolResponse(
          { error: "execution_failed", message },
          { isError: true, maxChars: policy.maxOutputChars }
        );
      }
    },
  };
}

function paywallRequestOptions(context: GuardContext) {
  const grant = context.grants.get();
  return {
    ...(context.fetchImpl ? { fetchImpl: context.fetchImpl } : {}),
    ...(grant ? { grantToken: grant.token } : {}),
  };
}

/** Adds the payment argument to a priced tool's schema. */
function withPaymentArg(schema?: JSONSchema): JSONSchema {
  const base: JSONSchema = schema ?? { type: "object", properties: {} };
  return {
    ...base,
    type: base.type ?? "object",
    properties: {
      ...(base.properties ?? {}),
      [PAYMENT_ARG]: {
        type: "string",
        description:
          "Proof of payment. Omit on the first call to receive the payment requirements, then retry with the value they describe.",
      },
    },
  };
}

/** Discloses what a confirmed call will cost, and who pays. */
function priceAwareMessage(
  message: string,
  price?: ToolPrice,
  challenge?: PaymentChallenge | null
): string {
  if (!price) return message;

  const cost = `${price.amount} ${price.currency ?? "USD"}`;
  const payer =
    challenge?.chargesUser === true
      ? "charged to your account"
      : "paid by the agent";

  return `${message}\n\nCost: ${cost} (${payer}).`;
}

/**
 * Builds the `fetch` handed to tools.
 *
 * Every agent-driven request is same-origin, credentialed, tagged with the
 * originating tool, and carries a single-use action token minted from the
 * active grant — so the backend can tell an agent write apart from a human one
 * and enforce scopes a second time on the server.
 */
export function createToolFetch(
  toolName: string,
  context: GuardContext,
  receipt?: PaymentReceipt | null
): WebMCPFetch {
  const fetchImpl = context.fetchImpl ?? globalThis.fetch;

  return async (input: string, init: RequestInit = {}) => {
    if (typeof fetchImpl !== "function") {
      throw new Error("fetch is unavailable in this environment");
    }

    assertSameOrigin(input);

    const headers = new Headers(init.headers ?? {});
    headers.set("X-WebMCP-Tool", toolName);

    // The receipt travels with the request so the API route can verify the call
    // was paid for, and spend it against the server-side meter.
    if (receipt?.token) headers.set("X-WebMCP-Receipt", receipt.token);

    const grant = context.grants.get();
    if (grant) {
      headers.set("X-WebMCP-Agent", grant.agentId);
      const actionToken = await mintActionToken(
        toolName,
        grant.token,
        context,
        fetchImpl
      );
      if (actionToken) headers.set("X-WebMCP-Action", actionToken);
    }

    return fetchImpl(input, {
      credentials: "same-origin",
      ...init,
      headers,
    });
  };
}

async function mintActionToken(
  toolName: string,
  grantToken: string,
  context: GuardContext,
  fetchImpl: typeof fetch
): Promise<string | null> {
  try {
    const response = await fetchImpl(context.endpoints.action, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${grantToken}`,
      },
      body: JSON.stringify({ tool: toolName }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  } catch (_error) {
    // Action tokens harden server-side checks; their absence must not break a
    // tool whose backend does not require them.
    return null;
  }
}

function assertSameOrigin(input: string): void {
  // Root-relative paths are same-origin by construction. "//host" is not.
  if (input.startsWith("/") && !input.startsWith("//")) return;

  const origin = (globalThis as unknown as { location?: { origin?: string } })
    .location?.origin;

  // No origin to compare against (SSR, worker, test): fail closed rather than
  // letting an absolute URL through unchecked.
  if (!origin) {
    throw new ToolDenied(
      "policy",
      `WebMCP tools may only call same-origin paths; "${input}" is not a relative path.`
    );
  }

  let url: URL;
  try {
    url = new URL(input, origin);
  } catch (_error) {
    throw new ToolDenied("policy", `Invalid request URL: ${input}`);
  }

  if (url.origin !== origin) {
    throw new ToolDenied(
      "policy",
      `Cross-origin requests are not allowed from WebMCP tools (${url.origin}).`
    );
  }
}

export const DEFAULT_REDACT_KEYS = DEFAULT_REDACT;
export const DEFAULT_TOOL_RATE_LIMIT = DEFAULT_RATE_LIMIT;
