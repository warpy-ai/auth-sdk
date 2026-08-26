import type { PaymentReceipt, ToolPrice } from "./paywall/types";
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
export interface ToolAnnotations {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
    untrustedContentHint?: boolean;
}
export interface ToolContentBlock {
    type: "text";
    text: string;
}
export interface ToolResponse {
    content: ToolContentBlock[];
    structuredContent?: unknown;
    isError?: boolean;
}
export interface ModelContextToolDescriptor {
    name: string;
    description: string;
    inputSchema?: JSONSchema;
    annotations?: ToolAnnotations;
    execute: (args: Record<string, unknown>) => unknown | Promise<unknown>;
}
export interface RegisterToolOptions {
    signal?: AbortSignal;
    exposedTo?: string[];
}
export interface RegisteredTool {
    name: string;
    description?: string;
    inputSchema?: JSONSchema;
    origin?: string;
}
export interface ModelContext {
    registerTool?: (tool: ModelContextToolDescriptor, options?: RegisterToolOptions) => Promise<unknown> | unknown;
    unregisterTool?: (name: string) => unknown;
    provideContext?: (context: {
        tools: ModelContextToolDescriptor[];
    }) => unknown;
    clearContext?: () => unknown;
    getTools?: (options?: {
        fromOrigins?: string[];
    }) => Promise<RegisteredTool[]> | RegisteredTool[];
    executeTool?: (tool: RegisteredTool, args: Record<string, unknown>, options?: {
        signal?: AbortSignal;
    }) => Promise<ToolResponse>;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
}
export type ModelContextHost = "document" | "navigator" | "bridge" | "none";
export interface WebMCPSession {
    user: {
        id: string;
        email?: string;
        name?: string;
        picture?: string;
    };
    type?: "standard" | "mcp-agent";
    scopes?: string[];
    agentId?: string;
    expires?: string | Date;
}
export type ConfirmMode = "never" | "auto" | "always";
export interface ConfirmRequest {
    tool: string;
    message: string;
    args: Record<string, unknown>;
    destructive: boolean;
    scopes: string[];
    session: WebMCPSession | null;
}
export type ConfirmHandler = (request: ConfirmRequest) => boolean | Promise<boolean>;
export type WebMCPDenialReason = "unauthenticated" | "missing_scope" | "payment_required" | "payment_failed" | "declined_by_user" | "rate_limited" | "session_expired" | "policy" | "invalid_arguments";
export interface WebMCPAuditEvent {
    id: string;
    tool: string;
    phase: "start" | "allowed" | "denied" | "error" | "success";
    reason?: WebMCPDenialReason;
    message?: string;
    args?: Record<string, unknown>;
    scopes?: string[];
    userId?: string;
    agentId?: string;
    durationMs?: number;
    timestamp: string;
}
export type WebMCPFetch = (input: string, init?: RequestInit) => Promise<Response>;
export interface WebMCPToolContext {
    toolName: string;
    session: WebMCPSession | null;
    scopes: string[];
    receipt?: PaymentReceipt | null;
    fetch: WebMCPFetch;
    confirm: (message: string) => Promise<boolean>;
    signal?: AbortSignal;
}
export interface WebMCPRateLimit {
    limit: number;
    windowMs: number;
}
export interface WebMCPToolDefinition<Args extends Record<string, unknown> = Record<string, unknown>> {
    name: string;
    description: string;
    inputSchema?: JSONSchema;
    annotations?: ToolAnnotations;
    scopes?: string[];
    requireAuth?: boolean;
    confirm?: ConfirmMode;
    confirmMessage?: string | ((args: Args) => string);
    rateLimit?: WebMCPRateLimit;
    exposedTo?: string[];
    price?: ToolPrice;
    execute: (args: Args, context: WebMCPToolContext) => unknown | Promise<unknown>;
}
export interface WebMCPPolicy {
    requireAuth?: boolean;
    scopes?: string[];
    confirm?: ConfirmMode;
    confirmHandler?: ConfirmHandler;
    rateLimit?: WebMCPRateLimit | false;
    exposedTo?: string[];
    redact?: string[];
    maxOutputChars?: number;
    onAudit?: (event: WebMCPAuditEvent) => void;
}
export interface WebMCPEndpoints {
    session: string;
    signIn: string;
    signOut: string;
    twoFactor: string;
    action: string;
    grant: string;
    revoke: string;
    paywallQuote: string;
    paywallSettle: string;
}
export interface WebMCPGrantResponse {
    token: string;
    agentId?: string;
    scopes?: string[];
    expires?: string;
}
