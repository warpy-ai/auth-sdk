// Core authentication functions
export {
  authenticate,
  getSession,
  signOut,
  verifyAgentToken,
  createSessionCookie,
  clearSessionCookie,
  type AuthConfig,
  type Session,
  type MCPLoginPayload,
  type AuthenticateResult,
} from "./core";

// Providers
export { google, type GoogleProviderOptions } from "./providers/google";
export { email, type EmailProviderOptions } from "./providers/email";
export type {
  Provider,
  OAuthProviderConfig,
  EmailProviderConfig,
} from "./providers/types";

// Adapters
export { prismaAdapter } from "./adapters/prisma";
export type { Adapter } from "./adapters/types";

// MCP Tools
export { createMCPTools, isTokenRevoked } from "./mcp/mcp";

// Utilities
export { signJWT, verifyJWT, decodeJWT, type JWTPayload } from "./utils/jwt";
export {
  serializeCookie,
  parseCookies,
  getSessionCookie,
  clearCookie,
  SESSION_COOKIE_NAME,
} from "./utils/cookie";
export {
  generateCSRFToken,
  validateCSRFToken,
  cleanExpiredTokens,
} from "./utils/csrf";
export {
  generateSecureToken,
  createMagicToken,
  verifyMagicToken,
  cleanExpiredMagicTokens,
} from "./utils/tokens";
export { OAuthProvider } from "./utils/oauth";

// Next.js Helpers
export {
  createNextAuthHandler,
  type NextAuthHandlerOptions,
} from "./next/handler";
