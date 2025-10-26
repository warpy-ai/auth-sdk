export type FastifyInstance = {
    get: (path: string, handler: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown> | unknown) => void;
    post: (path: string, handler: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown> | unknown) => void;
    decorateRequest?: (name: string, value: unknown) => void;
};
export type FastifyRequest = {
    headers: Record<string, string | string[] | undefined>;
    method: string;
    url: string;
    body?: unknown;
};
export type FastifyReply = {
    header: (name: string, value: string | string[]) => FastifyReply;
    code: (statusCode: number) => FastifyReply;
    redirect: (url: string, statusCode?: number) => FastifyReply;
    send: (payload: unknown) => FastifyReply;
};
import type { AuthConfig } from "../core";
import { type MCPShieldConfig } from "../shield/mcpShield";
export interface FastifyAuthOptions {
    basePath?: string;
    successRedirect?: string;
    errorRedirect?: string;
    mcp?: {
        enabled?: boolean;
        path?: string;
        shield?: MCPShieldConfig;
    };
}
type RequireAuth = (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function registerAuthPlugin(instance: FastifyInstance, config: AuthConfig, options?: FastifyAuthOptions): {
    requireAuth: RequireAuth;
};
export {};
