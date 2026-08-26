import type { AuthConfig } from "../core";
import { type WebMCPHandlerOptions } from "../webmcp/server";
export interface NextAuthHandlerOptions {
    basePath?: string;
    successRedirect?: string;
    errorRedirect?: string;
    routes?: {
        session?: string;
        signOut?: string;
        signIn?: string;
        callback?: string;
    };
    webmcp?: false | Omit<WebMCPHandlerOptions, "basePath">;
}
export declare function createNextAuthHandler(config: AuthConfig, options?: NextAuthHandlerOptions): (request: Request) => Promise<Response>;
