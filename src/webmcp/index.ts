/**
 * WebMCP support for @warpy-auth-sdk/core.
 *
 * Browser-safe entry point: import from "@warpy-auth-sdk/core/webmcp" in client
 * code, and "@warpy-auth-sdk/core/webmcp/server" on the server.
 */

export {
  createWebMCP,
  resolveEndpoints,
  type WebMCPConfig,
  type WebMCPHandle,
  type WebMCPAuthOptions,
} from "./client";

export { createAuthTools, type AuthToolsOptions } from "./auth-tools";

export {
  createPageTools,
  createFormTools,
  describePage,
  describeForm,
  describeField,
  accessibleName,
  refFor,
  resolveRef,
  resetRefs,
  type PageToolsOptions,
  type PageSnapshot,
  type PageForm,
  type PageField,
  type PageAction,
  type PageLink,
  type PageHeading,
  type PageRegion,
} from "./page";

export {
  guardTool,
  redact,
  defaultConfirmHandler,
  createToolFetch,
  RateLimiter,
  ToolDenied,
  DEFAULT_REDACT_KEYS,
  DEFAULT_TOOL_RATE_LIMIT,
  type GuardContext,
} from "./policy";

export {
  GrantStore,
  toGrant,
  type WebMCPGrant,
  type GrantListener,
} from "./grant";

// Paywall (browser half). Providers and route handlers are server-side and live
// in "@warpy-auth-sdk/core/webmcp/paywall".
export {
  EntitlementStore,
  type EntitlementListener,
} from "./paywall/entitlement";
export {
  requestQuote,
  requestSettle,
  type PaywallEndpoints,
  type PaywallResult,
} from "./paywall/client";
export { PAYMENT_ARG } from "./policy";
export type {
  ToolPrice,
  PricingTable,
  PaymentChallenge,
  PaymentReceipt,
  PaywallQuoteResponse,
  X402PaymentRequired,
  X402PaymentRequirements,
} from "./paywall/types";

export {
  getModelContext,
  isWebMCPSupported,
  isSecureContext,
  registerTools,
  toToolResponse,
  BRIDGE_KEY,
  type WebMCPBridge,
  type RegistrationHandle,
} from "./runtime";

export type {
  JSONSchema,
  ToolAnnotations,
  ToolResponse,
  ToolContentBlock,
  ModelContext,
  ModelContextHost,
  ModelContextToolDescriptor,
  RegisterToolOptions,
  RegisteredTool,
  WebMCPSession,
  WebMCPToolDefinition,
  WebMCPToolContext,
  WebMCPPolicy,
  WebMCPEndpoints,
  WebMCPAuditEvent,
  WebMCPDenialReason,
  WebMCPGrantResponse,
  WebMCPRateLimit,
  WebMCPFetch,
  ConfirmMode,
  ConfirmHandler,
  ConfirmRequest,
} from "./types";
