import type { PricingTable } from "@warpy-auth-sdk/core/webmcp";

/**
 * The browser's copy of the price list, for display and for what agents are
 * told. The authoritative table lives in proxy.ts — a price the page holds is a
 * suggestion, since anything in the page can be rewritten.
 */
export const PRICING: PricingTable = {
  premium_search: {
    amount: "2",
    currency: "credits",
    calls: 1,
    freeCalls: 2,
    description:
      "Search the full catalogue, including unlisted allocations, by intent rather than keyword",
  },
};
