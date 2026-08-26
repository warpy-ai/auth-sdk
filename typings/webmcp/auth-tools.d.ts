import type { WebMCPEndpoints, WebMCPToolDefinition } from "./types";
import { type GrantStore } from "./grant";
export interface AuthToolsOptions {
    endpoints: WebMCPEndpoints;
    grants: GrantStore;
    agentId?: string;
    allowedScopes?: string[];
    grantTtl?: string;
    providers?: string[];
    signIn?: boolean;
    signOut?: boolean;
    twoFactor?: boolean;
}
export declare function createAuthTools(options: AuthToolsOptions): WebMCPToolDefinition[];
