import type { ConfirmRequest, ModelContextToolDescriptor, WebMCPDenialReason, WebMCPEndpoints, WebMCPFetch, WebMCPPolicy, WebMCPRateLimit, WebMCPSession, WebMCPToolDefinition } from "./types";
import type { GrantStore } from "./grant";
export declare class RateLimiter {
    private readonly fallback;
    private calls;
    constructor(fallback: WebMCPRateLimit | false);
    check(tool: string, override?: WebMCPRateLimit): boolean;
    reset(tool?: string): void;
}
export declare function redact(value: unknown, keys?: string[], depth?: number): unknown;
export declare function defaultConfirmHandler(request: ConfirmRequest): boolean;
export interface GuardContext {
    policy: WebMCPPolicy;
    endpoints: WebMCPEndpoints;
    grants: GrantStore;
    getSession: () => Promise<WebMCPSession | null>;
    rateLimiter: RateLimiter;
    fetchImpl?: typeof fetch;
}
export declare class ToolDenied extends Error {
    readonly reason: WebMCPDenialReason;
    constructor(reason: WebMCPDenialReason, message: string);
}
export declare function guardTool(tool: WebMCPToolDefinition, context: GuardContext): ModelContextToolDescriptor;
export declare function createToolFetch(toolName: string, context: GuardContext): WebMCPFetch;
export declare const DEFAULT_REDACT_KEYS: string[];
export declare const DEFAULT_TOOL_RATE_LIMIT: WebMCPRateLimit;
