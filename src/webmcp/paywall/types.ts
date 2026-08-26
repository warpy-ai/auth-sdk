/**
 * Paywall types for WebMCP tools.
 *
 * A paywalled tool answers an unpaid call with a machine-readable challenge
 * rather than a refusal, so an agent can pay and retry inside the same
 * conversation. The rail is pluggable: an agent wallet (x402), the user's own
 * prepaid credits, or an existing subscription.
 */

/** What one call of a tool costs. */
export interface ToolPrice {
  /** Decimal string, e.g. "0.01". Strings avoid float rounding on money. */
  amount: string;
  /** ISO currency or token symbol. Default: "USD". */
  currency?: string;
  /** Calls a single payment covers. Default: 1. */
  calls?: number;
  /** How long a payment stays valid, in seconds. Default: 900. */
  windowSeconds?: number;
  /** Calls allowed before the paywall applies, per payer. Default: 0. */
  freeCalls?: number;
  /** Shown to the agent and in the confirmation prompt. */
  description?: string;
  /** Plan identifier for subscription-style providers. */
  plan?: string;
}

/* ------------------------------- x402 wire -------------------------------- */

/** One acceptable way to pay, as carried in an x402 `accepts` array. */
export interface X402PaymentRequirements {
  scheme: string;
  network: string;
  /** Atomic units of `asset`. v2 field name. */
  amount?: string;
  /** v1 field name for the same value. */
  maxAmountRequired?: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  /** v1 carried the resource inline. */
  resource?: string;
  description?: string;
  mimeType?: string;
  extra?: Record<string, unknown>;
}

/** The body of an x402 `402 Payment Required` response. */
export interface X402PaymentRequired {
  x402Version: number;
  error?: string;
  resource?: {
    url: string;
    description?: string;
    mimeType?: string;
  };
  accepts: X402PaymentRequirements[];
  extensions?: Record<string, unknown>;
}

/** Facilitator settlement result. */
export interface X402SettlementResponse {
  success: boolean;
  errorReason?: string;
  payer?: string;
  transaction?: string;
  network?: string;
  amount?: string;
}

/* ------------------------------- challenges ------------------------------- */

/**
 * What an unpaid caller gets back: enough for an agent to decide whether to pay
 * and exactly how to do it.
 */
export interface PaymentChallenge {
  /** Provider that issued the challenge, e.g. "x402". */
  provider: string;
  tool: string;
  price: ToolPrice;
  /** Plain-language instructions for the model. */
  instructions: string;
  /** Present when the rail is x402: the standard `402` body. */
  x402?: X402PaymentRequired;
  /** True when paying spends the signed-in person's money, not the agent's. */
  chargesUser?: boolean;
  /** Provider-specific detail (credit balance, plan names, checkout URL). */
  extra?: Record<string, unknown>;
}

/** Proof that a tool call has been paid for. */
export interface PaymentReceipt {
  tool: string;
  provider: string;
  /** Calls remaining on this receipt. */
  calls: number;
  /** Epoch milliseconds. */
  expiresAt: number;
  payer?: string;
  amount?: string;
  currency?: string;
  /** On-chain transaction hash, invoice id, or equivalent. */
  transaction?: string;
  /**
   * Signed receipt the backend can verify. Stays in the page, like a
   * delegation: the agent is told it paid, not handed a bearer credential.
   */
  token?: string;
}

/* -------------------------------- providers ------------------------------- */

export interface PaywallContext {
  tool: string;
  price: ToolPrice;
  /** Signed-in user, when there is one. */
  userId?: string;
  /** Agent holding the delegation, when there is one. */
  agentId?: string;
  /** Absolute URL identifying the paid resource. */
  resourceUrl: string;
  /** The quote/settle request, for IP, headers and framework context. */
  request: Request;
}

export type PaywallRedemption =
  | {
      ok: true;
      /** Calls purchased. Defaults to `price.calls ?? 1`. */
      calls?: number;
      /** Receipt lifetime. Defaults to `price.windowSeconds ?? 900`. */
      expiresInSeconds?: number;
      payer?: string;
      amount?: string;
      currency?: string;
      transaction?: string;
    }
  | { ok: false; reason: string };

/**
 * A payment rail.
 *
 * `quote` describes what payment would be needed; `entitled` short-circuits it
 * for callers who have already paid by other means (a subscription, an
 * included plan); `redeem` turns a proof of payment into a receipt.
 */
export interface PaywallProvider {
  readonly name: string;
  /** True when this caller may proceed without paying now. */
  entitled?: (
    context: PaywallContext
  ) =>
    | boolean
    | Promise<boolean>
    | PaywallRedemption
    | Promise<PaywallRedemption>;
  quote: (
    context: PaywallContext
  ) => PaymentChallenge | Promise<PaymentChallenge>;
  redeem: (
    context: PaywallContext,
    proof: unknown
  ) => PaywallRedemption | Promise<PaywallRedemption>;
}

/** Pricing table, keyed by tool name. The server's copy is authoritative. */
export type PricingTable = Record<string, ToolPrice>;

/** Response of `POST {basePath}/webmcp/paywall/quote`. */
export interface PaywallQuoteResponse {
  paid: boolean;
  /** Present when `paid` is true: the caller may proceed. */
  receipt?: {
    token: string;
    calls: number;
    expires: string;
    payer?: string;
    transaction?: string;
  };
  /** Present when payment is required. */
  challenge?: PaymentChallenge;
}

/** Metering store: enforces how many calls a receipt actually buys. */
export interface UsageStore {
  /**
   * Records one use of a receipt. Returns false once the receipt is spent, so
   * a caller cannot replay a single payment across unlimited calls.
   */
  consume: (
    receiptId: string,
    limit: number,
    expiresAt: number
  ) => boolean | Promise<boolean>;
}
