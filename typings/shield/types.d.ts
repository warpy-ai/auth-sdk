export type WarpyShieldAction = "validate" | "check_authz" | "proxy" | "revoke";
export interface WarpyConfig {
    apiKey?: string;
    baseUrl?: string;
    timeoutMs?: number;
    maxRetries?: number;
}
export interface WarpyShieldMetadata {
    sdkVersion?: string;
    timestamp?: string;
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
    timestamp: string;
    toolName: string;
    action: string;
    durationMs: number;
    userId?: string;
    agentId?: string;
    denied?: boolean;
    denialReason?: string;
    scopes?: string[];
}
export interface ShieldMetricsConfig {
    enabled: boolean;
    flushIntervalMs?: number;
    bufferSize?: number;
}
