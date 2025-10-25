import crypto from "crypto";

// Store magic link tokens (in-memory for now, should use DB/Redis in production)
const magicTokens = new Map<
  string,
  { email: string; expires: number; userId?: string }
>();

// Store 2FA codes (in-memory for now, should use DB/Redis in production)
const twoFactorCodes = new Map<
  string,
  { email: string; code: string; expires: number; userId?: string }
>();

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function createMagicToken(
  email: string,
  userId?: string,
  expiresInMs: number = 900000
): string {
  const token = generateSecureToken();

  magicTokens.set(token, {
    email,
    userId,
    expires: Date.now() + expiresInMs, // Default 15 minutes
  });

  return token;
}

export function verifyMagicToken(
  token: string
): { email: string; userId?: string } | null {
  const stored = magicTokens.get(token);

  if (!stored) return null;
  if (stored.expires < Date.now()) {
    magicTokens.delete(token);
    return null;
  }

  // One-time use
  magicTokens.delete(token);

  return { email: stored.email, userId: stored.userId };
}

export function cleanExpiredMagicTokens(): void {
  const now = Date.now();
  for (const [token, data] of magicTokens.entries()) {
    if (data.expires < now) {
      magicTokens.delete(token);
    }
  }
}

// Auto-cleanup every 10 minutes
setInterval(cleanExpiredMagicTokens, 600000);

// ==================== 2FA CODE UTILITIES ====================

/**
 * Generate a 6-digit numeric code for 2FA
 */
export function generateTwoFactorCode(): string {
  // Generate a cryptographically secure 6-digit code
  const randomBytes = crypto.randomBytes(4);
  const code = (randomBytes.readUInt32BE(0) % 1000000)
    .toString()
    .padStart(6, "0");
  return code;
}

/**
 * Create a 2FA code and store it with an identifier
 * Returns both the identifier (to track the code) and the code itself
 */
export function createTwoFactorCode(
  email: string,
  userId?: string,
  expiresInMs: number = 300000 // Default 5 minutes
): { identifier: string; code: string } {
  const identifier = generateSecureToken();
  const code = generateTwoFactorCode();

  twoFactorCodes.set(identifier, {
    email,
    code,
    userId,
    expires: Date.now() + expiresInMs,
  });

  return { identifier, code };
}

/**
 * Verify a 2FA code using the identifier and code
 * Returns the email and userId if valid, null otherwise
 */
export function verifyTwoFactorCode(
  identifier: string,
  code: string
): { email: string; userId?: string } | null {
  const stored = twoFactorCodes.get(identifier);

  if (!stored) return null;
  if (stored.expires < Date.now()) {
    twoFactorCodes.delete(identifier);
    return null;
  }
  if (stored.code !== code) {
    // Don't delete on failed attempt - allow retries until expiration
    return null;
  }

  // One-time use after successful verification
  twoFactorCodes.delete(identifier);

  return { email: stored.email, userId: stored.userId };
}

/**
 * Clean expired 2FA codes
 */
export function cleanExpiredTwoFactorCodes(): void {
  const now = Date.now();
  for (const [identifier, data] of twoFactorCodes.entries()) {
    if (data.expires < now) {
      twoFactorCodes.delete(identifier);
    }
  }
}

// Auto-cleanup 2FA codes every 5 minutes
setInterval(cleanExpiredTwoFactorCodes, 300000);
