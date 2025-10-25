export declare const SESSION_COOKIE_NAME = "auth-session";
export declare const PKCE_VERIFIER_COOKIE_NAME = "auth_pkce_verifier";
export interface CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    maxAge?: number;
    path?: string;
}
export declare function serializeCookie(name: string, value: string, options?: CookieOptions): string;
export declare function parseCookies(cookieHeader?: string | null): Record<string, string>;
export declare function getSessionCookie(cookieHeader?: string | null): string | null;
export declare function clearCookie(name: string): string;
export declare function getPKCEVerifierCookie(cookieHeader?: string | null): string | null;
export declare function createPKCEVerifierCookie(verifier: string): string;
export declare function clearPKCEVerifierCookie(): string;
