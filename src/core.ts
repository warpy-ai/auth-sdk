import { signJWT, verifyJWT, type JWTPayload } from "./utils/jwt";
import {
  serializeCookie,
  getSessionCookie,
  clearCookie,
  SESSION_COOKIE_NAME,
} from "./utils/cookie";
import { generateCSRFToken, validateCSRFToken } from "./utils/csrf";
import { OAuthProvider } from "./utils/oauth";
import type {
  Provider,
  OAuthProviderConfig,
  EmailProviderConfig,
} from "./providers/types";
import type { Adapter } from "./adapters/types";
import { createMCPTools } from "./mcp/mcp";

export interface AuthConfig {
  provider: Provider;
  secret: string;
  adapter?: Adapter;
  mcp?: { enabled: boolean; scopes?: string[] };
  callbacks?: {
    session?: (session: Session) => Session | Promise<Session>;
    jwt?: (token: JWTPayload) => JWTPayload | Promise<JWTPayload>;
  };
}

export interface Session {
  user: { id: string; email: string; name?: string; picture?: string };
  expires: Date;
  token?: string;
  type?: "standard" | "mcp-agent";
  scopes?: string[];
  agentId?: string;
}

export interface MCPLoginPayload {
  userId: string;
  scopes: string[];
  agentId: string;
  expiresIn: string;
}

export interface AuthenticateResult {
  session?: Session;
  error?: string;
  redirectUrl?: string;
}

export async function authenticate(
  config: AuthConfig,
  request?: Request,
  payload?: MCPLoginPayload
): Promise<AuthenticateResult> {
  try {
    // MCP Agent Login
    if (payload && config.mcp?.enabled) {
      const token = signJWT(
        {
          userId: payload.userId,
          scopes: payload.scopes,
          agentId: payload.agentId,
          type: "mcp-agent",
        },
        config.secret,
        payload.expiresIn
      );

      const session: Session = {
        user: {
          id: payload.userId,
          email: "",
          name: `Agent ${payload.agentId}`,
        },
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        token,
        type: "mcp-agent",
        scopes: payload.scopes,
        agentId: payload.agentId,
      };

      return { session };
    }

    // Standard authentication requires a request
    if (!request) {
      return { error: "Request object required for standard authentication" };
    }

    const provider = config.provider;

    // Handle OAuth provider
    if (provider.type === "oauth") {
      return await handleOAuthAuthentication(provider, config, request);
    }

    // Handle Email provider
    if (provider.type === "email") {
      return await handleEmailAuthentication(provider, config, request);
    }

    return { error: "Unsupported provider type" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

async function handleOAuthAuthentication(
  provider: OAuthProviderConfig,
  config: AuthConfig,
  request: Request
): Promise<AuthenticateResult> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // If no code, initiate OAuth flow
  if (!code) {
    const oauthProvider = new OAuthProvider(provider);
    // Generate CSRF token using the same sessionId key as validation ('oauth')
    const csrfState = generateCSRFToken("oauth");
    const authorizeUrl = oauthProvider.getAuthorizeUrl(csrfState);

    return { redirectUrl: authorizeUrl };
  }

  // Validate CSRF state
  if (!state || !validateCSRFToken("oauth", state)) {
    return { error: "Invalid CSRF token" };
  }

  // Exchange code for token
  const oauthProvider = new OAuthProvider(provider);
  const tokenResponse = await oauthProvider.exchangeCodeForToken(code);
  const userProfile = await provider.getUser(tokenResponse.access_token);

  // Create or get user from adapter
  let user = userProfile;
  if (config.adapter) {
    const existingUser = await config.adapter.getUserByEmail(userProfile.email);
    if (existingUser) {
      user = existingUser;
    } else {
      user = await config.adapter.createUser({
        email: userProfile.email,
        name: userProfile.name,
        picture: userProfile.picture,
      });
    }
  }

  // Create session
  const sessionToken = signJWT(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      type: "standard",
    },
    config.secret
  );

  const session: Session = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    token: sessionToken,
    type: "standard",
  };

  // Store in adapter if available
  if (config.adapter) {
    await config.adapter.createSession({
      userId: user.id,
      expires: session.expires,
    });
  }

  return { session };
}

async function handleEmailAuthentication(
  provider: EmailProviderConfig,
  config: AuthConfig,
  request: Request
): Promise<AuthenticateResult> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  // If token provided, verify magic link
  if (token) {
    const verified = await provider.verify(token);
    if (!verified) {
      return { error: "Invalid or expired magic link" };
    }

    // Get or create user
    let user;
    if (config.adapter) {
      user = await config.adapter.getUserByEmail(verified.email);
      if (!user) {
        user = await config.adapter.createUser({ email: verified.email });
      }
    } else {
      user = { id: verified.userId || verified.email, email: verified.email };
    }

    // Create session
    const sessionToken = signJWT(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        type: "standard",
      },
      config.secret
    );

    const session: Session = {
      user: { id: user.id, email: user.email, name: user.name },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token: sessionToken,
      type: "standard",
    };

    return { session };
  }

  // If email provided, send magic link
  if (email) {
    const callbackUrl = url.origin + url.pathname;
    await provider.sendMagicLink(email, callbackUrl);
    return { session: undefined }; // No error, email sent
  }

  return { error: "Email or token required" };
}

export async function getSession(
  request: Request,
  secret: string
): Promise<Session | null> {
  try {
    const cookieHeader = request.headers.get("cookie");
    const sessionToken = getSessionCookie(cookieHeader);

    if (!sessionToken) {
      return null;
    }

    const payload = verifyJWT(sessionToken, secret);
    if (!payload) {
      return null;
    }

    const session: Session = {
      user: {
        id: payload.userId,
        email: payload.email || "",
        name: payload.name,
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token: sessionToken,
      type: payload.type || "standard",
      scopes: payload.scopes,
      agentId: payload.agentId,
    };

    return session;
  } catch (error) {
    return null;
  }
}

export async function signOut(
  request: Request,
  config: AuthConfig
): Promise<void> {
  const cookieHeader = request.headers.get("cookie");
  const sessionToken = getSessionCookie(cookieHeader);

  if (sessionToken && config.adapter) {
    // Delete session from database
    await config.adapter.deleteSession(sessionToken);
  }

  // Cookie will be cleared by returning clearCookie in response
}

export function createSessionCookie(session: Session): string {
  return serializeCookie(SESSION_COOKIE_NAME, session.token || "", {
    maxAge: Math.floor((session.expires.getTime() - Date.now()) / 1000),
  });
}

export function clearSessionCookie(): string {
  return clearCookie(SESSION_COOKIE_NAME);
}

export async function verifyAgentToken(
  request: Request,
  secret: string
): Promise<Session | null> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  const payload = verifyJWT(token, secret);
  if (!payload || payload.type !== "mcp-agent") {
    return null;
  }

  return {
    user: {
      id: payload.userId,
      email: payload.email || "",
      name: payload.name,
    },
    expires: new Date(Date.now() + 15 * 60 * 1000),
    token,
    type: "mcp-agent",
    scopes: payload.scopes,
    agentId: payload.agentId,
  };
}

// Export providers and MCP tools
export { google } from "./providers/google";
export { email } from "./providers/email";
export type { Adapter } from "./adapters/types";

// MCP tools will be created per-instance with the app's secret
export { createMCPTools } from "./mcp/mcp";
