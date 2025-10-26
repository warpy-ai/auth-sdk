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
export {
  email,
  type EmailProviderOptions,
  type CustomEmailTemplate,
} from "./providers/email";
export { facebook, type FacebookProviderOptions } from "./providers/facebook";
export { github, type GitHubProviderOptions } from "./providers/github";
export { gitlab, type GitLabProviderOptions } from "./providers/gitlab";
export { linkedin, type LinkedInProviderOptions } from "./providers/linkedin";
export { microsoft, type MicrosoftProviderOptions } from "./providers/microsoft";
export { spotify, type SpotifyProviderOptions } from "./providers/spotify";
export { discord, type DiscordProviderOptions } from "./providers/discord";
export { twitch, type TwitchProviderOptions } from "./providers/twitch";
export { epic, type EpicProviderOptions } from "./providers/epic";
export { custom, type CustomProviderOptions } from "./providers/custom";
export {
  twofa,
  type TwoFactorProviderOptions,
  type CustomTwoFactorTemplate,
} from "./providers/twofa";
export type {
  Provider,
  OAuthProviderConfig,
  EmailProviderConfig,
  TwoFactorProviderConfig,
} from "./providers/types";

// Email services and templates
export {
  createEmailService,
  renderEmailTemplate,
  NodemailerService,
  ResendService,
  type EmailService,
  type EmailServiceConfig,
  type NodemailerServiceConfig,
  type ResendServiceConfig,
  type SendEmailParams,
} from "./providers/email-services";
export { default as MagicLinkEmail } from "./providers/email-templates/MagicLinkEmail";
export { default as TwoFactorEmail } from "./providers/email-templates/TwoFactorEmail";

// Adapters
export { prismaAdapter } from "./adapters/prisma";
export type { Adapter } from "./adapters/types";

// MCP Tools
export { createMCPTools, isTokenRevoked } from "./mcp/mcp";
export { createMCPShield, type MCPShieldConfig } from "./shield/mcpShield";
export type { WarpyConfig, ShieldMetricsConfig } from "./shield/types";

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
  generateTwoFactorCode,
  createTwoFactorCode,
  verifyTwoFactorCode,
  cleanExpiredTwoFactorCodes,
} from "./utils/tokens";
export { OAuthProvider } from "./utils/oauth";

// Next.js Helpers
export {
  createNextAuthHandler,
  type NextAuthHandlerOptions,
} from "./next/handler";
