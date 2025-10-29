import type { AuthConfig } from "../core";
import {
  authenticate,
  getSession,
  signOut,
  createSessionCookie,
  clearSessionCookie,
} from "../core";

// NextRequest interface for Next.js specific features
interface NextRequest extends Request {
  nextUrl?: {
    pathname: string;
  };
}

function getPathname(request: Request): string {
  try {
    const nextUrl = (request as NextRequest).nextUrl;
    if (nextUrl && typeof nextUrl.pathname === "string")
      return nextUrl.pathname;
  } catch (_error) {
    // Fallback to URL parsing
  }
  return new URL(request.url).pathname;
}

export interface NextAuthHandlerOptions {
  basePath?: string; // e.g., '/auth' or '/api/auth'
  successRedirect?: string; // where to redirect after successful callback
  errorRedirect?: string; // where to redirect on error
}

export function createNextAuthHandler(
  config: AuthConfig,
  options: NextAuthHandlerOptions = {}
) {
  const base = options.basePath || "/auth";
  const successUrl = options.successRedirect || "/dashboard";
  const errorUrl = options.errorRedirect || "/login";

  return async function handler(request: Request): Promise<Response> {
    const pathname = getPathname(request);
    const method = request.method.toUpperCase();

    // Normalize action/provider from path: /{base}/{action}/{provider?}
    const rel = pathname.startsWith(base)
      ? pathname.slice(base.length)
      : pathname;
    const parts = rel.split("/").filter(Boolean);
    const action = parts[0] || "";
    const provider = parts[1] || "";

    try {
      // Session
      if (action === "session" && method === "GET") {
        const session = await getSession(request, config.secret);
        return Response.json({ session }, { status: 200 });
      }

      // Sign out
      if (action === "signout" && method === "POST") {
        await signOut(request, config);
        const res = Response.json({ success: true });
        res.headers.set("Set-Cookie", clearSessionCookie());
        return res;
      }

      // OAuth sign-in start (exclude special providers handled below)
      if (
        action === "signin" &&
        provider &&
        method === "GET" &&
        provider !== "twofa" &&
        provider !== "email"
      ) {
        const result = await authenticate(config, request);
        if (result.redirectUrl) {
          const headers = new Headers();
          headers.set("Location", result.redirectUrl);
          // Set PKCE verifier cookie if provided
          if (result.cookies && result.cookies.length > 0) {
            result.cookies.forEach((cookie) => {
              headers.append("Set-Cookie", cookie);
            });
          }
          return new Response(null, { status: 307, headers });
        }
        return Response.json(
          { error: result.error || "Failed to start sign in" },
          { status: 400 }
        );
      }

      // OAuth/email callback
      if (action === "callback" && provider && method === "GET") {
        const result = await authenticate(config, request);
        if (result.error || !result.session) {
          const url = new URL(errorUrl, new URL(request.url).origin);
          if (result.error) url.searchParams.set("error", result.error);
          return Response.redirect(url, 307);
        }
        const location = new URL(successUrl, new URL(request.url).origin);
        const headers = new Headers();
        headers.set("Location", location.toString());
        headers.append("Set-Cookie", createSessionCookie(result.session));
        // Clear PKCE verifier cookie if provided
        if (result.cookies && result.cookies.length > 0) {
          result.cookies.forEach((cookie) => {
            headers.append("Set-Cookie", cookie);
          });
        }
        return new Response(null, { status: 307, headers });
      }

      // Email sign-in initiate (send magic link)
      if (action === "signin" && provider === "email" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const email = body?.email as string | undefined;
        const captchaToken = body?.captchaToken as string | undefined;
        if (!email)
          return Response.json({ error: "Email is required" }, { status: 400 });

        // Build callback URL with email and captchaToken params for magic link
        const origin = new URL(request.url).origin;
        const cb = new URL(`${base}/callback/email`, origin);
        cb.searchParams.set("email", email);
        if (captchaToken) {
          cb.searchParams.set("captchaToken", captchaToken);
        }
        const mock = new Request(cb.toString());

        const result = await authenticate(config, mock);
        if (result.error)
          return Response.json({ error: result.error }, { status: 400 });
        return Response.json({ success: true });
      }

      // Two-Factor sign-in (send code or verify code)
      if (action === "signin" && provider === "twofa" && method === "GET") {
        const url = new URL(request.url);
        const hasCode = url.searchParams.has("code");
        const result = await authenticate(config, request);

        // If redirectUrl is returned, it contains the identifier for code verification
        // This happens after sending the code
        if (result.redirectUrl && !hasCode) {
          // Extract identifier from redirect URL and return as JSON
          const redirectUrl = new URL(result.redirectUrl);
          const identifier = redirectUrl.searchParams.get("identifier");
          return Response.json({ success: true, identifier }, { status: 200 });
        }

        // If session is returned, code was verified successfully
        if (result.session) {
          const location = new URL(successUrl, new URL(request.url).origin);
          const headers = new Headers();
          headers.set("Location", location.toString());
          headers.append("Set-Cookie", createSessionCookie(result.session));
          return new Response(null, { status: 307, headers });
        }

        return Response.json(
          { error: result.error || "Failed to process 2FA request" },
          { status: 400 }
        );
      }

      return Response.json({ error: "Not Found" }, { status: 404 });
    } catch (_error) {
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
