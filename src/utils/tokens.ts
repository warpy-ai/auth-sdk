import crypto from 'crypto';

// Store magic link tokens (in-memory for now, should use DB/Redis in production)
const magicTokens = new Map<string, { email: string; expires: number; userId?: string }>();

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function createMagicToken(email: string, userId?: string, expiresInMs: number = 900000): string {
  const token = generateSecureToken();

  magicTokens.set(token, {
    email,
    userId,
    expires: Date.now() + expiresInMs, // Default 15 minutes
  });

  return token;
}

export function verifyMagicToken(token: string): { email: string; userId?: string } | null {
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
