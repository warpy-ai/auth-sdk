import { type MCPToolDefinition } from "../mcp/mcp";
import type { Adapter } from "../adapters/types";
import type { ShieldMetricsConfig, WarpyConfig } from "./types";
export interface MCPShieldConfig {
    secret: string;
    adapter?: Adapter;
    warpy?: WarpyConfig;
    metrics?: ShieldMetricsConfig;
}
export declare function createMCPShield(config: MCPShieldConfig): Record<string, MCPToolDefinition<unknown>>;
