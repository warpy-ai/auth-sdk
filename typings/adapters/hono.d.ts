export type HonoContext = {
    req: {
        header: (name: string) => string | undefined;
        method: string;
        url: string;
        parseBody?: () => Promise<unknown>;
    };
    header: (name: string, value: string | string[], options?: {
        append?: boolean;
    }) => void;
    status: (code: number) => void;
    redirect: (url: string, status?: number) => Response;
    json: (body: unknown, status?: number) => Response;
    text: (text: string, status?: number) => Response;
    get?: (key: string) => unknown;
    set?: (key: string, value: unknown) => void;
};
export type HonoMiddleware = (c: HonoContext, next: () => Promise<void>) => Promise<Response | void>;
export type HonoApp = {
    get: (path: string, handler: (c: HonoContext) => Promise<Response> | Response) => void;
    post: (path: string, handler: (c: HonoContext) => Promise<Response> | Response) => void;
    use?: (path: string, middleware: HonoMiddleware) => void;
};
import type { AuthConfig } from "../core";
import { type MCPShieldConfig } from "../shield/mcpShield";
export interface HonoAuthOptions {
    basePath?: string;
    successRedirect?: string;
    errorRedirect?: string;
    mcp?: {
        enabled?: boolean;
        path?: string;
        shield?: MCPShieldConfig;
    };
}
export declare function registerAuthRoutes(app: HonoApp, config: AuthConfig, options?: HonoAuthOptions): {
    requireAuth: HonoMiddleware;
};
export type { Session } from "../core";
