import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authMiddleware } from "@warpy-auth-sdk/core/next";
import { creditsPaywall, x402Paywall } from "@warpy-auth-sdk/core";
import type { PaywallProvider } from "@warpy-auth-sdk/core";
import { getCredits, spendCredits } from "./lib/store";
import { ALLOWED_SCOPES, PRICING, authConfig } from "./lib/auth";

/**
 * Every agent-facing guarantee in this shop is configured here, in one place.
 *
 * The proxy serves the session routes, the WebMCP delegation routes
 * (grant / action / revoke / manifest) and the paywall routes
 * (paywall/quote, paywall/settle) under /api/auth.
 */

/**
 * Which rail agents pay on.
 *
 * x402 when a merchant address is configured — the agent pays from its own
 * wallet, per call, with no human involved. Otherwise prepaid credits on the
 * shopper's account, which needs no wallet and is what the demo runs on.
 */
function paywallProvider(): PaywallProvider {
  if (process.env.X402_PAY_TO && process.env.X402_ASSET) {
    return x402Paywall({
      payTo: process.env.X402_PAY_TO,
      asset: process.env.X402_ASSET,
      network: process.env.X402_NETWORK ?? "base",
      ...(process.env.X402_FACILITATOR_URL
        ? { facilitatorUrl: process.env.X402_FACILITATOR_URL }
        : {}),
    });
  }

  return creditsPaywall({
    getBalance: ({ userId }) => (userId ? getCredits(userId) : 0),
    charge: ({ userId }, credits) =>
      userId ? spendCredits(userId, credits) : false,
    toCredits: (price) => Number(price.amount),
    topUpUrl: "/account",
    unitLabel: "credits",
  });
}

const handler = authMiddleware(authConfig, {
  basePath: "/api/auth",
  successRedirect: "/",
  errorRedirect: "/",

  webmcp: {
    allowedScopes: [...ALLOWED_SCOPES],
    // Fifteen minutes is plenty for a shopping task, and short enough that a
    // forgotten delegation expires on its own.
    maxGrantSeconds: 900,
    actionTokenSeconds: 120,

    // The last word on a delegation, after the session and scopes check out.
    onGrant: ({ scopes, userId }) => {
      console.log(`[grant] ${userId} delegated [${scopes.join(", ")}]`);
      return true;
    },

    manifest: {
      name: "Warpy Coffee",
      description:
        "An agent-ready coffee shop: browse, search, and order, with the shopper's consent.",
    },

    paywall: {
      provider: paywallProvider(),
      // The authoritative price list. The browser has a copy for display, but
      // only this one decides what a call costs.
      pricing: PRICING,
      onPayment: (event) =>
        console.log(
          `[paid] ${event.tool} ${event.amount} ${event.currency} by ${event.payer ?? event.userId}`
        ),
      onPaymentFailed: (event) =>
        console.warn(`[unpaid] ${event.tool}: ${event.reason}`),
    },

    onAudit: (event) => console.log(`[webmcp] ${event.event}`, event),
  },
});

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return handler(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
