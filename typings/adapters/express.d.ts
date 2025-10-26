export type ExpressRequest = {
    headers: Record<string, string | string[] | undefined>;
    method: string;
    url: string;
    body?: unknown;
    session?: unknown;
};
export type ExpressResponse = {
    setHeader: (name: string, value: string | string[]) => ExpressResponse;
    status: (code: number) => ExpressResponse;
    redirect: (url: string) => void;
    json: (body: unknown) => void;
    send: (body: unknown) => void;
};
export type ExpressNextFunction = () => void;
export type ExpressApplication = {
    get: (path: string, handler: (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => void | Promise<void>) => void;
    post: (path: string, handler: (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => void | Promise<void>) => void;
    use?: (middleware: unknown) => void;
};
import type { AuthConfig } from "../core";
import { type MCPShieldConfig } from "../shield/mcpShield";
export interface ExpressAuthOptions {
    basePath?: string;
    successRedirect?: string;
    errorRedirect?: string;
    mcp?: {
        enabled?: boolean;
        path?: string;
        shield?: MCPShieldConfig;
    };
}
export type RequireAuth = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => Promise<void>;
export declare function registerAuthRoutes(app: ExpressApplication, config: AuthConfig, options?: ExpressAuthOptions): {
    requireAuth: RequireAuth;
};
