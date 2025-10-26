import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authMiddleware } from "@warpy-auth-sdk/core/next";
import { twofa } from "@warpy-auth-sdk/core";

const handler = authMiddleware(
  {
    secret: process.env.AUTH_SECRET!,
    provider: twofa({
      from: process.env.EMAIL_FROM!,
      service: {
        type: "resend",
        apiKey: process.env.RESEND_API_KEY!,
      },
      appName: "Next.js Auth Example",
      companyName: "Your Company",
      expirationMinutes: 5, // 2FA codes should expire quickly
    }),
    callbacks: {
      // Resolve/upsert your user with smallest overhead
      async user(u) {
        // return { id, email, name?, picture? } from your DB
        return {
          id: "1",
          email: u.email,
          name: u.name,
          picture: u.picture,
        };
      },
      jwt: (t) => t,
      session: (s) => s,
    },
  },
  {
    basePath: "/api/auth",
    successRedirect: "/dashboard",
    errorRedirect: "/login",
  }
);

export function proxy(request: NextRequest) {
  const p = request.nextUrl.pathname;
  if (p.startsWith("/api/auth")) return handler(request);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
