import type { AuthConfig } from "../core";
import { createNextAuthHandler, type NextAuthHandlerOptions } from "./handler";
import { google } from "../providers/google";

export interface AuthMiddlewareOptions extends NextAuthHandlerOptions {
  publicRoutes?: string[];
  protectedRoutes?: string[];
}

export function authMiddleware(
  configOrOptions?: AuthConfig | AuthMiddlewareOptions,
  maybeOptions: AuthMiddlewareOptions = {}
) {
  const hasConfig = !!configOrOptions && (configOrOptions as any).provider;
  const options: AuthMiddlewareOptions = hasConfig
    ? maybeOptions || {}
    : (configOrOptions as AuthMiddlewareOptions) || {};
  const config: AuthConfig = hasConfig
    ? (configOrOptions as AuthConfig)
    : resolveConfigFromEnv();

  const handler = createNextAuthHandler(config, options);

  return async function middleware(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const base = options.basePath || "/auth";

    // Let the SDK handle any /auth/* requests
    if (pathname.startsWith(base)) {
      return handler(request);
    }

    // Basic public/protected gating (optional)
    const isPublic =
      options.publicRoutes?.some((p) => matchPath(p, pathname)) ?? true;
    const isProtected =
      options.protectedRoutes?.some((p) => matchPath(p, pathname)) ?? false;

    if (isProtected && isPublic) {
      // protectedRoutes takes precedence over publicRoutes
    }

    // For now we do not force redirects here; the user can guard pages client-side or
    // we can expand with verify via cookies/JWT and redirect when missing.
    // Next.js middleware should return NextResponse.next(); avoid importing to keep SDK light
    const NextResponse = (globalThis as any).NextResponse;
    if (NextResponse && typeof NextResponse.next === "function") {
      return NextResponse.next();
    }
    return new Response(null, { status: 200 });
  };
}

function matchPath(pattern: string, pathname: string): boolean {
  if (pattern.endsWith("/:path*")) {
    const base = pattern.replace("/:path*", "");
    return pathname === base || pathname.startsWith(base + "/");
  }
  return pathname === pattern;
}

function resolveConfigFromEnv(): AuthConfig {
  const secret = process.env.AUTH_SECRET as string;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for auth middleware");
  }
  // Default to Google OAuth if env vars present
  const clientId = process.env.GOOGLE_CLIENT_ID as string | undefined;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string | undefined;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI as string | undefined;
  if (clientId && clientSecret && redirectUri) {
    return {
      secret,
      // cast to AuthConfig provider type
      provider: google({ clientId, clientSecret, redirectUri }) as any,
    } as AuthConfig;
  }
  throw new Error(
    "No provider configured. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI or pass an AuthConfig to authMiddleware()."
  );
}
