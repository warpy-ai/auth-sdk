import type { WebMCPGrantResponse } from "./types";

/**
 * A scoped delegation from the human to the agent driving the page.
 *
 * A WebMCP agent runs inside the user's authenticated tab, so it inherits the
 * session cookie whether we like it or not. A grant is the second factor that
 * makes that safe: privileged tools refuse to run unless the user has
 * explicitly delegated the matching scopes, for a bounded time, to a named
 * agent — and the backend can verify the same delegation server side.
 */
export interface WebMCPGrant {
  /** Short-lived JWT of type `mcp-agent`, verifiable by the backend. */
  token: string;
  agentId: string;
  scopes: string[];
  /** Epoch milliseconds. */
  expiresAt: number;
  issuedAt: number;
}

export type GrantListener = (grant: WebMCPGrant | null) => void;

/**
 * Holds the active grant in memory only.
 *
 * Deliberately not persisted: `localStorage` and `sessionStorage` are readable
 * by any script on the origin, and a delegation that survives a reload is a
 * delegation the user no longer remembers making. Grants are cheap to re-issue.
 */
export class GrantStore {
  private grant: WebMCPGrant | null = null;
  private listeners = new Set<GrantListener>();

  /** Returns the active grant, or null when absent or expired. */
  get(): WebMCPGrant | null {
    if (!this.grant) return null;
    if (this.grant.expiresAt <= Date.now()) {
      this.grant = null;
      this.emit();
      return null;
    }
    return this.grant;
  }

  set(grant: WebMCPGrant): void {
    this.grant = grant;
    this.emit();
  }

  clear(): void {
    if (!this.grant) return;
    this.grant = null;
    this.emit();
  }

  /** True when the active grant covers every requested scope. */
  has(scopes: string[]): boolean {
    if (scopes.length === 0) return true;
    const active = this.get();
    if (!active) return false;
    return scopes.every((scope) => active.scopes.includes(scope));
  }

  /** Scopes requested but not covered by the active grant. */
  missing(scopes: string[]): string[] {
    const active = this.get();
    const held = active ? active.scopes : [];
    return scopes.filter((scope) => !held.includes(scope));
  }

  subscribe(listener: GrantListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.grant);
      } catch (_error) {
        // A misbehaving listener must not break tool execution.
      }
    }
  }
}

/** Normalizes the `{basePath}/webmcp/grant` response into a stored grant. */
export function toGrant(
  response: WebMCPGrantResponse,
  fallbackScopes: string[]
): WebMCPGrant {
  const expiresAt = response.expires
    ? new Date(response.expires).getTime()
    : Date.now() + 15 * 60 * 1000;

  return {
    token: response.token,
    agentId: response.agentId || "webmcp-agent",
    scopes: response.scopes || fallbackScopes,
    expiresAt,
    issuedAt: Date.now(),
  };
}
