// (no direct imports from core needed here)
import { createMCPTools, type MCPToolDefinition } from "../mcp/mcp";
import type { Adapter } from "../adapters/types";
import { WarpyClient } from "./client";
import { ShieldMetricsBuffer } from "./metrics";
import type { ShieldMetricsConfig, WarpyConfig } from "./types";

export interface MCPShieldConfig {
  secret: string;
  adapter?: Adapter;
  warpy?: WarpyConfig;
  metrics?: ShieldMetricsConfig;
}

function isCloudEnabled(cfg?: WarpyConfig): boolean {
  return Boolean(cfg?.apiKey || process.env.WARPY_API_KEY);
}

export function createMCPShield(config: MCPShieldConfig) {
  const baseTools = createMCPTools({
    secret: config.secret,
    adapter: config.adapter,
  });

  const warpyCfg: WarpyConfig | undefined = isCloudEnabled(config.warpy)
    ? {
        apiKey: config.warpy?.apiKey || process.env.WARPY_API_KEY,
        baseUrl: config.warpy?.baseUrl,
        timeoutMs: config.warpy?.timeoutMs,
        maxRetries: config.warpy?.maxRetries,
      }
    : undefined;

  const client = warpyCfg ? new WarpyClient(warpyCfg) : undefined;
  const metrics = new ShieldMetricsBuffer(
    {
      enabled: Boolean(config.metrics?.enabled),
      flushIntervalMs: config.metrics?.flushIntervalMs,
      bufferSize: config.metrics?.bufferSize,
    },
    warpyCfg
  );

  const shieldedTools: Record<string, MCPToolDefinition> = {} as Record<
    string,
    MCPToolDefinition
  >;

  for (const [toolName, tool] of Object.entries(
    baseTools as Record<string, MCPToolDefinition>
  )) {
    shieldedTools[toolName] = {
      ...tool,
      execute: async (args: unknown) => {
        const start = Date.now();
        // Execute (cloud proxied or local)
        let result: unknown;
        if (client) {
          const exec = await client.call<{ result: unknown }>({
            action: "proxy",
            payload: { tool: toolName, args },
            metadata: { toolName, timestamp: new Date().toISOString() },
          });
          if (exec.denied || !exec.success) {
            metrics.record({
              timestamp: new Date().toISOString(),
              toolName,
              action: "cloud:proxy",
              durationMs: Date.now() - start,
              denied: true,
              denialReason: exec.reason || exec.error,
            });
            throw new Error(exec.reason || exec.error || "Execution denied");
          }
          result = (exec.data as { result?: unknown } | undefined)?.result;
        } else {
          result = await (tool.execute as (a: unknown) => Promise<unknown>)(
            args
          );
        }

        // Metrics record success
        metrics.record({
          timestamp: new Date().toISOString(),
          toolName,
          action: client ? "cloud:proxy" : "self-host:execute",
          durationMs: Date.now() - start,
        });

        return result;
      },
    };
  }

  // Override revoke_token with cloud-aware behavior if present
  if (shieldedTools.revoke_token) {
    const original = shieldedTools.revoke_token;
    shieldedTools.revoke_token = {
      ...original,
      execute: async (args: unknown) => {
        if (client) {
          const start = Date.now();
          const res = await client.call({
            action: "revoke",
            payload: {
              tokenId:
                (args as { tokenId?: string; token?: string })?.tokenId ||
                (args as { tokenId?: string; token?: string })?.token,
            },
            metadata: {
              toolName: "revoke_token",
              timestamp: new Date().toISOString(),
            },
          });
          metrics.record({
            timestamp: new Date().toISOString(),
            toolName: "revoke_token",
            action: "cloud:revoke",
            durationMs: Date.now() - start,
          });
          if (!res.success) throw new Error(res.error || "Failed to revoke");
          return { success: true };
        }
        return original.execute(args as unknown as never);
      },
    };
  }

  return shieldedTools;
}
