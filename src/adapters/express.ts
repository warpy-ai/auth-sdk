// Local minimal Express type shims to avoid requiring express at build-time
export type ExpressRequest = {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  url: string;
  body?: unknown;
  session?: unknown;
};

export type ExpressResponse = {
  setHeader: (name: string, value: string | string[]) => ExpressResponse;
  status: (code: number) => ExpressResponse;
  redirect: (url: string) => void;
  json: (body: unknown) => void;
  send: (body: unknown) => void;
};

export type ExpressNextFunction = () => void;

export type ExpressApplication = {
  get: (
    path: string,
    handler: (
      req: ExpressRequest,
      res: ExpressResponse,
      next: ExpressNextFunction
    ) => void | Promise<void>
  ) => void;
  post: (
    path: string,
    handler: (
      req: ExpressRequest,
      res: ExpressResponse,
      next: ExpressNextFunction
    ) => void | Promise<void>
  ) => void;
  use?: (middleware: unknown) => void;
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

export interface ExpressAuthOptions {
  basePath?: string;
  successRedirect?: string;
  errorRedirect?: string;
  mcp?: { enabled?: boolean; path?: string; shield?: MCPShieldConfig };
}

export type RequireAuth = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: ExpressNextFunction
) => Promise<void>;

function buildWebRequest(req: ExpressRequest): Request {
  const forwardedProto = (req.headers["x-forwarded-proto"] as string) || "";
  const proto = forwardedProto || "http";
  const host = (req.headers.host as string) || "";
  const url = `${proto}://${host}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => headers.append(k, String(vv)));
    else if (v != null) headers.set(k, String(v));
  }
  return new Request(url, { method: req.method, headers });
}

function setCookies(res: ExpressResponse, cookies?: string[]) {
  if (cookies && cookies.length) res.setHeader("set-cookie", cookies);
}

export function registerAuthRoutes(
  app: ExpressApplication,
  config: AuthConfig,
  options: ExpressAuthOptions = {}
) {
  const base = options.basePath || "/auth";
  const successRedirect = options.successRedirect || "/";
  const errorRedirect = options.errorRedirect || "/login";

  const requireAuth: RequireAuth = async (req, res, next) => {
    const webReq = buildWebRequest(req);
    const session = await coreGetSession(webReq, config.secret);
    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    (req as ExpressRequest & { session?: Session }).session =
      session as Session;
    next();
  };

  app.get(
    `${base}/session`,
    async (req: ExpressRequest, res: ExpressResponse) => {
      const session = await coreGetSession(buildWebRequest(req), config.secret);
      res.json({ session });
    }
  );

  app.post(
    `${base}/signout`,
    async (req: ExpressRequest, res: ExpressResponse) => {
      await signOut(buildWebRequest(req), config);
      res.setHeader("set-cookie", [clearSessionCookie()]);
      res.json({ success: true });
    }
  );

  app.get(
    `${base}/signin`,
    async (req: ExpressRequest, res: ExpressResponse) => {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.redirectUrl) {
        setCookies(res, result.cookies);
        res.redirect(result.redirectUrl);
        return;
      }
      res
        .status(400)
        .json({ error: result.error || "Failed to start sign in" });
    }
  );

  app.get(
    `${base}/signin/:provider`,
    async (req: ExpressRequest, res: ExpressResponse) => {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.redirectUrl) {
        setCookies(res, result.cookies);
        res.redirect(result.redirectUrl);
        return;
      }
      res
        .status(400)
        .json({ error: result.error || "Failed to start sign in" });
    }
  );

  app.get(
    `${base}/callback`,
    async (req: ExpressRequest, res: ExpressResponse) => {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.error || !result.session) {
        res.redirect(
          `${errorRedirect}?error=${encodeURIComponent(
            result.error || "Authentication failed"
          )}`
        );
        return;
      }
      setCookies(res, [
        createSessionCookie(result.session),
        ...(result.cookies || []),
      ]);
      res.redirect(successRedirect);
    }
  );

  app.get(
    `${base}/callback/:provider`,
    async (req: ExpressRequest, res: ExpressResponse) => {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.error || !result.session) {
        res.redirect(
          `${errorRedirect}?error=${encodeURIComponent(
            result.error || "Authentication failed"
          )}`
        );
        return;
      }
      setCookies(res, [
        createSessionCookie(result.session),
        ...(result.cookies || []),
      ]);
      res.redirect(successRedirect);
    }
  );

  if (options.mcp?.enabled) {
    const path = options.mcp.path || "/api/mcp";
    const tools = createMCPShield(
      options.mcp.shield || {
        secret: config.secret,
        adapter: config.adapter,
        warpy: (config as unknown as { warpy?: unknown }).warpy as never,
      }
    );
    app.post(path, async (req: ExpressRequest, res: ExpressResponse) => {
      const body = (req.body || {}) as { tool?: string; args?: unknown };
      const tool = body.tool
        ? (
            tools as Record<
              string,
              { execute: (a: unknown) => Promise<unknown> }
            >
          )[body.tool as string]
        : undefined;
      if (!tool) {
        res.status(400).json({ error: "Unknown tool" });
        return;
      }
      const result = await tool.execute(body.args);
      res.json({ result });
    });
  }

  return { requireAuth };
}
