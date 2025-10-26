import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authMiddleware } from "@warpy-auth-sdk/core/next";
import type { AuthConfig } from "@warpy-auth-sdk/core";
import { google, email, github } from "@warpy-auth-sdk/core";

// ============================================================================
// MULTI-PROVIDER AUTHENTICATION SETUP
// ============================================================================
// This example shows how to configure multiple authentication providers.
// Users can sign in with Google, GitHub, or Email Magic Links.

// Define all available providers
const providers = {
  google: google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  }),
  github: github({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectUri: process.env.GITHUB_REDIRECT_URI!,
  }),
  email: email({
    from: process.env.EMAIL_FROM || "noreply@yourapp.com",
    service: {
      type: "resend",
      apiKey: process.env.RESEND_API_KEY!,
    },
    appName: "Next.js Auth Example",
    companyName: "Your Company",
    expirationMinutes: 15,
  }),
};

// Create a dynamic handler that selects the provider based on the URL
function createMultiProviderHandler() {
  const basePath = "/api/auth";
  const successRedirect = "/dashboard";
  const errorRedirect = "/login";

  // Base config (shared across all providers)
  const baseConfig: Omit<AuthConfig, "provider"> = {
    secret: process.env.AUTH_SECRET!,
    callbacks: {
      async user(
        u: { id?: string; email: string; name?: string; picture?: string },
        context?: { provider?: string }
      ) {
        console.log("user", u, "provider:", context?.provider);
        // In production, lookup/create user in your database
        // You can use context.provider to know which provider was used
        return { id: "1", email: u.email, name: u.name, picture: u.picture };
      },
      jwt: (t) => t,
      session: (s) => s,
    },
  };

  // Create handlers for each provider
  const handlers = Object.entries(providers).reduce(
    (acc, [name, provider]) => {
      acc[name] = authMiddleware(
        { ...baseConfig, provider } as AuthConfig,
        { basePath, successRedirect, errorRedirect }
      );
      return acc;
    },
    {} as Record<string, (req: NextRequest) => Promise<Response>>
  );

  return async function multiProviderHandler(
    request: NextRequest
  ): Promise<Response> {
    const pathname = request.nextUrl.pathname;

    // Extract provider from path: /api/auth/signin/{provider} or /api/auth/callback/{provider}
    const match = pathname.match(/\/api\/auth\/(signin|callback)\/([^/]+)/);
    const providerName = match ? match[2] : null;

    // For session and signout, use any handler (they don't depend on provider)
    if (
      pathname === `${basePath}/session` ||
      pathname === `${basePath}/signout`
    ) {
      return handlers.google(request);
    }

    // Route to the appropriate provider handler
    if (providerName && handlers[providerName]) {
      return handlers[providerName](request);
    }

    // If no provider matches, return 404
    return Response.json({ error: "Provider not found" }, { status: 404 });
  };
}

const handler = createMultiProviderHandler();

export function proxy(request: NextRequest) {
  const p = request.nextUrl.pathname;
  if (p.startsWith("/api/auth")) return handler(request);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
