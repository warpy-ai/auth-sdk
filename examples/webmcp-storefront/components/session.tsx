"use client";
import { useCallback, useEffect, useState } from "react";
import type { WebMCPSession } from "@warpy-auth-sdk/core/webmcp";

/**
 * Reads the SDK session from `GET /api/auth/session`, the same endpoint the
 * agent's `auth_get_session` tool reads.
 */
export function useSession() {
  const [session, setSession] = useState<WebMCPSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      setSession(data.session ?? null);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, loading, refresh };
}
