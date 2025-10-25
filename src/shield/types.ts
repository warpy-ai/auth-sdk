// Warpy Cloud MCP Shield - shared types

export type WarpyShieldAction = "validate" | "check_authz" | "proxy" | "revoke";

export interface WarpyConfig {
  apiKey?: string;
  baseUrl?: string; // default: https://platform.warpy.co/api/v1
  timeoutMs?: number; // default: 5000
  maxRetries?: number; // default: 3
}

export interface WarpyShieldMetadata {
  sdkVersion?: string;
  timestamp?: string; // ISO8601
  agentId?: string;
  toolName?: string;
  requestId?: string;
}

export interface WarpyShieldRequest {
  action: WarpyShieldAction;
  payload: Record<string, unknown>;
  metadata?: WarpyShieldMetadata;
}

export interface WarpyShieldResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  denied?: boolean;
  reason?: string | null;
}

export interface MCPMetric {
  timestamp: string; // ISO8601
  toolName: string;
  action: string; // e.g., cloud:proxy, cloud:validate, self-host
  durationMs: number;
  userId?: string;
  agentId?: string;
  denied?: boolean;
  denialReason?: string;
  scopes?: string[];
}

export interface ShieldMetricsConfig {
  enabled: boolean;
  flushIntervalMs?: number; // default: 10000
  bufferSize?: number; // default: 100
}
