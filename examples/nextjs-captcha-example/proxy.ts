import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authMiddleware } from "@warpy-auth-sdk/core/next";
import { email } from "@warpy-auth-sdk/core";

const handler = authMiddleware(
  {
    secret: process.env.AUTH_SECRET!,
    provider: email({
      from: "lucas@sourcepilot.co",
      service: {
        type: "resend",
        apiKey: process.env.RESEND_API_KEY!,
      },
      appName: "CAPTCHA Example",
      companyName: "Your Company",
    }),
    captcha: {
      provider: {
        type: "recaptcha-v2",
        siteKey: process.env.RECAPTCHA_SITE_KEY!,
        secretKey: process.env.RECAPTCHA_SECRET_KEY!,
      },
      enforceOnEmail: true,
      enforceOnTwoFactor: true,
      enforceOnOAuth: false,
    },
    callbacks: {
      async user(u) {
        // In production, you would fetch/create user from database
        // For this example, we'll just return the user as-is
        return {
          id: u.id || u.email,
          email: u.email,
          name: u.name,
          picture: u.picture,
        };
      },
      jwt: (token) => token,
      session: (session) => session,
    },
  },
  {
    basePath: "/api/auth",
    successRedirect: "/dashboard",
    errorRedirect: "/signin",

    // Optional: Customize authentication route paths
    // routes: {
    //   session: "/api/user/session",
    //   signOut: "/api/user/logout",
    //   signIn: "/login/{provider}",
    //   callback: "/auth/verify/{provider}",
    // },
  }
);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle auth routes
  if (pathname.startsWith("/api/auth")) {
    return handler(request);
  }

  // Continue to next middleware/route
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
