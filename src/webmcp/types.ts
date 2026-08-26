/**
 * Type definitions for WebMCP (https://github.com/webmachinelearning/webmcp).
 *
 * WebMCP lets a page expose its own functionality to browser-resident AI agents
 * as callable tools. The agent runs in the user's tab, so it inherits the user's
 * session: every tool call is, in practice, an authenticated action. This module
 * defines both the browser API shims and the auth-aware tool contract this SDK
 * layers on top of it.
 */

import type { PaymentReceipt, ToolPrice } from "./paywall/types";

/** Minimal JSON Schema shape accepted by WebMCP for tool inputs. */
export interface JSONSchema {
  type?: string;
  description?: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: unknown[];
  default?: unknown;
  [key: string]: unknown;
}

/**
 * Behavioural hints agents use to decide whether a call needs a human in the
 * loop. Mirrors the MCP `ToolAnnotations` dictionary.
 */
export interface ToolAnnotations {
  title?: string;
  /** Tool only reads state. Agents may auto-approve these. */
  readOnlyHint?: boolean;
  /** Tool performs irreversible work. Hosts should confirm with the user. */
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
  /** Output may contain content the site does not control (user submissions). */
  untrustedContentHint?: boolean;
}

export interface ToolContentBlock {
  type: "text";
  text: string;
}

/** The response shape WebMCP hosts expect back from `execute`. */
export interface ToolResponse {
  content: ToolContentBlock[];
  structuredContent?: unknown;
  isError?: boolean;
}

/** A tool descriptor as handed to `document.modelContext.registerTool`. */
export interface ModelContextToolDescriptor {
  name: string;
  description: string;
  inputSchema?: JSONSchema;
  annotations?: ToolAnnotations;
  execute: (args: Record<string, unknown>) => unknown | Promise<unknown>;
}

export interface RegisterToolOptions {
  /** Aborting the signal unregisters the tool (the spec has no `unregisterTool`). */
  signal?: AbortSignal;
  /** Origins allowed to see and call this tool when framed. Default: same origin only. */
  exposedTo?: string[];
}

export interface RegisteredTool {
  name: string;
  description?: string;
  inputSchema?: JSONSchema;
  origin?: string;
}

/**
 * The `modelContext` object exposed by the browser. Every member is optional
 * because the API is still shipping behind a flag/origin trial and has changed
 * shape between Chrome releases.
 */
export interface ModelContext {
  registerTool?: (
    tool: ModelContextToolDescriptor,
    options?: RegisterToolOptions
  ) => Promise<unknown> | unknown;
  /** Removed from the spec in 2026; still present in older Chromium builds. */
  unregisterTool?: (name: string) => unknown;
  /** Legacy bulk registration (`navigator.modelContext`, pre-Chrome 150). */
  provideContext?: (context: {
    tools: ModelContextToolDescriptor[];
  }) => unknown;
  clearContext?: () => unknown;
  getTools?: (options?: {
    fromOrigins?: string[];
  }) => Promise<RegisteredTool[]> | RegisteredTool[];
  executeTool?: (
    tool: RegisteredTool,
    args: Record<string, unknown>,
    options?: { signal?: AbortSignal }
  ) => Promise<ToolResponse>;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

/** Which `modelContext` binding the runtime found, if any. */
export type ModelContextHost = "document" | "navigator" | "bridge" | "none";

/* -------------------------------------------------------------------------- */
/*                             Auth-aware tool layer                          */
/* -------------------------------------------------------------------------- */

/** Session as returned by `GET {basePath}/session`. */
export interface WebMCPSession {
  user: { id: string; email?: string; name?: string; picture?: string };
  type?: "standard" | "mcp-agent";
  scopes?: string[];
  agentId?: string;
  expires?: string | Date;
}

export type ConfirmMode = "never" | "auto" | "always";

export interface ConfirmRequest {
  tool: string;
  /** Human readable summary of what is about to happen. */
  message: string;
  args: Record<string, unknown>;
  destructive: boolean;
  scopes: string[];
  session: WebMCPSession | null;
}

export type ConfirmHandler = (
  request: ConfirmRequest
) => boolean | Promise<boolean>;

export type WebMCPDenialReason =
  | "unauthenticated"
  | "missing_scope"
  | "payment_required"
  | "payment_failed"
  | "declined_by_user"
  | "rate_limited"
  | "session_expired"
  | "policy"
  | "invalid_arguments";

export interface WebMCPAuditEvent {
  /** Unique per call, so `start` and its terminal event can be correlated. */
  id: string;
  tool: string;
  phase: "start" | "allowed" | "denied" | "error" | "success";
  reason?: WebMCPDenialReason;
  message?: string;
  /** Arguments with configured keys redacted. */
  args?: Record<string, unknown>;
  scopes?: string[];
  userId?: string;
  agentId?: string;
  durationMs?: number;
  timestamp: string;
}

/** Fetch wrapper handed to tools: same-origin, credentialed, action-token signed. */
export type WebMCPFetch = (
  input: string,
  init?: RequestInit
) => Promise<Response>;

export interface WebMCPToolContext {
  toolName: string;
  session: WebMCPSession | null;
  scopes: string[];
  /** The receipt covering this call, when the tool is paywalled. */
  receipt?: PaymentReceipt | null;
  /**
   * `fetch` bound to this tool call. It attaches the session cookie, an
   * `X-WebMCP-Tool` header and a single-use action token so the backend can
   * verify the request came from an approved agent action.
   */
  fetch: WebMCPFetch;
  /** Ask the user mid-execution. Resolves false if the user declines. */
  confirm: (message: string) => Promise<boolean>;
  signal?: AbortSignal;
}

export interface WebMCPRateLimit {
  limit: number;
  windowMs: number;
}

/**
 * An auth-aware tool. Superset of the WebMCP descriptor: the extra fields are
 * enforced by this SDK before `execute` is ever reached.
 */
export interface WebMCPToolDefinition<
  Args extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  description: string;
  inputSchema?: JSONSchema;
  annotations?: ToolAnnotations;
  /** Scopes the current session must hold. Implies `requireAuth`. */
  scopes?: string[];
  /** Require a signed-in user. Defaults to true when `scopes` is set. */
  requireAuth?: boolean;
  /** Confirmation policy. Defaults to the policy default (`auto`). */
  confirm?: ConfirmMode;
  /** Message shown when confirming; receives the call arguments. */
  confirmMessage?: string | ((args: Args) => string);
  /** Per-tool rate limit, overriding the policy default. */
  rateLimit?: WebMCPRateLimit;
  /** Origins allowed to call this tool when the page is framed. */
  exposedTo?: string[];
  /**
   * What this tool costs. The server's pricing table is authoritative — this
   * is what the page tells agents, and it is checked against the server before
   * anything runs.
   */
  price?: ToolPrice;
  execute: (
    args: Args,
    context: WebMCPToolContext
  ) => unknown | Promise<unknown>;
}

export interface WebMCPPolicy {
  /** Require an authenticated session for every tool. Default: false. */
  requireAuth?: boolean;
  /** Scopes every tool call must carry, on top of per-tool scopes. */
  scopes?: string[];
  /** Default confirmation mode. Default: `auto` (confirm destructive tools). */
  confirm?: ConfirmMode;
  /** How confirmations are shown. Defaults to `window.confirm`. */
  confirmHandler?: ConfirmHandler;
  /** Default rate limit per tool. Default: 30 calls / 60s. */
  rateLimit?: WebMCPRateLimit | false;
  /** Origins tools may be exposed to when framed. Default: none (same origin). */
  exposedTo?: string[];
  /** Argument/result keys scrubbed from audit events and tool output. */
  redact?: string[];
  /** Truncate serialized tool output to this many characters. Default: 20000. */
  maxOutputChars?: number;
  /** Receives every lifecycle event. Wire this to your logging pipeline. */
  onAudit?: (event: WebMCPAuditEvent) => void;
}

export interface WebMCPEndpoints {
  session: string;
  signIn: string;
  signOut: string;
  twoFactor: string;
  /** Mints single-use action tokens for agent-driven writes. */
  action: string;
  /** Issues scoped, short-lived agent tokens. */
  grant: string;
  revoke: string;
  /** Asks what a tool costs and whether the caller already has access. */
  paywallQuote: string;
  /** Redeems a proof of payment for a receipt. */
  paywallSettle: string;
}

/** Response from `POST {basePath}/webmcp/grant`. */
export interface WebMCPGrantResponse {
  token: string;
  agentId?: string;
  scopes?: string[];
  /** ISO timestamp. */
  expires?: string;
}
