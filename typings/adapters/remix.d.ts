export type RemixLoaderArgs = {
    request: Request;
    params?: Record<string, string | undefined>;
    context?: unknown;
};
export type RemixActionArgs = {
    request: Request;
    params?: Record<string, string | undefined>;
    context?: unknown;
};
import type { AuthConfig, Session } from "../core";
import { type MCPShieldConfig } from "../shield/mcpShield";
export interface RemixAuthOptions {
    basePath?: string;
    successRedirect?: string;
    errorRedirect?: string;
    mcp?: {
        enabled?: boolean;
        path?: string;
        shield?: MCPShieldConfig;
    };
}
export declare function getSession(request: Request, config: AuthConfig): Promise<Session | null>;
export declare function requireAuth(request: Request, config: AuthConfig, options?: {
    redirectTo?: string;
}): Promise<Session>;
export declare function createAuthHandlers(config: AuthConfig, options?: RemixAuthOptions): {
    authLoader: (args: RemixLoaderArgs) => Promise<Response | null>;
    authAction: (args: RemixActionArgs) => Promise<Response | null>;
    sessionLoader: ({ request }: RemixLoaderArgs) => Promise<Response | null>;
    signOutAction: ({ request }: RemixActionArgs) => Promise<Response | null>;
    signInLoader: ({ request, params }: RemixLoaderArgs) => Promise<Response | null>;
    callbackLoader: ({ request, params }: RemixLoaderArgs) => Promise<Response | null>;
    emailSignInAction: ({ request }: RemixActionArgs) => Promise<Response | null>;
    twoFactorAction: ({ request }: RemixActionArgs) => Promise<Response | null>;
    mcpAction: ({ request }: RemixActionArgs) => Promise<Response | null>;
};
export type { Session } from "../core";
