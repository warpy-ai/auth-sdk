import type {
  PaywallContext,
  PaywallProvider,
  PaywallRedemption,
  ToolPrice,
} from "../types";

/**
 * Prepaid credits held on the user's own account.
 *
 * No payment rail, no wallet, no external dependency: the person tops up
 * through whatever billing you already have, and the agent spends against that
 * balance. Because this spends the *person's* money, the paywall marks it
 * `chargesUser`, which makes the confirmation prompt disclose the cost.
 */
export interface CreditsPaywallConfig {
  /** Credits currently available to this caller. */
  getBalance: (context: PaywallContext) => number | Promise<number>;
  /**
   * Deducts credits. Return false to refuse (race with another spend, account
   * suspended). Must be atomic in your storage — two tool calls can land at once.
   */
  charge: (
    context: PaywallContext,
    credits: number
  ) => boolean | Promise<boolean>;
  /** Price → credits. Default: the numeric value of `price.amount`. */
  toCredits?: (price: ToolPrice) => number;
  /** Where to send someone who has run out. */
  topUpUrl?: string;
  /** Label used in messages. Default: "credits". */
  unitLabel?: string;
}

export function creditsPaywall(config: CreditsPaywallConfig): PaywallProvider {
  const unit = config.unitLabel ?? "credits";
  const costOf = (price: ToolPrice) =>
    config.toCredits ? config.toCredits(price) : Number(price.amount);

  return {
    name: "credits",

    async quote(context) {
      const cost = costOf(context.price);
      const balance = await config.getBalance(context);
      const affordable = balance >= cost;

      return {
        provider: "credits",
        tool: context.tool,
        price: context.price,
        // The signed-in person's balance pays for this.
        chargesUser: true,
        instructions: affordable
          ? `Calling "${context.tool}" costs ${cost} ${unit}, from the signed-in person's balance of ${balance}. Call the tool again with "_payment" set to {"accept": true} to spend them. The person will be asked to approve.`
          : `Calling "${context.tool}" costs ${cost} ${unit} but the balance is ${balance}. Ask the person to top up${config.topUpUrl ? ` at ${config.topUpUrl}` : ""}; do not retry until they have.`,
        extra: {
          balance,
          cost,
          unit,
          affordable,
          ...(config.topUpUrl ? { topUpUrl: config.topUpUrl } : {}),
        },
      };
    },

    async redeem(context, proof): Promise<PaywallRedemption> {
      // Spending someone's balance needs an explicit opt-in from the caller,
      // never an implicit charge at quote time.
      const accepted =
        proof === true ||
        (typeof proof === "object" &&
          proof !== null &&
          (proof as { accept?: unknown }).accept === true);

      if (!accepted) {
        return {
          ok: false,
          reason: 'Set "_payment" to {"accept": true} to spend credits.',
        };
      }

      const cost = costOf(context.price);
      const balance = await config.getBalance(context);

      if (balance < cost) {
        return {
          ok: false,
          reason: `Insufficient ${unit}: ${cost} needed, ${balance} available.`,
        };
      }

      const charged = await config.charge(context, cost);
      if (!charged) {
        return { ok: false, reason: `Could not deduct ${cost} ${unit}.` };
      }

      return {
        ok: true,
        ...(context.price.calls ? { calls: context.price.calls } : {}),
        ...(context.userId ? { payer: context.userId } : {}),
        amount: String(cost),
        currency: unit,
      };
    },
  };
}
