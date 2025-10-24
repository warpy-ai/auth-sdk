import type { AuthConfig } from "../core";
import {
  authenticate,
  getSession,
  signOut,
  createSessionCookie,
  clearSessionCookie,
} from "../core";

function getPathname(request: Request): string {
  try {
    // @ts-ignore - NextRequest has nextUrl
    const nextUrl = (request as any).nextUrl;
    if (nextUrl && typeof nextUrl.pathname === "string")
      return nextUrl.pathname;
  } catch {}
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

      // OAuth sign-in start
      if (action === "signin" && provider && method === "GET") {
        const result = await authenticate(config, request);
        if (result.redirectUrl) {
          return Response.redirect(result.redirectUrl, 307);
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
        return new Response(null, { status: 307, headers });
      }

      // Email sign-in initiate (send magic link)
      if (action === "signin" && provider === "email" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const email = body?.email as string | undefined;
        if (!email)
          return Response.json({ error: "Email is required" }, { status: 400 });

        // Build callback URL with email param for magic link
        const origin = new URL(request.url).origin;
        const cb = new URL(`${base}/callback/email`, origin);
        cb.searchParams.set("email", email);
        const mock = new Request(cb.toString());

        const result = await authenticate(config, mock);
        if (result.error)
          return Response.json({ error: result.error }, { status: 400 });
        return Response.json({ success: true });
      }

      return Response.json({ error: "Not Found" }, { status: 404 });
    } catch (error) {
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
