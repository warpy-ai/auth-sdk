// src/core.ts
import type { Provider } from "./providers/types";

export interface AuthConfig {
  provider: Provider; // e.g., google({ clientId: '...', clientSecret: '...' })
  secret: string; // For signing JWT/cookies
  adapter?: Adapter; // Optional DB adapter for sessions
  // Other opts: basePath, callbacks for custom logic
}

export interface Session {
  user: { id: string; email: string; name?: string };
  expires: Date;
}

export async function authenticate(config: AuthConfig) {
  // Internal: Handle sign-in flow, validate CSRF, etc.
  // Returns { session, error }
}

export async function getSession(req: Request): Promise<Session | null> {
  // Parse cookies/JWT, validate, revalidate if needed
}

export async function signOut() {
  // Clear session, revoke tokens
}

// Export providers as functions
export { google } from "./providers/google";
export { email } from "./providers/email";
// etc.
