"use client";
import { useCallback, useMemo, useState } from "react";
import { WebMCPProvider } from "@warpy-auth-sdk/core/webmcp/react";
import type { WebMCPAuditEvent } from "@warpy-auth-sdk/core/webmcp";
import { useConfirmDialog } from "./ConfirmDialog";
import { AuditContext, type AuditEntry } from "./audit";
import { StoreTools } from "./StoreTools";
import { PRICING } from "@/lib/pricing";

/**
 * Everything the SDK needs, mounted once.
 *
 * This is the whole integration: a provider, a pricing table for display, a
 * confirmation handler, and an audit sink. The tools themselves are registered
 * by <StoreTools /> below, and the page translation tools come for free.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const { confirmHandler, dialog } = useConfirmDialog();
  const [events, setEvents] = useState<AuditEntry[]>([]);

  const onAudit = useCallback((event: WebMCPAuditEvent) => {
    setEvents((current) => [
      { ...event, receivedAt: Date.now() },
      ...current.slice(0, 199),
    ]);
  }, []);

  const policy = useMemo(
    () => ({
      confirm: "auto" as const,
      confirmHandler,
      onAudit,
    }),
    [confirmHandler, onAudit]
  );

  const auditValue = useMemo(
    () => ({ events, clear: () => setEvents([]) }),
    [events]
  );

  return (
    <AuditContext.Provider value={auditValue}>
      <WebMCPProvider
        basePath="/api/auth"
        policy={policy}
        paywall={{ pricing: PRICING }}
        auth={{
          agentId: "storefront-agent",
          allowedScopes: [
            "catalog:read",
            "cart:write",
            "orders:read",
            "orders:write",
          ],
          grantTtl: "15m",
        }}
        page={{
          // The shop's own tools are better than generic clicking, so the page
          // tools are here for reading and navigating, not for form filling.
          readOnly: true,
        }}
      >
        <StoreTools />
        {children}
        {dialog}
      </WebMCPProvider>
    </AuditContext.Provider>
  );
}
