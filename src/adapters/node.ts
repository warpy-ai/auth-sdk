// Pure Node.js HTTP adapter - no framework dependencies
import type { IncomingMessage, ServerResponse } from "http";
import type { AuthConfig, Session } from "../core";
import {
  authenticate,
  getSession as coreGetSession,
  signOut,
  createSessionCookie,
  clearSessionCookie,
} from "../core";
import { createMCPShield, type MCPShieldConfig } from "../shield/mcpShield";

export interface NodeAuthOptions {
  basePath?: string;
  successRedirect?: string;
  errorRedirect?: string;
  mcp?: { enabled?: boolean; path?: string; shield?: MCPShieldConfig };
}

export type NodeAuthMiddleware = (
  req: IncomingMessage & { session?: Session },
  res: ServerResponse
) => Promise<boolean>;

function buildWebRequest(req: IncomingMessage): Request {
  const protocol =
    (req.headers["x-forwarded-proto"] as string) ||
    ((req.socket as { encrypted?: boolean }).encrypted ? "https" : "http");
  const host = req.headers.host || "localhost";
  const url = `${protocol}://${host}${req.url}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return new Request(url, { method: req.method, headers });
}

function setCookies(res: ServerResponse, cookies?: string[]) {
  if (cookies && cookies.length) {
    res.setHeader("set-cookie", cookies);
  }
}

function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
}

function redirect(res: ServerResponse, url: string, status = 302) {
  res.statusCode = status;
  res.setHeader("location", url);
  res.end();
}

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export function createAuthHandler(
  config: AuthConfig,
  options: NodeAuthOptions = {}
) {
  const base = options.basePath || "/auth";
  const successRedirect = options.successRedirect || "/";
  const errorRedirect = options.errorRedirect || "/login";

  // Create MCP tools if enabled
  const mcpTools = options.mcp?.enabled
    ? createMCPShield(
        options.mcp.shield || {
          secret: config.secret,
          adapter: config.adapter,
          warpy: (config as unknown as { warpy?: unknown }).warpy as never,
        }
      )
    : null;

  const requireAuth: NodeAuthMiddleware = async (req, res) => {
    const webReq = buildWebRequest(req);
    const session = await coreGetSession(webReq, config.secret);
    if (!session) {
      sendJSON(res, { error: "Unauthorized" }, 401);
      return false;
    }
    req.session = session as Session;
    return true;
  };

  const handler = async (
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> => {
    const url = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`
    );
    const pathname = url.pathname;

    // Session endpoint
    if (pathname === `${base}/session` && req.method === "GET") {
      const session = await coreGetSession(buildWebRequest(req), config.secret);
      sendJSON(res, { session });
      return true;
    }

    // Sign out endpoint
    if (pathname === `${base}/signout` && req.method === "POST") {
      await signOut(buildWebRequest(req), config);
      setCookies(res, [clearSessionCookie()]);
      sendJSON(res, { success: true });
      return true;
    }

    // Sign in endpoint (generic)
    if (pathname === `${base}/signin` && req.method === "GET") {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.redirectUrl) {
        setCookies(res, result.cookies);
        redirect(res, result.redirectUrl);
        return true;
      }
      sendJSON(res, { error: result.error || "Failed to start sign in" }, 400);
      return true;
    }

    // Sign in endpoint (with provider)
    if (pathname.startsWith(`${base}/signin/`) && req.method === "GET") {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.redirectUrl) {
        setCookies(res, result.cookies);
        redirect(res, result.redirectUrl);
        return true;
      }
      sendJSON(res, { error: result.error || "Failed to start sign in" }, 400);
      return true;
    }

    // Callback endpoint (generic)
    if (pathname === `${base}/callback` && req.method === "GET") {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.error || !result.session) {
        redirect(
          res,
          `${errorRedirect}?error=${encodeURIComponent(
            result.error || "Authentication failed"
          )}`
        );
        return true;
      }
      setCookies(res, [
        createSessionCookie(result.session),
        ...(result.cookies || []),
      ]);
      redirect(res, successRedirect);
      return true;
    }

    // Callback endpoint (with provider)
    if (pathname.startsWith(`${base}/callback/`) && req.method === "GET") {
      const result = await authenticate(config, buildWebRequest(req));
      if (result.error || !result.session) {
        redirect(
          res,
          `${errorRedirect}?error=${encodeURIComponent(
            result.error || "Authentication failed"
          )}`
        );
        return true;
      }
      setCookies(res, [
        createSessionCookie(result.session),
        ...(result.cookies || []),
      ]);
      redirect(res, successRedirect);
      return true;
    }

    // MCP endpoint
    if (
      mcpTools &&
      pathname === (options.mcp?.path || "/api/mcp") &&
      req.method === "POST"
    ) {
      try {
        const body = (await parseBody(req)) as {
          tool?: string;
          args?: unknown;
        };
        const tool = body.tool
          ? (
              mcpTools as Record<
                string,
                { execute: (a: unknown) => Promise<unknown> }
              >
            )[body.tool]
          : undefined;
        if (!tool) {
          sendJSON(res, { error: "Unknown tool" }, 400);
          return true;
        }
        const result = await tool.execute(body.args);
        sendJSON(res, { result });
        return true;
      } catch (_error) {
        sendJSON(res, { error: "Invalid request body" as string }, 400);
        return true;
      }
    }

    // Not an auth route
    return false;
  };

  return { handler, requireAuth };
}

// Helper type exports
export type { Session } from "../core";
export type { IncomingMessage, ServerResponse } from "http";
