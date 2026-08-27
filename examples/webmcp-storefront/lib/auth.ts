import type { AuthConfig } from "@warpy-auth-sdk/core";
import { email } from "@warpy-auth-sdk/core";

/**
 * One auth configuration, shared by the proxy and every route.
 *
 * The provider is the SDK's email magic-link provider. The demo never actually
 * sends mail — see app/api/demo-signin — but the sessions, delegations and
 * receipts below are the real thing: signed, verified and expiring exactly as
 * they would in production.
 */
export const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "dev-only-secret-change-me-in-production";

export const authConfig: AuthConfig = {
  secret: AUTH_SECRET,
  mcp: { enabled: true },
  provider: email({
    from: "shop@example.com",
    // Points at a local SMTP catcher (MailHog, Mailpit). The demo never sends
    // mail — see app/api/demo-signin — but the provider has to be real for the
    // config to be the one a production shop would use.
    service: { type: "nodemailer", server: "smtp://localhost:1025" },
  }),
};

/** Scopes this shop is willing to delegate to an agent. */
export const ALLOWED_SCOPES = [
  "catalog:read",
  "cart:write",
  "orders:read",
  "orders:write",
] as const;

/** What each scope means, shown to the person in the consent prompt. */
export const SCOPE_LABELS: Record<string, string> = {
  "catalog:read": "See the catalogue and your cart",
  "cart:write": "Add and remove items in your cart",
  "orders:read": "Read your past orders",
  "orders:write": "Place orders",
};

/** Prices agents pay. The proxy holds the authoritative copy of this table. */
export const PRICING = {
  premium_search: {
    amount: "2",
    currency: "credits",
    calls: 1,
    freeCalls: 2,
    description:
      "Search the full catalogue, including unlisted allocations, by intent rather than keyword",
  },
} as const;
