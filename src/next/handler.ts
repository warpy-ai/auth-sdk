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
  routes?: {
    session?: string; // default: '{basePath}/session'
    signOut?: string; // default: '{basePath}/signout'
    signIn?: string; // default: '{basePath}/signin/{provider}' - use {provider} placeholder
    callback?: string; // default: '{basePath}/callback/{provider}' - use {provider} placeholder
  };
}

// Helper function to match a route pattern against a pathname
function matchRoute(
  pattern: string,
  pathname: string
): { matched: boolean; provider?: string } {
  // Replace {provider} placeholder with a capture group
  const regex = new RegExp(
    "^" + pattern.replace(/\{provider\}/g, "([^/]+)") + "$"
  );
  const match = pathname.match(regex);
  if (!match) return { matched: false };
  return { matched: true, provider: match[1] };
}

// Helper function to build a route from pattern
function buildRoute(pattern: string, provider?: string): string {
  return provider ? pattern.replace(/\{provider\}/g, provider) : pattern;
}

export function createNextAuthHandler(
  config: AuthConfig,
  options: NextAuthHandlerOptions = {}
) {
  const base = options.basePath || "/auth";
  const successUrl = options.successRedirect || "/dashboard";
  const errorUrl = options.errorRedirect || "/login";

  // Resolve route patterns with defaults
  const routes = {
    session: options.routes?.session || `${base}/session`,
    signOut: options.routes?.signOut || `${base}/signout`,
    signIn: options.routes?.signIn || `${base}/signin/{provider}`,
    callback: options.routes?.callback || `${base}/callback/{provider}`,
  };

  return async function handler(request: Request): Promise<Response> {
    const pathname = getPathname(request);
    const method = request.method.toUpperCase();

    try {
      // Session
      if (pathname === routes.session && method === "GET") {
        const session = await getSession(request, config.secret);
        return Response.json({ session }, { status: 200 });
      }

      // Sign out
      if (pathname === routes.signOut && method === "POST") {
        await signOut(request, config);
        const res = Response.json({ success: true });
        res.headers.set("Set-Cookie", clearSessionCookie());
        return res;
      }

      // Check for sign-in route match
      const signInMatch = matchRoute(routes.signIn, pathname);
      if (signInMatch.matched && method === "GET") {
        const provider = signInMatch.provider;

        // OAuth sign-in start (exclude special providers handled below)
        if (provider && provider !== "twofa" && provider !== "email") {
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

        // Two-Factor sign-in (send code or verify code)
        if (provider === "twofa") {
          const url = new URL(request.url);
          const hasCode = url.searchParams.has("code");
          const result = await authenticate(config, request);

          // If redirectUrl is returned, it contains the identifier for code verification
          // This happens after sending the code
          if (result.redirectUrl && !hasCode) {
            // Extract identifier from redirect URL and return as JSON
            const redirectUrl = new URL(result.redirectUrl);
            const identifier = redirectUrl.searchParams.get("identifier");
            return Response.json(
              { success: true, identifier },
              { status: 200 }
            );
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
      }

      // Email sign-in initiate (send magic link) - POST method
      if (
        signInMatch.matched &&
        signInMatch.provider === "email" &&
        method === "POST"
      ) {
        const body = await request.json().catch(() => ({}));
        const email = body?.email as string | undefined;
        const captchaToken = body?.captchaToken as string | undefined;
        if (!email)
          return Response.json({ error: "Email is required" }, { status: 400 });

        // Build callback URL with email and captchaToken params for magic link
        const origin = new URL(request.url).origin;
        const callbackUrl = buildRoute(routes.callback, "email");
        const cb = new URL(callbackUrl, origin);
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

      // Check for callback route match
      const callbackMatch = matchRoute(routes.callback, pathname);
      if (callbackMatch.matched && callbackMatch.provider && method === "GET") {
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

      return Response.json({ error: "Not Found" }, { status: 404 });
    } catch (_error) {
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
