import type {
  PaymentChallenge,
  PaymentReceipt,
  PaywallQuoteResponse,
} from "./types";

export interface PaywallEndpoints {
  quote: string;
  settle: string;
}

export interface PaywallRequestOptions {
  fetchImpl?: typeof fetch;
  /** Delegation token, so the server can attribute the payment to an agent. */
  grantToken?: string;
}

export type PaywallResult =
  | { status: "paid"; receipt: PaymentReceipt }
  | { status: "challenge"; challenge: PaymentChallenge }
  | { status: "error"; message: string };

async function post(
  endpoint: string,
  body: unknown,
  options: PaywallRequestOptions
): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is unavailable in this environment");
  }

  return fetchImpl(endpoint, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.grantToken
        ? { Authorization: `Bearer ${options.grantToken}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
}

function readResult(
  tool: string,
  payload: PaywallQuoteResponse & { message?: string; error?: string }
): PaywallResult {
  if (payload.paid && payload.receipt) {
    return {
      status: "paid",
      receipt: {
        tool,
        provider: payload.challenge?.provider ?? "server",
        calls: payload.receipt.calls,
        expiresAt: new Date(payload.receipt.expires).getTime(),
        token: payload.receipt.token,
        ...(payload.receipt.payer ? { payer: payload.receipt.payer } : {}),
        ...(payload.receipt.transaction
          ? { transaction: payload.receipt.transaction }
          : {}),
      },
    };
  }

  // No price configured server-side: the tool is free, so mint a local
  // entitlement rather than making every call re-ask.
  if (payload.paid) {
    return {
      status: "paid",
      receipt: {
        tool,
        provider: "free",
        calls: Number.MAX_SAFE_INTEGER,
        expiresAt: Date.now() + 5 * 60_000,
      },
    };
  }

  if (payload.challenge) {
    return { status: "challenge", challenge: payload.challenge };
  }

  return {
    status: "error",
    message: payload.message ?? payload.error ?? "Paywall request failed",
  };
}

/** Asks what a call costs and whether this caller already has access. */
export async function requestQuote(
  endpoints: PaywallEndpoints,
  tool: string,
  options: PaywallRequestOptions = {}
): Promise<PaywallResult> {
  try {
    const response = await post(endpoints.quote, { tool }, options);
    const payload = (await response.json()) as PaywallQuoteResponse & {
      message?: string;
      error?: string;
    };
    return readResult(tool, payload);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not reach the paywall",
    };
  }
}

/** Submits a proof of payment and returns the resulting receipt. */
export async function requestSettle(
  endpoints: PaywallEndpoints,
  tool: string,
  payment: unknown,
  options: PaywallRequestOptions = {}
): Promise<PaywallResult> {
  try {
    const response = await post(endpoints.settle, { tool, payment }, options);
    const payload = (await response.json()) as PaywallQuoteResponse & {
      message?: string;
      error?: string;
    };
    return readResult(tool, payload);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not reach the paywall",
    };
  }
}
