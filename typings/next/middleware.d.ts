import type { AuthConfig } from "../core";
import { type NextAuthHandlerOptions } from "./handler";
export interface AuthMiddlewareOptions extends NextAuthHandlerOptions {
    publicRoutes?: string[];
    protectedRoutes?: string[];
}
export declare function authMiddleware(configOrOptions?: AuthConfig | AuthMiddlewareOptions, maybeOptions?: AuthMiddlewareOptions): (request: Request) => Promise<Response>;
