import type { ModelContextHost, ToolResponse, WebMCPEndpoints, WebMCPPolicy, WebMCPSession, WebMCPToolDefinition } from "./types";
import { GrantStore } from "./grant";
import { type AuthToolsOptions } from "./auth-tools";
import { type PageToolsOptions } from "./page";
export type WebMCPAuthOptions = Omit<AuthToolsOptions, "endpoints" | "grants">;
export interface WebMCPConfig {
    basePath?: string;
    endpoints?: Partial<WebMCPEndpoints>;
    auth?: boolean | WebMCPAuthOptions;
    page?: boolean | PageToolsOptions;
    tools?: WebMCPToolDefinition[] | (() => WebMCPToolDefinition[]);
    policy?: WebMCPPolicy;
    namespace?: string;
    watch?: boolean;
    session?: WebMCPSession | null;
    getSession?: () => Promise<WebMCPSession | null>;
    fetchImpl?: typeof fetch;
    onReady?: (handle: WebMCPHandle) => void;
    onError?: (error: Error) => void;
}
export interface WebMCPHandle {
    readonly supported: boolean;
    readonly host: ModelContextHost;
    readonly tools: string[];
    readonly grants: GrantStore;
    refresh: () => Promise<void>;
    dispose: () => void;
    getSession: (force?: boolean) => Promise<WebMCPSession | null>;
    execute: (name: string, args?: Record<string, unknown>) => Promise<ToolResponse>;
}
export declare function resolveEndpoints(basePath?: string, overrides?: Partial<WebMCPEndpoints>): WebMCPEndpoints;
export declare function createWebMCP(config?: WebMCPConfig): WebMCPHandle;
