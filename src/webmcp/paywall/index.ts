/**
 * WebMCP paywall: charge agents for tool calls.
 *
 * Server-side entry point. The browser half (the payment gate and the
 * entitlement store) is re-exported from "@warpy-auth-sdk/core/webmcp".
 */

export {
  quotePaywall,
  settlePaywall,
  verifyWebMCPPayment,
  authorizePaidRequest,
  createMemoryUsageStore,
  describePricing,
  type PaywallOptions,
  type PaymentClaims,
} from "./server";

export {
  x402Paywall,
  toAtomicUnits,
  decodePayment,
  type X402PaywallConfig,
} from "./providers/x402";
export { creditsPaywall, type CreditsPaywallConfig } from "./providers/credits";
export {
  subscriptionPaywall,
  type SubscriptionPaywallConfig,
} from "./providers/subscription";

export { EntitlementStore, type EntitlementListener } from "./entitlement";

export type {
  ToolPrice,
  PricingTable,
  PaymentChallenge,
  PaymentReceipt,
  PaywallProvider,
  PaywallContext,
  PaywallRedemption,
  PaywallQuoteResponse,
  UsageStore,
  X402PaymentRequired,
  X402PaymentRequirements,
  X402SettlementResponse,
} from "./types";
