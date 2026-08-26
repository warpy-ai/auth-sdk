import type {
  PaymentChallenge,
  PaywallContext,
  PaywallProvider,
  PaywallRedemption,
  ToolPrice,
  X402PaymentRequired,
  X402PaymentRequirements,
  X402SettlementResponse,
} from "../types";

/**
 * x402 — the HTTP-native payment rail for agents.
 *
 * The agent signs a payment authorization, the server hands it to a
 * facilitator that verifies and settles on chain, and the call proceeds. No
 * account, no API key, no human in the loop: the agent pays from its own
 * wallet, per call.
 *
 * This provider never touches a chain itself. It builds the standard `402`
 * body and forwards proofs to the facilitator's `/verify` and `/settle`, which
 * is exactly how x402 servers are meant to integrate.
 */
export interface X402PaywallConfig {
  /** Address that receives payment. */
  payTo: string;
  /** Network id, e.g. "base" or "base-sepolia". */
  network: string;
  /** Token contract address, e.g. USDC on the chosen network. */
  asset: string;
  /** Facilitator base URL. Default: "https://x402.org/facilitator". */
  facilitatorUrl?: string;
  /** Headers for a facilitator that requires authentication. */
  facilitatorHeaders?: Record<string, string>;
  /** Value-transfer scheme. Default: "exact". */
  scheme?: string;
  /** Protocol version to speak. Default: 2. */
  version?: 1 | 2;
  /** Decimals of `asset`. Default: 6 (USDC). */
  decimals?: number;
  /** How long the agent has to pay. Default: 60. */
  maxTimeoutSeconds?: number;
  /** Extra data for the scheme, e.g. EIP-712 domain for `exact`. */
  extra?: Record<string, unknown>;
  /** Override the decimal → atomic units conversion. */
  toAtomicAmount?: (price: ToolPrice) => string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

/** Converts a decimal price string into integer atomic units, without floats. */
export function toAtomicUnits(amount: string, decimals: number): string {
  const trimmed = amount.trim();
  if (!/^\d*(\.\d*)?$/.test(trimmed) || trimmed === "" || trimmed === ".") {
    throw new Error(`Invalid price amount: "${amount}"`);
  }

  const [whole = "0", fraction = ""] = trimmed.split(".");
  const padded = (fraction + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${whole}${padded}`.replace(/^0+(?=\d)/, "");

  return combined === "" ? "0" : combined;
}

export function x402Paywall(config: X402PaywallConfig): PaywallProvider {
  const {
    payTo,
    network,
    asset,
    facilitatorUrl = "https://x402.org/facilitator",
    scheme = "exact",
    version = 2,
    decimals = 6,
    maxTimeoutSeconds = 60,
  } = config;

  const base = facilitatorUrl.replace(/\/$/, "");
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;

  const requirementsFor = (
    context: PaywallContext
  ): X402PaymentRequirements => {
    const atomic = config.toAtomicAmount
      ? config.toAtomicAmount(context.price)
      : toAtomicUnits(context.price.amount, decimals);

    const shared = {
      scheme,
      network,
      asset,
      payTo,
      maxTimeoutSeconds,
      description:
        context.price.description ?? `One call of the "${context.tool}" tool`,
      ...(config.extra ? { extra: config.extra } : {}),
    };

    // v1 carried the amount as maxAmountRequired and the resource inline;
    // v2 renamed it to amount and lifted the resource out of the array.
    return version === 1
      ? {
          ...shared,
          maxAmountRequired: atomic,
          resource: context.resourceUrl,
          mimeType: "application/json",
        }
      : { ...shared, amount: atomic };
  };

  const paymentRequired = (context: PaywallContext): X402PaymentRequired => ({
    x402Version: version,
    ...(version === 2
      ? {
          resource: {
            url: context.resourceUrl,
            description:
              context.price.description ??
              `One call of the "${context.tool}" tool`,
            mimeType: "application/json",
          },
        }
      : {}),
    accepts: [requirementsFor(context)],
  });

  const callFacilitator = async (
    endpoint: "verify" | "settle",
    paymentPayload: unknown,
    paymentRequirements: X402PaymentRequirements
  ): Promise<Record<string, unknown>> => {
    if (typeof fetchImpl !== "function") {
      throw new Error("fetch is unavailable; pass fetchImpl to x402Paywall");
    }

    const response = await fetchImpl(`${base}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.facilitatorHeaders ?? {}),
      },
      body: JSON.stringify({
        x402Version: version,
        paymentPayload,
        paymentRequirements,
      }),
    });

    if (!response.ok) {
      throw new Error(`Facilitator ${endpoint} failed with ${response.status}`);
    }

    return (await response.json()) as Record<string, unknown>;
  };

  return {
    name: "x402",

    quote(context): PaymentChallenge {
      return {
        provider: "x402",
        tool: context.tool,
        price: context.price,
        // The agent's wallet pays, not the person browsing.
        chargesUser: false,
        instructions: `Payment is required to call "${context.tool}". Pay ${context.price.amount} ${context.price.currency ?? "USDC"} using the x402 payment requirements below, then call the tool again with "_payment" set to the base64-encoded X-PAYMENT payload.`,
        x402: paymentRequired(context),
      };
    },

    async redeem(context, proof): Promise<PaywallRedemption> {
      const payload = decodePayment(proof);
      if (!payload) {
        return { ok: false, reason: "Payment payload missing or unreadable" };
      }

      const requirements = requirementsFor(context);

      try {
        const verification = await callFacilitator(
          "verify",
          payload,
          requirements
        );

        if (verification.isValid !== true) {
          return {
            ok: false,
            reason:
              (verification.invalidReason as string) ??
              "Facilitator rejected the payment",
          };
        }

        const settlement = (await callFacilitator(
          "settle",
          payload,
          requirements
        )) as unknown as X402SettlementResponse;

        if (!settlement.success) {
          return {
            ok: false,
            reason: settlement.errorReason ?? "Settlement failed",
          };
        }

        return {
          ok: true,
          ...(context.price.calls ? { calls: context.price.calls } : {}),
          ...(settlement.payer ? { payer: settlement.payer } : {}),
          ...(settlement.transaction
            ? { transaction: settlement.transaction }
            : {}),
          amount: context.price.amount,
          currency: context.price.currency ?? "USDC",
        };
      } catch (error) {
        return {
          ok: false,
          reason:
            error instanceof Error ? error.message : "Facilitator unreachable",
        };
      }
    },
  };
}

/**
 * Accepts the payment proof either as the decoded object or as the
 * base64-encoded `X-PAYMENT` / `PAYMENT-SIGNATURE` header value agents send.
 */
export function decodePayment(proof: unknown): Record<string, unknown> | null {
  if (proof && typeof proof === "object") {
    return proof as Record<string, unknown>;
  }

  if (typeof proof !== "string" || proof.trim() === "") return null;

  try {
    return JSON.parse(proof) as Record<string, unknown>;
  } catch (_error) {
    // Not raw JSON — try base64, which is how it travels on the wire.
  }

  try {
    const decoded =
      typeof atob === "function"
        ? atob(proof)
        : Buffer.from(proof, "base64").toString("utf8");
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch (_error) {
    return null;
  }
}
