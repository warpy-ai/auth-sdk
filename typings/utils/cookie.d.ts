export declare const SESSION_COOKIE_NAME = "auth-session";
export interface CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
}
export declare function serializeCookie(name: string, value: string, options?: CookieOptions): string;
export declare function parseCookies(cookieHeader?: string | null): Record<string, string>;
export declare function getSessionCookie(cookieHeader?: string | null): string | null;
export declare function clearCookie(name: string): string;
