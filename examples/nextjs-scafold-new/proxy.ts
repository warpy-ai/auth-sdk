import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authMiddleware } from "@warpy-auth-sdk/core/next";
import { google } from "@warpy-auth-sdk/core";

const handler = authMiddleware(
  {
    secret: process.env.AUTH_SECRET!,
    provider: google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    }),
    callbacks: {
      async user(u) {
        console.log("user", u);
        return { id: "1", email: u.email, name: u.name, picture: u.picture };
      },
      jwt: (t) => t,
      session: (s) => s,
    },
  },
  {
    basePath: "/api/auth",
    successRedirect: "/dashboard",
    errorRedirect: "/login",
  } // IMPORTANT
);

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
// remove: export const runtime = "nodejs"
