// Local minimal Fastify type shims to avoid requiring fastify at build-time
export type FastifyInstance = {
  get: (
    path: string,
    handler: (
      req: FastifyRequest,
      reply: FastifyReply
    ) => Promise<unknown> | unknown
  ) => void;
  post: (
    path: string,
    handler: (
      req: FastifyRequest,
      reply: FastifyReply
    ) => Promise<unknown> | unknown
  ) => void;
  decorateRequest?: (name: string, value: unknown) => void;
};

export type FastifyRequest = {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  url: string;
  body?: unknown;
};

export type FastifyReply = {
  header: (name: string, value: string | string[]) => FastifyReply;
  code: (statusCode: number) => FastifyReply;
  redirect: (url: string, statusCode?: number) => FastifyReply;
  send: (payload: unknown) => FastifyReply;
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

export interface FastifyAuthOptions {
  basePath?: string;
  successRedirect?: string;
  errorRedirect?: string;
  mcp?: { enabled?: boolean; path?: string; shield?: MCPShieldConfig };
}

type RequireAuth = (req: FastifyRequest, reply: FastifyReply) => Promise<void>;

function buildWebRequest(req: FastifyRequest): Request {
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

function setCookies(reply: FastifyReply, cookies?: string[]) {
  if (cookies && cookies.length) reply.header("set-cookie", cookies);
}

export function registerAuthPlugin(
  instance: FastifyInstance,
  config: AuthConfig,
  options: FastifyAuthOptions = {}
) {
  const base = options.basePath || "/auth";
  const successRedirect = options.successRedirect || "/";
  const errorRedirect = options.errorRedirect || "/login";

  (
    instance as unknown as { decorateRequest?: (n: string, v: unknown) => void }
  ).decorateRequest?.("session", null);

  const requireAuth: RequireAuth = async (req, reply) => {
    const webReq = buildWebRequest(req);
    const session = await coreGetSession(webReq, config.secret);
    if (!session) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }
    (req as unknown as { session?: Session }).session = session as Session;
  };

  instance.get(
    `${base}/session`,
    async (req: FastifyRequest, reply: FastifyReply) => {
      const session = await coreGetSession(buildWebRequest(req), config.secret);
      return reply.send({ session });
    }
  );

  instance.post(
    `${base}/signout`,
    async (req: FastifyRequest, reply: FastifyReply) => {
      await signOut(buildWebRequest(req), config);
      reply.header("set-cookie", [clearSessionCookie()]);
      return reply.send({ success: true });
    }
  );

  instance.get(
    `${base}/signin`,
    async (req: FastifyRequest, reply: FastifyReply) => {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.redirectUrl) {
        setCookies(reply, result.cookies);
        return reply.redirect(result.redirectUrl, 302);
      }
      return reply
        .code(400)
        .send({ error: result.error || "Failed to start sign in" });
    }
  );

  instance.get(
    `${base}/signin/:provider`,
    async (req: FastifyRequest, reply: FastifyReply) => {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.redirectUrl) {
        setCookies(reply, result.cookies);
        return reply.redirect(result.redirectUrl, 302);
      }
      return reply
        .code(400)
        .send({ error: result.error || "Failed to start sign in" });
    }
  );

  instance.get(
    `${base}/callback`,
    async (req: FastifyRequest, reply: FastifyReply) => {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.error || !result.session) {
        return reply.redirect(
          `${errorRedirect}?error=${encodeURIComponent(
            result.error || "Authentication failed"
          )}`,
          302
        );
      }
      setCookies(reply, [
        createSessionCookie(result.session),
        ...(result.cookies || []),
      ]);
      return reply.redirect(successRedirect, 302);
    }
  );

  instance.get(
    `${base}/callback/:provider`,
    async (req: FastifyRequest, reply: FastifyReply) => {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.error || !result.session) {
        return reply.redirect(
          `${errorRedirect}?error=${encodeURIComponent(
            result.error || "Authentication failed"
          )}`,
          302
        );
      }
      setCookies(reply, [
        createSessionCookie(result.session),
        ...(result.cookies || []),
      ]);
      return reply.redirect(successRedirect, 302);
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
    instance.post(
      path,
      async (req: FastifyRequest & { body?: unknown }, reply: FastifyReply) => {
        const body = (req.body || {}) as { tool?: string; args?: unknown };
        const tool = body.tool
          ? (
              tools as Record<
                string,
                { execute: (a: unknown) => Promise<unknown> }
              >
            )[body.tool as string]
          : undefined;
        if (!tool) return reply.code(400).send({ error: "Unknown tool" });
        const result = await tool.execute(body.args);
        return reply.send({ result });
      }
    );
  }

  return { requireAuth };
}
