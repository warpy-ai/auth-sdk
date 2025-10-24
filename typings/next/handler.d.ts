import type { AuthConfig } from "../core";
export interface NextAuthHandlerOptions {
    basePath?: string;
    successRedirect?: string;
    errorRedirect?: string;
}
export declare function createNextAuthHandler(config: AuthConfig, options?: NextAuthHandlerOptions): (request: Request) => Promise<Response>;
