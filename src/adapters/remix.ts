// Local minimal Remix type shims to avoid requiring @remix-run/node at build-time
export type RemixLoaderArgs = {
  request: Request;
  params?: Record<string, string | undefined>;
  context?: unknown;
};

export type RemixActionArgs = {
  request: Request;
  params?: Record<string, string | undefined>;
  context?: unknown;
};

import type { AuthConfig, Session } from "../core";
import {
  authenticate,
  getSession as coreGetSession,
  signOut,
  createSessionCookie,
  clearSessionCookie,
} from "../core";
import { createMCPShield, type MCPShieldConfig } from "../shield/mcpShield";

export interface RemixAuthOptions {
  basePath?: string;
  successRedirect?: string;
  errorRedirect?: string;
  mcp?: { enabled?: boolean; path?: string; shield?: MCPShieldConfig };
}

/**
 * Build a Web Request from Remix loader/action args
 */
function buildWebRequest(request: Request): Request {
  // Remix already provides a Web Request, so we can use it directly
  // But we ensure it has proper URL construction for relative paths
  return request;
}

/**
 * Set cookies on a Response object
 */
function setCookies(response: Response, cookies?: string[]): Response {
  if (cookies && cookies.length) {
    const headers = new Headers(response.headers);
    cookies.forEach((cookie) => {
      headers.append("Set-Cookie", cookie);
    });
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  return response;
}

/**
 * Get session from request (useful in loaders)
 */
export async function getSession(
  request: Request,
  config: AuthConfig
): Promise<Session | null> {
  return await coreGetSession(request, config.secret);
}

/**
 * Require authentication - throws redirect if not authenticated
 * Use this in loaders/actions to protect routes
 */
export async function requireAuth(
  request: Request,
  config: AuthConfig,
  options?: { redirectTo?: string }
): Promise<Session> {
  const session = await coreGetSession(request, config.secret);
  if (!session) {
    const redirectTo = options?.redirectTo || "/login";
    throw Response.redirect(new URL(redirectTo, request.url).toString(), 302);
  }
  return session;
}

/**
 * Create auth route handlers for Remix resource routes
 * Returns an object with loader and action functions you can use in your routes
 */
export function createAuthHandlers(
  config: AuthConfig,
  options: RemixAuthOptions = {}
) {
  const base = options.basePath || "/auth";
  const successRedirect = options.successRedirect || "/";
  const errorRedirect = options.errorRedirect || "/login";

  /**
   * Session endpoint loader
   */
  async function sessionLoader({ request }: RemixLoaderArgs) {
    if (!request.url.includes(`${base}/session`)) {
      return null;
    }

    const session = await coreGetSession(request, config.secret);
    return Response.json({ session }, { status: 200 });
  }

  /**
   * Sign out action
   */
  async function signOutAction({ request }: RemixActionArgs) {
    if (!request.url.includes(`${base}/signout`)) {
      return null;
    }

    await signOut(request, config);
    const response = Response.json({ success: true });
    return setCookies(response, [clearSessionCookie()]);
  }

  /**
   * OAuth sign-in loader (initiates OAuth flow)
   */
  async function signInLoader({ request, params }: RemixLoaderArgs) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if this is a signin route
    const signInMatch = pathname.match(
      new RegExp(`^${base}/signin(?:/([^/]+))?$`)
    );
    if (!signInMatch) {
      return null;
    }

    const result = await authenticate(config, request);
    if (result.redirectUrl) {
      const response = Response.redirect(result.redirectUrl, 307);
      return setCookies(response, result.cookies);
    }

    return Response.json(
      { error: result.error || "Failed to start sign in" },
      { status: 400 }
    );
  }

  /**
   * OAuth callback loader
   */
  async function callbackLoader({ request, params }: RemixLoaderArgs) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if this is a callback route
    const callbackMatch = pathname.match(
      new RegExp(`^${base}/callback(?:/([^/]+))?$`)
    );
    if (!callbackMatch) {
      return null;
    }

    const result = await authenticate(config, request);
    if (result.error || !result.session) {
      const errorUrl = new URL(errorRedirect, request.url);
      errorUrl.searchParams.set(
        "error",
        encodeURIComponent(result.error || "Authentication failed")
      );
      return Response.redirect(errorUrl.toString(), 302);
    }

    const successUrl = new URL(successRedirect, request.url);
    const response = Response.redirect(successUrl.toString(), 302);
    return setCookies(response, [
      createSessionCookie(result.session),
      ...(result.cookies || []),
    ]);
  }

  /**
   * Email sign-in action
   */
  async function emailSignInAction({ request }: RemixActionArgs) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if this is an email signin route
    if (!pathname.includes(`${base}/signin/email`)) {
      return null;
    }

    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const captchaToken = formData.get("captchaToken")?.toString();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Create a new request with email in the body for the authenticate function
    const body = JSON.stringify({ email, captchaToken });
    const headers = new Headers(request.headers);
    headers.set("Content-Type", "application/json");
    const modifiedRequest = new Request(request.url, {
      method: "POST",
      headers,
      body,
    });

    const result = await authenticate(config, modifiedRequest);
    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    // For email magic links, return success (email will be sent)
    return Response.json({
      success: true,
      message: "Magic link sent to your email",
      identifier: result.identifier,
      expiresIn: result.expiresIn,
    });
  }

  /**
   * Two-factor authentication action
   */
  async function twoFactorAction({ request }: RemixActionArgs) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if this is a 2FA route
    if (!pathname.includes(`${base}/signin/twofa`)) {
      return null;
    }

    const formData = await request.formData();
    const code = formData.get("code")?.toString();
    const identifier = formData.get("identifier")?.toString();
    const captchaToken = formData.get("captchaToken")?.toString();

    if (!code || !identifier) {
      return Response.json(
        { error: "Code and identifier are required" },
        { status: 400 }
      );
    }

    // Create a new request with 2FA data in the body
    const body = JSON.stringify({ code, identifier, captchaToken });
    const headers = new Headers(request.headers);
    headers.set("Content-Type", "application/json");
    const modifiedRequest = new Request(request.url, {
      method: "POST",
      headers,
      body,
    });

    const result = await authenticate(config, modifiedRequest);
    if (result.error || !result.session) {
      return Response.json(
        { error: result.error || "Invalid verification code" },
        { status: 400 }
      );
    }

    const successUrl = new URL(successRedirect, request.url);
    const response = Response.redirect(successUrl.toString(), 302);
    return setCookies(response, [
      createSessionCookie(result.session),
      ...(result.cookies || []),
    ]);
  }

  /**
   * MCP endpoint action
   */
  async function mcpAction({ request }: RemixActionArgs) {
    if (!options.mcp?.enabled) {
      return null;
    }

    const path = options.mcp.path || "/api/mcp";
    const url = new URL(request.url);

    if (url.pathname !== path || request.method !== "POST") {
      return null;
    }

    const tools = createMCPShield(
      options.mcp.shield || {
        secret: config.secret,
        adapter: config.adapter,
        warpy: (config as unknown as { warpy?: unknown }).warpy as never,
      }
    );

    try {
      const body = (await request.json()) as {
        tool?: string;
        args?: unknown;
      };

      const tool = body.tool
        ? (
            tools as Record<
              string,
              { execute: (a: unknown) => Promise<unknown> }
            >
          )[body.tool]
        : undefined;

      if (!tool) {
        return Response.json({ error: "Unknown tool" }, { status: 400 });
      }

      const result = await tool.execute(body.args);
      return Response.json({ result });
    } catch (_error) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
  }

  /**
   * Combined loader that handles all GET requests for auth routes
   */
  async function authLoader(args: RemixLoaderArgs) {
    // Try each loader in order
    const loaders = [sessionLoader, signInLoader, callbackLoader];

    for (const loader of loaders) {
      const result = await loader(args);
      if (result !== null) {
        return result;
      }
    }

    return null;
  }

  /**
   * Combined action that handles all POST requests for auth routes
   */
  async function authAction(args: RemixActionArgs) {
    // Try each action in order
    const actions = [
      signOutAction,
      emailSignInAction,
      twoFactorAction,
      mcpAction,
    ];

    for (const action of actions) {
      const result = await action(args);
      if (result !== null) {
        return result;
      }
    }

    return null;
  }

  return {
    authLoader,
    authAction,
    sessionLoader,
    signOutAction,
    signInLoader,
    callbackLoader,
    emailSignInAction,
    twoFactorAction,
    mcpAction,
  };
}

// Helper type exports
export type { Session } from "../core";
