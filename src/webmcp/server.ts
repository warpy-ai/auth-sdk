import { getSession, type AuthConfig } from "../core";
import { signJWT, verifyJWT, type JWTPayload } from "../utils/jwt";
import { isTokenRevoked, revokeToken } from "../mcp/mcp";

/**
 * Server half of the WebMCP security model.
 *
 * The page-side guard decides what an agent may attempt; this decides what the
 * server will actually honour. Both sides check the same delegation, so a
 * compromised page cannot widen an agent's authority, and a backend can tell an
 * agent-driven write apart from a human one.
 */

export interface WebMCPActionClaims {
  userId: string;
  agentId?: string;
  scopes: string[];
  /** Tool the token was minted for. */
  tool?: string;
  /** "mcp-agent" for a delegation, "webmcp-action" for a single-use token. */
  type: "mcp-agent" | "webmcp-action";
}

/** Replay protection for single-use action tokens. */
export interface NonceStore {
  /** Returns false when the nonce has already been used. */
  consume: (nonce: string, expiresAt: number) => boolean | Promise<boolean>;
}

/**
 * Default in-memory nonce store.
 *
 * Fine for a single process; use Redis or your database when you run more than
 * one instance, otherwise an action token replays successfully on another node.
 */
export function createMemoryNonceStore(): NonceStore {
  const used = new Map<string, number>();

  return {
    consume(nonce: string, expiresAt: number) {
      const now = Date.now();
      for (const [key, expiry] of used) {
        if (expiry <= now) used.delete(key);
      }
      if (used.has(nonce)) return false;
      used.set(nonce, expiresAt);
      return true;
    },
  };
}

export interface WebMCPServerOptions {
  /** Scopes the server is willing to delegate. Anything else is refused. */
  allowedScopes?: string[];
  /** Maximum delegation lifetime, in seconds. Default: 900 (15 minutes). */
  maxGrantSeconds?: number;
  /** Action token lifetime, in seconds. Default: 120. */
  actionTokenSeconds?: number;
  /** Replay protection store. Default: in-memory. */
  nonceStore?: NonceStore;
  /**
   * Final say on a delegation request, after the session and scopes check out.
   * Return false to refuse (plan limits, per-user policy, abuse heuristics).
   */
  onGrant?: (context: {
    userId: string;
    scopes: string[];
    agentId: string;
    reason?: string;
    request: Request;
  }) => boolean | Promise<boolean>;
  /** Server-side audit sink for grants, actions and revocations. */
  onAudit?: (event: {
    event: "grant" | "grant_denied" | "action" | "revoke";
    userId?: string;
    agentId?: string;
    scopes?: string[];
    tool?: string;
    reason?: string;
    timestamp: string;
  }) => void;
}

const DEFAULT_GRANT_SECONDS = 900;
const DEFAULT_ACTION_SECONDS = 120;

function parseDuration(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(value.trim());
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1;
  return amount * multiplier;
}

function randomNonce(): string {
  const webcrypto = (globalThis as { crypto?: Crypto }).crypto;
  if (webcrypto?.randomUUID) return webcrypto.randomUUID();
  if (webcrypto?.getRandomValues) {
    const bytes = webcrypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Issues a scoped, short-lived delegation for an agent acting on behalf of the
 * signed-in user. The user's own session must be present and standard: an agent
 * cannot use one delegation to mint another.
 */
export async function issueGrant(
  request: Request,
  config: AuthConfig,
  options: WebMCPServerOptions = {}
): Promise<Response> {
  const audit = options.onAudit;
  const session = await getSession(request, config.secret);

  if (!session || session.type !== "standard") {
    audit?.({
      event: "grant_denied",
      reason: "no_user_session",
      timestamp: new Date().toISOString(),
    });
    return json({ error: "Not signed in" }, 401);
  }

  let body: {
    scopes?: unknown;
    agentId?: unknown;
    expiresIn?: unknown;
    reason?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch (_error) {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : [];
  if (scopes.length === 0) {
    return json({ error: "At least one scope is required" }, 400);
  }

  if (options.allowedScopes) {
    const refused = scopes.filter(
      (scope) => !options.allowedScopes?.includes(scope)
    );
    if (refused.length) {
      audit?.({
        event: "grant_denied",
        userId: session.user.id,
        scopes,
        reason: `disallowed_scopes:${refused.join(",")}`,
        timestamp: new Date().toISOString(),
      });
      return json(
        {
          error: `Scopes not allowed: ${refused.join(", ")}`,
          allowedScopes: options.allowedScopes,
        },
        403
      );
    }
  }

  const agentId =
    typeof body.agentId === "string" ? body.agentId : "webmcp-agent";
  const maxSeconds = options.maxGrantSeconds ?? DEFAULT_GRANT_SECONDS;
  const requested = parseDuration(
    typeof body.expiresIn === "string" ? body.expiresIn : undefined,
    maxSeconds
  );
  const seconds = Math.min(requested, maxSeconds);

  if (options.onGrant) {
    const approved = await options.onGrant({
      userId: session.user.id,
      scopes,
      agentId,
      ...(typeof body.reason === "string" ? { reason: body.reason } : {}),
      request,
    });
    if (!approved) {
      audit?.({
        event: "grant_denied",
        userId: session.user.id,
        agentId,
        scopes,
        reason: "rejected_by_policy",
        timestamp: new Date().toISOString(),
      });
      return json({ error: "Delegation refused" }, 403);
    }
  }

  // Each delegation carries a unique id. Without it two grants issued in the
  // same second with the same claims serialize to the same JWT, and revoking
  // one would silently revoke the other.
  const token = signJWT(
    {
      userId: session.user.id,
      ...(session.user.email ? { email: session.user.email } : {}),
      scopes,
      agentId,
      type: "mcp-agent",
      nonce: randomNonce(),
    },
    config.secret,
    `${seconds}s`
  );

  audit?.({
    event: "grant",
    userId: session.user.id,
    agentId,
    scopes,
    timestamp: new Date().toISOString(),
  });

  return json({
    token,
    agentId,
    scopes,
    expires: new Date(Date.now() + seconds * 1000).toISOString(),
  } satisfies {
    token: string;
    agentId: string;
    scopes: string[];
    expires: string;
  });
}

/**
 * Mints a single-use token for one tool call, from an active delegation. The
 * page attaches it to the request the tool makes, letting the backend verify
 * which tool is calling and refuse replays.
 */
export async function issueActionToken(
  request: Request,
  config: AuthConfig,
  options: WebMCPServerOptions = {}
): Promise<Response> {
  const grant = readBearer(request);
  if (!grant) return json({ error: "Missing delegation token" }, 401);
  if (isTokenRevoked(grant)) return json({ error: "Delegation revoked" }, 401);

  const payload = verifyJWT(grant, config.secret);
  if (!payload || payload.type !== "mcp-agent") {
    return json({ error: "Invalid delegation token" }, 401);
  }

  let body: { tool?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch (_error) {
    body = {};
  }

  const seconds = options.actionTokenSeconds ?? DEFAULT_ACTION_SECONDS;
  const claims: JWTPayload = {
    userId: payload.userId,
    ...(payload.email ? { email: payload.email } : {}),
    scopes: payload.scopes ?? [],
    ...(payload.agentId ? { agentId: payload.agentId } : {}),
    type: "webmcp-action",
    ...(typeof body.tool === "string" ? { tool: body.tool } : {}),
    nonce: randomNonce(),
    ...(request.headers.get("origin")
      ? { origin: request.headers.get("origin") as string }
      : {}),
  };

  options.onAudit?.({
    event: "action",
    userId: payload.userId,
    ...(payload.agentId ? { agentId: payload.agentId } : {}),
    ...(typeof body.tool === "string" ? { tool: body.tool } : {}),
    timestamp: new Date().toISOString(),
  });

  return json({
    token: signJWT(claims, config.secret, `${seconds}s`),
    expiresIn: seconds,
  });
}

/** Revokes a delegation immediately, for both WebMCP and the MCP tools. */
export async function revokeGrant(
  request: Request,
  config: AuthConfig,
  options: WebMCPServerOptions = {}
): Promise<Response> {
  let body: { token?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch (_error) {
    body = {};
  }

  const token =
    typeof body.token === "string" ? body.token : readBearer(request);
  if (!token) return json({ error: "No token supplied" }, 400);

  const payload = verifyJWT(token, config.secret);
  revokeToken(token);

  options.onAudit?.({
    event: "revoke",
    ...(payload?.userId ? { userId: payload.userId } : {}),
    ...(payload?.agentId ? { agentId: payload.agentId } : {}),
    timestamp: new Date().toISOString(),
  });

  return json({ revoked: true });
}

function readBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? (match[1] as string) : null;
}

export interface VerifyActionOptions {
  /** Require the token to have been minted for this tool. */
  tool?: string;
  /** Require these scopes. */
  scopes?: string[];
  /** Replay protection store. Pass the same instance used by your routes. */
  nonceStore?: NonceStore;
  /** Accept a plain delegation token when no action token is present. */
  allowGrantToken?: boolean;
}

const sharedNonceStore = createMemoryNonceStore();

/**
 * Verifies an agent-driven request inside your own API routes.
 *
 * Returns the claims when the request carries a valid delegation for the
 * required scopes, or null when it does not — including when a human is calling
 * the endpoint normally, so use it to *identify* agent traffic, not to gate
 * humans out.
 */
export async function verifyWebMCPAction(
  request: Request,
  secret: string,
  options: VerifyActionOptions = {}
): Promise<WebMCPActionClaims | null> {
  const actionToken = request.headers.get("x-webmcp-action");
  const token =
    actionToken ?? (options.allowGrantToken ? readBearer(request) : null);

  if (!token) return null;
  if (isTokenRevoked(token)) return null;

  const payload = verifyJWT(token, secret);
  if (!payload) return null;

  if (payload.type !== "webmcp-action" && payload.type !== "mcp-agent") {
    return null;
  }
  if (payload.type === "mcp-agent" && !options.allowGrantToken) return null;

  // A token minted without a tool binding must not satisfy a tool-specific
  // check: that would let any action token stand in for a privileged one.
  if (options.tool && payload.type === "webmcp-action") {
    if (payload.tool !== options.tool) return null;
  }

  const scopes = payload.scopes ?? [];
  if (options.scopes?.length) {
    const covered = options.scopes.every((scope) => scopes.includes(scope));
    if (!covered) return null;
  }

  if (payload.type === "webmcp-action" && payload.nonce) {
    const store = options.nonceStore ?? sharedNonceStore;
    const accepted = await store.consume(
      payload.nonce,
      Date.now() + DEFAULT_ACTION_SECONDS * 1000
    );
    if (!accepted) return null;
  }

  return {
    userId: payload.userId,
    ...(payload.agentId ? { agentId: payload.agentId } : {}),
    scopes,
    ...(payload.tool ? { tool: payload.tool } : {}),
    type: payload.type,
  };
}

/**
 * Guard for routes that agents may call: resolves the human session, and when
 * the caller is an agent, requires a delegation carrying `scopes`.
 *
 * Throws nothing — inspect `allowed` and respond however your framework does.
 */
export async function authorizeWebMCPRequest(
  request: Request,
  config: { secret: string },
  scopes: string[] = [],
  options: VerifyActionOptions = {}
): Promise<{
  allowed: boolean;
  actor: "human" | "agent" | "anonymous";
  userId?: string;
  agentId?: string;
  scopes: string[];
  reason?: string;
}> {
  const isAgentCall =
    request.headers.has("x-webmcp-action") ||
    request.headers.has("x-webmcp-tool");

  if (isAgentCall) {
    const claims = await verifyWebMCPAction(request, config.secret, {
      ...options,
      ...(scopes.length ? { scopes } : {}),
    });

    if (!claims) {
      return {
        allowed: false,
        actor: "agent",
        scopes: [],
        reason: scopes.length
          ? `Agent request lacks a valid delegation for [${scopes.join(", ")}]`
          : "Agent request lacks a valid delegation",
      };
    }

    return {
      allowed: true,
      actor: "agent",
      userId: claims.userId,
      ...(claims.agentId ? { agentId: claims.agentId } : {}),
      scopes: claims.scopes,
    };
  }

  const session = await getSession(request, config.secret);
  if (!session) {
    return {
      allowed: false,
      actor: "anonymous",
      scopes: [],
      reason: "Not signed in",
    };
  }

  return {
    allowed: true,
    actor: "human",
    userId: session.user.id,
    scopes: session.scopes ?? [],
  };
}

export interface WebMCPHandlerOptions extends WebMCPServerOptions {
  /** Base path of the auth routes. Default: "/api/auth". */
  basePath?: string;
  /** Scopes advertised by the manifest endpoint. */
  manifest?: {
    name?: string;
    description?: string;
    tools?: Array<{ name: string; description: string; scopes?: string[] }>;
  };
}

/**
 * Framework-agnostic handler for the WebMCP routes.
 *
 * Returns `null` for paths it does not own, so it composes with an existing
 * router or the SDK's Next.js proxy:
 *
 *   POST {basePath}/webmcp/grant   — issue a scoped delegation (user session required)
 *   POST {basePath}/webmcp/action  — mint a single-use action token
 *   POST {basePath}/webmcp/revoke  — revoke a delegation
 *   GET  {basePath}/webmcp/manifest— advertise scopes and tools for discovery
 */
export function createWebMCPHandler(
  config: AuthConfig,
  options: WebMCPHandlerOptions = {}
) {
  const base = (options.basePath ?? "/api/auth").replace(/\/$/, "");

  // eslint-disable-next-line require-await
  return async function handler(request: Request): Promise<Response | null> {
    const pathname = new URL(request.url).pathname;
    if (!pathname.startsWith(`${base}/webmcp/`)) return null;

    const route = pathname.slice(`${base}/webmcp/`.length);
    const method = request.method.toUpperCase();

    if (route === "grant" && method === "POST") {
      return issueGrant(request, config, options);
    }
    if (route === "action" && method === "POST") {
      return issueActionToken(request, config, options);
    }
    if (route === "revoke" && method === "POST") {
      return revokeGrant(request, config, options);
    }
    if (route === "manifest" && method === "GET") {
      return json({
        version: 1,
        name: options.manifest?.name ?? "webmcp",
        description:
          options.manifest?.description ??
          "WebMCP tools exposed by this site, secured by @warpy-auth-sdk/core.",
        allowedScopes: options.allowedScopes ?? [],
        maxGrantSeconds: options.maxGrantSeconds ?? DEFAULT_GRANT_SECONDS,
        tools: options.manifest?.tools ?? [],
        endpoints: {
          grant: `${base}/webmcp/grant`,
          action: `${base}/webmcp/action`,
          revoke: `${base}/webmcp/revoke`,
        },
      });
    }

    return json({ error: "Unknown WebMCP route" }, 404);
  };
}
