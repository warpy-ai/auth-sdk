"use client";
import { createContext, useContext } from "react";
import type { WebMCPAuditEvent } from "@warpy-auth-sdk/core/webmcp";

export interface AuditEntry extends WebMCPAuditEvent {
  receivedAt: number;
}

export const AuditContext = createContext<{
  events: AuditEntry[];
  clear: () => void;
}>({ events: [], clear: () => undefined });

export function useAudit() {
  return useContext(AuditContext);
}
