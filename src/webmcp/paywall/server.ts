import { signJWT, verifyJWT, type JWTPayload } from "../../utils/jwt";
import type {
  PaymentChallenge,
  PaywallContext,
  PaywallProvider,
  PaywallQuoteResponse,
  PaywallRedemption,
  PricingTable,
  ToolPrice,
  UsageStore,
} from "./types";

const DEFAULT_WINDOW_SECONDS = 900;

export interface PaywallOptions {
  /** The payment rail. Without one, pricing is advertised but never enforced. */
  provider?: PaywallProvider;
  /**
   * Authoritative price list, keyed by tool name.
   *
   * The page has its own copy for display, but only this one decides what a
   * call costs — a price that lives solely in the browser is a suggestion.
   */
  pricing?: PricingTable;
  /** Metering store. Default: in-memory. */
  usageStore?: UsageStore;
  /** Receipt lifetime when the price does not say. Default: 900. */
  receiptSeconds?: number;
  /** Called after every successful payment, for ledgers and revenue reporting. */
  onPayment?: (event: {
    tool: string;
    provider: string;
    userId?: string;
    agentId?: string;
    payer?: string;
    amount?: string;
    currency?: string;
    transaction?: string;
    calls: number;
    timestamp: string;
  }) => void;
  /** Called when a payment attempt is refused. */
  onPaymentFailed?: (event: {
    tool: string;
    provider: string;
    reason: string;
    userId?: string;
    timestamp: string;
  }) => void;
}

/**
 * Default in-memory meter.
 *
 * Counts uses per receipt so one payment cannot be replayed indefinitely.
 * Single-process only: behind a load balancer each node keeps its own tally, so
 * a receipt for one call is worth one call *per node*. Use a shared store.
 */
export function createMemoryUsageStore(): UsageStore {
  const used = new Map<string, { count: number; expiresAt: number }>();

  return {
    consume(receiptId: string, limit: number, expiresAt: number) {
      const now = Date.now();
      for (const [key, entry] of used) {
        if (entry.expiresAt <= now) used.delete(key);
      }

      const entry = used.get(receiptId) ?? { count: 0, expiresAt };
      if (entry.count >= limit) return false;

      entry.count += 1;
      used.set(receiptId, entry);
      return true;
    },
  };
}

const sharedUsageStore = createMemoryUsageStore();

function randomId(): string {
  const webcrypto = (globalThis as { crypto?: Crypto }).crypto;
  if (webcrypto?.randomUUID) return webcrypto.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Identifies who a free allowance belongs to. */
function payerKey(context: {
  userId?: string;
  agentId?: string;
  request: Request;
}): string {
  return (
    context.userId ??
    context.agentId ??
    context.request.headers.get("x-forwarded-for") ??
    context.request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

function receiptToken(
  secret: string,
  claims: {
    tool: string;
    provider: string;
    calls: number;
    seconds: number;
    userId?: string;
    agentId?: string;
    payer?: string;
  }
): { token: string; id: string } {
  const id = randomId();
  const payload: JWTPayload = {
    userId: claims.userId ?? claims.payer ?? "anonymous",
    type: "webmcp-receipt",
    tool: claims.tool,
    provider: claims.provider,
    calls: claims.calls,
    nonce: id,
    ...(claims.agentId ? { agentId: claims.agentId } : {}),
    ...(claims.payer ? { payer: claims.payer } : {}),
  };

  return { token: signJWT(payload, secret, `${claims.seconds}s`), id };
}

function buildContext(
  request: Request,
  tool: string,
  price: ToolPrice,
  actor: { userId?: string; agentId?: string }
): PaywallContext {
  const url = new URL(request.url);
  return {
    tool,
    price,
    resourceUrl: `${url.origin}${url.pathname.replace(/\/paywall\/(quote|settle)$/, "")}/tool/${tool}`,
    ...(actor.userId ? { userId: actor.userId } : {}),
    ...(actor.agentId ? { agentId: actor.agentId } : {}),
    request,
  };
}

async function grantReceipt(
  secret: string,
  context: PaywallContext,
  provider: string,
  redemption: Extract<PaywallRedemption, { ok: true }>,
  options: PaywallOptions
): Promise<PaywallQuoteResponse> {
  const calls = redemption.calls ?? context.price.calls ?? 1;
  const seconds =
    redemption.expiresInSeconds ??
    context.price.windowSeconds ??
    options.receiptSeconds ??
    DEFAULT_WINDOW_SECONDS;

  const { token } = receiptToken(secret, {
    tool: context.tool,
    provider,
    calls,
    seconds,
    ...(context.userId ? { userId: context.userId } : {}),
    ...(context.agentId ? { agentId: context.agentId } : {}),
    ...(redemption.payer ? { payer: redemption.payer } : {}),
  });

  options.onPayment?.({
    tool: context.tool,
    provider,
    calls,
    ...(context.userId ? { userId: context.userId } : {}),
    ...(context.agentId ? { agentId: context.agentId } : {}),
    ...(redemption.payer ? { payer: redemption.payer } : {}),
    ...(redemption.amount ? { amount: redemption.amount } : {}),
    ...(redemption.currency ? { currency: redemption.currency } : {}),
    ...(redemption.transaction ? { transaction: redemption.transaction } : {}),
    timestamp: new Date().toISOString(),
  });

  return {
    paid: true,
    receipt: {
      token,
      calls,
      expires: new Date(Date.now() + seconds * 1000).toISOString(),
      ...(redemption.payer ? { payer: redemption.payer } : {}),
      ...(redemption.transaction
        ? { transaction: redemption.transaction }
        : {}),
    },
  };
}

/**
 * `POST {basePath}/webmcp/paywall/quote`
 *
 * Answers "what would this cost, and do I already have access?" — a free
 * allowance, a subscription that covers it, or a payment challenge. Nothing is
 * charged here.
 */
export async function quotePaywall(
  request: Request,
  secret: string,
  actor: { userId?: string; agentId?: string },
  options: PaywallOptions
): Promise<Response> {
  let body: { tool?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch (_error) {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const tool = typeof body.tool === "string" ? body.tool : "";
  if (!tool) return json({ error: "A tool name is required" }, 400);

  const price = options.pricing?.[tool];
  if (!price) {
    // Not priced: free, and it stays free no matter what the page believes.
    return json({ paid: true } satisfies PaywallQuoteResponse);
  }

  const context = buildContext(request, tool, price, actor);
  const store = options.usageStore ?? sharedUsageStore;

  // A free allowance is metered like anything else, keyed to the payer.
  if (price.freeCalls && price.freeCalls > 0) {
    const windowSeconds = price.windowSeconds ?? DEFAULT_WINDOW_SECONDS;
    const allowed = await store.consume(
      `free:${tool}:${payerKey(context)}`,
      price.freeCalls,
      Date.now() + windowSeconds * 1000
    );

    if (allowed) {
      return json(
        await grantReceipt(
          secret,
          context,
          "free",
          { ok: true, calls: 1, expiresInSeconds: windowSeconds },
          options
        )
      );
    }
  }

  const provider = options.provider;
  if (!provider) {
    return json(
      { error: "This tool is priced but no payment provider is configured" },
      501
    );
  }

  if (provider.entitled) {
    const entitlement = await provider.entitled(context);
    const redemption: PaywallRedemption =
      typeof entitlement === "boolean"
        ? entitlement
          ? { ok: true }
          : { ok: false, reason: "not_entitled" }
        : entitlement;

    if (redemption.ok) {
      return json(
        await grantReceipt(secret, context, provider.name, redemption, options)
      );
    }
  }

  const challenge: PaymentChallenge = await provider.quote(context);

  // 402 is the honest status here, and agents that speak x402 look for it.
  return json({ paid: false, challenge } satisfies PaywallQuoteResponse, 402);
}

/**
 * `POST {basePath}/webmcp/paywall/settle`
 *
 * Takes a proof of payment, verifies and settles it through the provider, and
 * returns a receipt. This is the only place money actually moves.
 */
export async function settlePaywall(
  request: Request,
  secret: string,
  actor: { userId?: string; agentId?: string },
  options: PaywallOptions
): Promise<Response> {
  let body: { tool?: unknown; payment?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch (_error) {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const tool = typeof body.tool === "string" ? body.tool : "";
  if (!tool) return json({ error: "A tool name is required" }, 400);

  const price = options.pricing?.[tool];
  if (!price) return json({ paid: true } satisfies PaywallQuoteResponse);

  const provider = options.provider;
  if (!provider) {
    return json(
      { error: "This tool is priced but no payment provider is configured" },
      501
    );
  }

  const context = buildContext(request, tool, price, actor);
  const redemption = await provider.redeem(context, body.payment);

  if (!redemption.ok) {
    options.onPaymentFailed?.({
      tool,
      provider: provider.name,
      reason: redemption.reason,
      ...(actor.userId ? { userId: actor.userId } : {}),
      timestamp: new Date().toISOString(),
    });

    return json(
      { paid: false, error: "payment_failed", message: redemption.reason },
      402
    );
  }

  return json(
    await grantReceipt(secret, context, provider.name, redemption, options)
  );
}

export interface PaymentClaims {
  tool: string;
  provider: string;
  calls: number;
  userId?: string;
  agentId?: string;
  payer?: string;
}

/**
 * Verifies the receipt on an incoming request and spends one call from it.
 *
 * Call this in the API route a paid tool actually hits. The page-side gate
 * tells an agent it must pay; this is what makes that true.
 */
export async function verifyWebMCPPayment(
  request: Request,
  secret: string,
  options: { tool?: string; usageStore?: UsageStore } = {}
): Promise<PaymentClaims | null> {
  const token = request.headers.get("x-webmcp-receipt");
  if (!token) return null;

  const payload = verifyJWT(token, secret);
  if (!payload || payload.type !== "webmcp-receipt") return null;

  // A receipt buys calls of one named tool, not access in general.
  if (options.tool && payload.tool !== options.tool) return null;
  if (!payload.nonce) return null;

  const calls = payload.calls ?? 1;
  const store = options.usageStore ?? sharedUsageStore;
  const allowed = await store.consume(
    payload.nonce,
    calls,
    Date.now() + DEFAULT_WINDOW_SECONDS * 1000
  );
  if (!allowed) return null;

  return {
    tool: payload.tool ?? "",
    provider: payload.provider ?? "unknown",
    calls,
    ...(payload.userId ? { userId: payload.userId } : {}),
    ...(payload.agentId ? { agentId: payload.agentId } : {}),
    ...(payload.payer ? { payer: payload.payer } : {}),
  };
}

/**
 * Guard for a route that agent traffic must pay for, but the site's own users
 * must not.
 *
 * Requiring a receipt unconditionally is the obvious mistake here: it breaks
 * every human page load of your own app. This allows a normal session through
 * and charges only callers that arrive as agents.
 *
 * Note what this can and cannot do. An agent running inside the user's tab
 * holds their session, so it can always reach this route the way the person
 * would; header-based detection is a billing signal, not a security boundary.
 * It bills cooperative agents and blocks agents that have no session at all.
 * For hard enforcement, gate on something the person's own plan does not
 * include and check `paid` for every caller.
 */
export async function authorizePaidRequest(
  request: Request,
  secret: string,
  options: {
    tool?: string;
    usageStore?: UsageStore;
    /** Require payment from human callers too. Default: false. */
    chargeEveryone?: boolean;
  } = {}
): Promise<{
  allowed: boolean;
  actor: "human" | "agent";
  paid: boolean;
  claims?: PaymentClaims;
  reason?: string;
}> {
  const claims = await verifyWebMCPPayment(request, secret, options);
  const isAgent =
    request.headers.has("x-webmcp-tool") ||
    request.headers.has("x-webmcp-receipt");
  const actor = isAgent ? ("agent" as const) : ("human" as const);

  if (claims) return { allowed: true, actor, paid: true, claims };

  if (!isAgent && !options.chargeEveryone) {
    return { allowed: true, actor, paid: false };
  }

  return {
    allowed: false,
    actor,
    paid: false,
    reason: request.headers.has("x-webmcp-receipt")
      ? "The receipt is invalid, expired, spent, or was bought for another tool."
      : "Payment is required for this call.",
  };
}

/** Machine-readable price list for the manifest, so agents can shop before calling. */
export function describePricing(
  pricing: PricingTable = {}
): Array<ToolPrice & { tool: string }> {
  return Object.entries(pricing).map(([tool, price]) => ({
    tool,
    ...price,
    currency: price.currency ?? "USD",
    calls: price.calls ?? 1,
  }));
}
