import { serialize, parse, type SerializeOptions } from "cookie";

export const SESSION_COOKIE_NAME = "auth-session";
export const PKCE_VERIFIER_COOKIE_NAME = "auth_pkce_verifier";

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
  path?: string;
}

export function serializeCookie(
  name: string,
  value: string,
  options?: CookieOptions
): string {
  const defaultOptions: SerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    ...options,
  };

  return serialize(name, value, defaultOptions);
}

export function parseCookies(
  cookieHeader?: string | null
): Record<string, string> {
  if (!cookieHeader) return {};
  const parsed = parse(cookieHeader);
  // Filter out undefined values
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function getSessionCookie(cookieHeader?: string | null): string | null {
  const cookies = parseCookies(cookieHeader);
  return cookies[SESSION_COOKIE_NAME] || null;
}

export function clearCookie(name: string): string {
  return serialize(name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getPKCEVerifierCookie(
  cookieHeader?: string | null
): string | null {
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  return cookies[PKCE_VERIFIER_COOKIE_NAME] || null;
}

export function createPKCEVerifierCookie(verifier: string): string {
  return serializeCookie(PKCE_VERIFIER_COOKIE_NAME, verifier, {
    maxAge: 600, // 10 minutes (enough time to complete OAuth flow)
  });
}

export function clearPKCEVerifierCookie(): string {
  return clearCookie(PKCE_VERIFIER_COOKIE_NAME);
}
