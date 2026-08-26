import { type AuthConfig } from "../core";
import { type PaywallOptions } from "./paywall/server";
export interface WebMCPActionClaims {
    userId: string;
    agentId?: string;
    scopes: string[];
    tool?: string;
    type: "mcp-agent" | "webmcp-action";
}
export interface NonceStore {
    consume: (nonce: string, expiresAt: number) => boolean | Promise<boolean>;
}
export declare function createMemoryNonceStore(): NonceStore;
export interface WebMCPServerOptions {
    allowedScopes?: string[];
    maxGrantSeconds?: number;
    actionTokenSeconds?: number;
    nonceStore?: NonceStore;
    onGrant?: (context: {
        userId: string;
        scopes: string[];
        agentId: string;
        reason?: string;
        request: Request;
    }) => boolean | Promise<boolean>;
    onAudit?: (event: {
        event: "grant" | "grant_denied" | "action" | "revoke";
        userId?: string;
        agentId?: string;
        scopes?: string[];
        tool?: string;
        reason?: string;
        timestamp: string;
    }) => void;
}
export declare function issueGrant(request: Request, config: AuthConfig, options?: WebMCPServerOptions): Promise<Response>;
export declare function issueActionToken(request: Request, config: AuthConfig, options?: WebMCPServerOptions): Promise<Response>;
export declare function revokeGrant(request: Request, config: AuthConfig, options?: WebMCPServerOptions): Promise<Response>;
export interface VerifyActionOptions {
    tool?: string;
    scopes?: string[];
    nonceStore?: NonceStore;
    allowGrantToken?: boolean;
}
export declare function verifyWebMCPAction(request: Request, secret: string, options?: VerifyActionOptions): Promise<WebMCPActionClaims | null>;
export declare function authorizeWebMCPRequest(request: Request, config: {
    secret: string;
}, scopes?: string[], options?: VerifyActionOptions): Promise<{
    allowed: boolean;
    actor: "human" | "agent" | "anonymous";
    userId?: string;
    agentId?: string;
    scopes: string[];
    reason?: string;
}>;
export interface WebMCPHandlerOptions extends WebMCPServerOptions {
    basePath?: string;
    paywall?: PaywallOptions;
    manifest?: {
        name?: string;
        description?: string;
        tools?: Array<{
            name: string;
            description: string;
            scopes?: string[];
        }>;
    };
}
export declare function createWebMCPHandler(config: AuthConfig, options?: WebMCPHandlerOptions): (request: Request) => Promise<Response | null>;
