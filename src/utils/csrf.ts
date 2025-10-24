import crypto from "crypto";

// Store CSRF tokens (in-memory for now, could use Redis/DB)
const csrfTokens = new Map<string, { token: string; expires: number }>();

export function generateCSRFToken(sessionId?: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const id = sessionId || token;

  // Token expires in 1 hour
  csrfTokens.set(id, { token, expires: Date.now() + 3600000 });

  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored) return false;
  if (stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }

  const isValid = stored.token === token;

  // One-time use token
  if (isValid) {
    csrfTokens.delete(sessionId);
  }

  return isValid;
}

export function cleanExpiredTokens(): void {
  const now = Date.now();
  for (const [id, data] of csrfTokens.entries()) {
    if (data.expires < now) {
      csrfTokens.delete(id);
    }
  }
}

// Auto-cleanup every 15 minutes
setInterval(cleanExpiredTokens, 900000);
