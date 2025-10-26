// Local minimal Hono type shims to avoid requiring hono at build-time
export type HonoContext = {
  req: {
    header: (name: string) => string | undefined;
    method: string;
    url: string;
    parseBody?: () => Promise<unknown>;
  };
  header: (name: string, value: string | string[], options?: { append?: boolean }) => void;
  status: (code: number) => void;
  redirect: (url: string, status?: number) => Response;
  json: (body: unknown, status?: number) => Response;
  text: (text: string, status?: number) => Response;
  get?: (key: string) => unknown;
  set?: (key: string, value: unknown) => void;
};

export type HonoMiddleware = (
  c: HonoContext,
  next: () => Promise<void>
) => Promise<Response | void>;

export type HonoApp = {
  get: (
    path: string,
    handler: (c: HonoContext) => Promise<Response> | Response
  ) => void;
  post: (
    path: string,
    handler: (c: HonoContext) => Promise<Response> | Response
  ) => void;
  use?: (path: string, middleware: HonoMiddleware) => void;
};

import type { AuthConfig } from "../core";
import {
  authenticate,
  getSession as coreGetSession,
  signOut,
  createSessionCookie,
  clearSessionCookie,
} from "../core";
import { createMCPShield, type MCPShieldConfig } from "../shield/mcpShield";

export interface HonoAuthOptions {
  basePath?: string;
  successRedirect?: string;
  errorRedirect?: string;
  mcp?: { enabled?: boolean; path?: string; shield?: MCPShieldConfig };
}

function buildWebRequest(c: HonoContext): Request {
  const url = c.req.url;
  const headers = new Headers();

  // Copy all headers from the request
  const headerNames = [
    "authorization",
    "cookie",
    "content-type",
    "x-forwarded-proto",
    "x-forwarded-host",
    "host",
  ];

  for (const name of headerNames) {
    const value = c.req.header(name);
    if (value) headers.set(name, value);
  }

  return new Request(url, { method: c.req.method, headers });
}

function setCookies(c: HonoContext, cookies?: string[]) {
  if (cookies && cookies.length) {
    // Hono requires setting all cookies at once to avoid overwriting
    for (const cookie of cookies) {
      c.header("set-cookie", cookie, { append: true });
    }
  }
}

export function registerAuthRoutes(
  app: HonoApp,
  config: AuthConfig,
  options: HonoAuthOptions = {}
) {
  const base = options.basePath || "/auth";
  const successRedirect = options.successRedirect || "/";
  const errorRedirect = options.errorRedirect || "/login";

  const requireAuth: HonoMiddleware = async (c, next) => {
    const webReq = buildWebRequest(c);
    const session = await coreGetSession(webReq, config.secret);
    if (!session) {
      c.status(401);
      return c.json({ error: "Unauthorized" });
    }
    // Store session in context
    c.set?.("session", session);
    return next();
  };

  app.get(`${base}/session`, async (c: HonoContext) => {
    const session = await coreGetSession(buildWebRequest(c), config.secret);
    return c.json({ session });
  });

  app.post(`${base}/signout`, async (c: HonoContext) => {
    await signOut(buildWebRequest(c), config);
    c.header("set-cookie", clearSessionCookie());
    return c.json({ success: true });
  });

  app.get(`${base}/signin`, async (c: HonoContext) => {
    const result = await authenticate(config, buildWebRequest(c));
    if (result.redirectUrl) {
      setCookies(c, result.cookies);
      return c.redirect(result.redirectUrl, 302);
    }
    c.status(400);
    return c.json({ error: result.error || "Failed to start sign in" });
  });

  app.get(`${base}/signin/:provider`, async (c: HonoContext) => {
    const result = await authenticate(config, buildWebRequest(c));
    if (result.redirectUrl) {
      setCookies(c, result.cookies);
      return c.redirect(result.redirectUrl, 302);
    }
    c.status(400);
    return c.json({ error: result.error || "Failed to start sign in" });
  });

  app.get(`${base}/callback`, async (c: HonoContext) => {
    const result = await authenticate(config, buildWebRequest(c));
    if (result.error || !result.session) {
      return c.redirect(
        `${errorRedirect}?error=${encodeURIComponent(
          result.error || "Authentication failed"
        )}`,
        302
      );
    }
    setCookies(c, [
      createSessionCookie(result.session),
      ...(result.cookies || []),
    ]);
    return c.redirect(successRedirect, 302);
  });

  app.get(`${base}/callback/:provider`, async (c: HonoContext) => {
    const result = await authenticate(config, buildWebRequest(c));
    if (result.error || !result.session) {
      return c.redirect(
        `${errorRedirect}?error=${encodeURIComponent(
          result.error || "Authentication failed"
        )}`,
        302
      );
    }
    setCookies(c, [
      createSessionCookie(result.session),
      ...(result.cookies || []),
    ]);
    return c.redirect(successRedirect, 302);
  });

  if (options.mcp?.enabled) {
    const path = options.mcp.path || "/api/mcp";
    const tools = createMCPShield(
      options.mcp.shield || {
        secret: config.secret,
        adapter: config.adapter,
        warpy: (config as unknown as { warpy?: unknown }).warpy as never,
      }
    );
    app.post(path, async (c: HonoContext) => {
      const body = (await c.req.parseBody?.()) as
        | { tool?: string; args?: unknown }
        | undefined;
      if (!body) {
        c.status(400);
        return c.json({ error: "Invalid request body" });
      }
      const tool = body.tool
        ? (
            tools as Record<
              string,
              { execute: (a: unknown) => Promise<unknown> }
            >
          )[body.tool as string]
        : undefined;
      if (!tool) {
        c.status(400);
        return c.json({ error: "Unknown tool" });
      }
      const result = await tool.execute(body.args);
      return c.json({ result });
    });
  }

  return { requireAuth };
}

// Helper type for middleware usage
export type { Session } from "../core";
