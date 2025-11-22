import type { AuthConfig } from "../core";
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
}
export declare function createNextAuthHandler(config: AuthConfig, options?: NextAuthHandlerOptions): (request: Request) => Promise<Response>;
