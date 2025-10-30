import { signJWT, verifyJWT, type JWTPayload } from "./utils/jwt";
import {
  serializeCookie,
  getSessionCookie,
  clearCookie,
  SESSION_COOKIE_NAME,
  getPKCEVerifierCookie,
  createPKCEVerifierCookie,
  clearPKCEVerifierCookie,
} from "./utils/cookie";
import { generateCSRFToken, validateCSRFToken } from "./utils/csrf";
import { OAuthProvider } from "./utils/oauth";
import type {
  Provider,
  OAuthProviderConfig,
  EmailProviderConfig,
  TwoFactorProviderConfig,
} from "./providers/types";
import type { Adapter } from "./adapters/types";
import type { CaptchaEnforcement } from "./captcha/types";
import { createCaptchaProvider } from "./captcha";

export interface AuthConfig {
  provider: Provider;
  secret: string;
  adapter?: Adapter;
  mcp?: { enabled: boolean; scopes?: string[] };
  warpy?: {
    apiKey?: string;
    baseUrl?: string;
  };
  captcha?: CaptchaEnforcement;
  callbacks?: {
    /**
     * Resolve and/or upsert the application user given an OAuth profile or verified email.
     * Return the user object to embed in the session.
     */
    user?: (
      user: { id?: string; email: string; name?: string; picture?: string },
      context?: { provider?: string }
    ) =>
      | Promise<{ id: string; email: string; name?: string; picture?: string }>
      | { id: string; email: string; name?: string; picture?: string };
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
  cookies?: string[]; // Set-Cookie headers to send to client
  identifier?: string; // For 2FA: identifier to verify code
  expiresIn?: number; // For 2FA: code expiration time in milliseconds
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

    // Handle Two-Factor authentication provider
    if (provider.type === "twofa") {
      return await handleTwoFactorAuthentication(provider, config, request);
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

    // Generate PKCE challenge if enabled
    const cookies: string[] = [];
    let pkceChallenge;

    if (provider.pkce !== false && provider.pkce) {
      pkceChallenge = oauthProvider.generatePKCEChallenge(provider.pkce);
      // Store verifier in secure cookie
      cookies.push(createPKCEVerifierCookie(pkceChallenge.verifier));
    }

    const authorizeUrl = oauthProvider.getAuthorizeUrl(
      csrfState,
      pkceChallenge
    );

    return { redirectUrl: authorizeUrl, cookies };
  }

  // Validate CSRF state
  if (!state) {
    return { error: "Invalid CSRF token" };
  }
  // Accept either in-memory token or cookie-based fallback
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch =
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("auth_oauth_state=")) || "";
  const cookieState = cookieMatch
    ? decodeURIComponent(cookieMatch.split("=")[1] || "")
    : "";
  const hasMemory = validateCSRFToken("oauth", state);
  const hasCookie = cookieState && cookieState === state;
  if (!hasMemory && !hasCookie) {
    return { error: "Invalid CSRF token" };
  }

  // Exchange code for token
  const oauthProvider = new OAuthProvider(provider);

  // Retrieve PKCE verifier from cookie if PKCE is enabled
  let codeVerifier: string | undefined;

  if (provider.pkce !== false && provider.pkce) {
    codeVerifier = getPKCEVerifierCookie(cookieHeader) || undefined;
    if (!codeVerifier) {
      return {
        error:
          "PKCE verifier not found. Please restart the authentication flow.",
      };
    }
  }

  const tokenResponse = await oauthProvider.exchangeCodeForToken(
    code,
    codeVerifier
  );
  const userProfile = await provider.getUser(tokenResponse.access_token);

  // Clear PKCE verifier cookie after successful exchange
  const cookies: string[] = [];
  if (provider.pkce !== false && provider.pkce) {
    cookies.push(clearPKCEVerifierCookie());
  }

  // Resolve user: callbacks.user -> adapter -> raw profile
  let user: { id: string; email: string; name?: string; picture?: string } =
    userProfile;
  if (config.callbacks?.user) {
    user = await config.callbacks.user(
      {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        picture: userProfile.picture,
      },
      { provider: "oauth" }
    );
  } else if (config.adapter) {
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
  let jwtPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    type: "standard",
  } as JWTPayload;
  if (config.callbacks?.jwt) {
    jwtPayload = await config.callbacks.jwt(jwtPayload);
  }
  const sessionToken = signJWT(jwtPayload, config.secret);

  let session: Session = {
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
  if (config.callbacks?.session) {
    session = await config.callbacks.session(session);
  }

  // Store in adapter if available
  if (config.adapter) {
    await config.adapter.createSession({
      userId: user.id,
      expires: session.expires,
    });
  }

  return { session, cookies };
}

async function handleEmailAuthentication(
  provider: EmailProviderConfig,
  config: AuthConfig,
  request: Request
): Promise<AuthenticateResult> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");
  const captchaToken = url.searchParams.get("captchaToken");

  // If token provided, verify magic link
  if (token) {
    const verified = await provider.verify(token);
    if (!verified) {
      return { error: "Invalid or expired magic link" };
    }

    // Resolve user
    let user: { id: string; email: string; name?: string } | any;
    if (config.callbacks?.user) {
      user = await config.callbacks.user(
        { id: verified.userId, email: verified.email },
        { provider: "email" }
      );
    } else if (config.adapter) {
      user = await config.adapter.getUserByEmail(verified.email);
      if (!user) {
        user = await config.adapter.createUser({ email: verified.email });
      }
    } else {
      user = { id: verified.userId || verified.email, email: verified.email };
    }

    // Create session
    let jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      type: "standard",
    } as JWTPayload;
    if (config.callbacks?.jwt) {
      jwtPayload = await config.callbacks.jwt(jwtPayload);
    }
    const sessionToken = signJWT(jwtPayload, config.secret);

    let session: Session = {
      user: { id: user.id, email: user.email, name: user.name },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token: sessionToken,
      type: "standard",
    };
    if (config.callbacks?.session) {
      session = await config.callbacks.session(session);
    }

    return { session };
  }

  // If email provided, send magic link
  if (email) {
    // Verify CAPTCHA if configured and enforced for email
    if (
      config.captcha &&
      (config.captcha.enforceOnEmail ?? true)
    ) {
      if (!captchaToken) {
        return { error: "CAPTCHA token required" };
      }

      const captchaProvider = createCaptchaProvider(config.captcha.provider);
      const remoteIp = request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") || undefined;
      const captchaResult = await captchaProvider.verify(
        captchaToken,
        remoteIp
      );

      if (!captchaResult.success) {
        return {
          error: `CAPTCHA verification failed: ${captchaResult.errorCodes?.join(", ") || "unknown error"}`,
        };
      }
    }

    const callbackUrl = url.origin + url.pathname;
    await provider.sendMagicLink(email, callbackUrl);
    return { session: undefined }; // No error, email sent
  }

  return { error: "Email or token required" };
}

async function handleTwoFactorAuthentication(
  provider: TwoFactorProviderConfig,
  config: AuthConfig,
  request: Request
): Promise<AuthenticateResult> {
  const url = new URL(request.url);
  const identifier = url.searchParams.get("identifier");
  const code = url.searchParams.get("code");
  const email = url.searchParams.get("email");
  const captchaToken = url.searchParams.get("captchaToken");

  // If identifier and code provided, verify the 2FA code
  if (identifier && code) {
    const verified = await provider.verifyCode(identifier, code);
    if (!verified) {
      return { error: "Invalid or expired verification code" };
    }

    // Resolve user
    let user: { id: string; email: string; name?: string } | any;
    if (config.callbacks?.user) {
      user = await config.callbacks.user(
        { id: verified.userId, email: verified.email },
        { provider: "twofa" }
      );
    } else if (config.adapter) {
      user = await config.adapter.getUserByEmail(verified.email);
      if (!user) {
        user = await config.adapter.createUser({ email: verified.email });
      }
    } else {
      user = { id: verified.userId || verified.email, email: verified.email };
    }

    // Create session
    let jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      type: "standard",
    } as JWTPayload;
    if (config.callbacks?.jwt) {
      jwtPayload = await config.callbacks.jwt(jwtPayload);
    }
    const sessionToken = signJWT(jwtPayload, config.secret);

    let session: Session = {
      user: { id: user.id, email: user.email, name: user.name },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token: sessionToken,
      type: "standard",
    };
    if (config.callbacks?.session) {
      session = await config.callbacks.session(session);
    }

    return { session };
  }

  // If email provided, send 2FA code
  if (email) {
    // Verify CAPTCHA if configured and enforced for two-factor
    if (
      config.captcha &&
      (config.captcha.enforceOnTwoFactor ?? true)
    ) {
      if (!captchaToken) {
        return { error: "CAPTCHA token required" };
      }

      const captchaProvider = createCaptchaProvider(config.captcha.provider);
      const remoteIp = request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") || undefined;
      const captchaResult = await captchaProvider.verify(
        captchaToken,
        remoteIp
      );

      if (!captchaResult.success) {
        return {
          error: `CAPTCHA verification failed: ${captchaResult.errorCodes?.join(", ") || "unknown error"}`,
        };
      }
    }

    const result = await provider.sendCode(email);
    // Return the identifier and expiresIn so the client can use it to verify the code
    return {
      identifier: result.identifier,
      expiresIn: result.expiresIn,
    };
  }

  return { error: "Email, identifier, or code required" };
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
  } catch (_error) {
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

// Export CAPTCHA providers and types
export { createCaptchaProvider } from "./captcha";
export type {
  CaptchaConfig,
  CaptchaProvider,
  CaptchaVerificationResult,
  CaptchaEnforcement,
  RecaptchaV2Config,
  RecaptchaV3Config,
  HCaptchaConfig,
  TurnstileConfig,
} from "./captcha/types";
