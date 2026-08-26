import type { PaywallContext, PaywallProvider } from "../types";

/**
 * Access included with a plan the person already pays for.
 *
 * The SDK stays out of the billing relationship entirely — you answer "is this
 * account entitled?" from Stripe, your own database, or wherever the truth
 * lives, and the paywall turns a yes into a receipt. Use this when the *human*
 * pays and the agent inherits that access, rather than the agent paying per call.
 */
export interface SubscriptionPaywallConfig {
  /** True when this caller's plan covers the tool. */
  entitled: (context: PaywallContext) => boolean | Promise<boolean>;
  /** Where an unentitled person can subscribe. */
  upgradeUrl?: string;
  /** Plan name shown to the agent when access is refused. */
  planName?: string;
  /** Calls a single entitlement check covers before re-checking. Default: 25. */
  callsPerCheck?: number;
  /** How long an entitlement stands before re-checking, in seconds. Default: 300. */
  recheckSeconds?: number;
}

export function subscriptionPaywall(
  config: SubscriptionPaywallConfig
): PaywallProvider {
  const calls = config.callsPerCheck ?? 25;
  const expiresInSeconds = config.recheckSeconds ?? 300;

  return {
    name: "subscription",

    async entitled(context) {
      const allowed = await config.entitled(context);
      // Receipts are deliberately short-lived: a cancelled plan should stop
      // working in minutes, not when the tab closes.
      return allowed
        ? { ok: true, calls, expiresInSeconds }
        : { ok: false, reason: "not_entitled" };
    },

    async quote(context) {
      const plan = config.planName ?? "a paid plan";
      return {
        provider: "subscription",
        tool: context.tool,
        price: context.price,
        chargesUser: true,
        instructions: `"${context.tool}" is included with ${plan}, which this account does not have. An agent cannot subscribe on the person's behalf — tell them what is needed${config.upgradeUrl ? ` and point them at ${config.upgradeUrl}` : ""}, then stop.`,
        extra: {
          plan,
          ...(config.upgradeUrl ? { upgradeUrl: config.upgradeUrl } : {}),
        },
      };
    },

    // Nothing to redeem: entitlement comes from the plan, not from a payment
    // the agent can make.
    redeem(context) {
      return {
        ok: false as const,
        reason: `"${context.tool}" requires ${config.planName ?? "a paid plan"}. The person must subscribe${config.upgradeUrl ? ` at ${config.upgradeUrl}` : ""}; an agent cannot do it for them.`,
      };
    },
  };
}
