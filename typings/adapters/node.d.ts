import type { IncomingMessage, ServerResponse } from "http";
import type { AuthConfig, Session } from "../core";
import { type MCPShieldConfig } from "../shield/mcpShield";
export interface NodeAuthOptions {
    basePath?: string;
    successRedirect?: string;
    errorRedirect?: string;
    mcp?: {
        enabled?: boolean;
        path?: string;
        shield?: MCPShieldConfig;
    };
}
export type NodeAuthMiddleware = (req: IncomingMessage & {
    session?: Session;
}, res: ServerResponse) => Promise<boolean>;
export declare function createAuthHandler(config: AuthConfig, options?: NodeAuthOptions): {
    handler: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
    requireAuth: NodeAuthMiddleware;
};
export type { Session } from "../core";
export type { IncomingMessage, ServerResponse } from "http";
