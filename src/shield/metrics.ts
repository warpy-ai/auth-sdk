import type { MCPMetric, ShieldMetricsConfig, WarpyConfig } from "./types";
import { WarpyClient } from "./client";

export class ShieldMetricsBuffer {
  private readonly buffer: MCPMetric[] = [];
  private readonly maxSize: number;
  private readonly flushIntervalMs: number;
  private timer?: ReturnType<typeof setInterval>;
  private client?: WarpyClient; // only when cloud enabled

  constructor(config: ShieldMetricsConfig, warpy?: WarpyConfig) {
    this.maxSize = config.bufferSize ?? 100;
    this.flushIntervalMs = config.flushIntervalMs ?? 10000;
    if (warpy?.apiKey) {
      this.client = new WarpyClient({
        apiKey: warpy.apiKey,
        baseUrl: warpy.baseUrl,
        timeoutMs: warpy.timeoutMs,
        maxRetries: warpy.maxRetries,
      });
    }
    if (config.enabled) {
      this.start();
    }
  }

  record(metric: MCPMetric) {
    this.buffer.push(metric);
    if (this.buffer.length >= this.maxSize) {
      void this.flush();
    }
  }

  getAll(): MCPMetric[] {
    return [...this.buffer];
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => void this.flush(), this.flushIntervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async flush() {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0, this.buffer.length);
    if (!this.client) return; // local mode: no-op
    try {
      await this.client.call({
        action: "proxy", // reuse endpoint to ship metrics
        payload: { __metrics: batch },
        metadata: {
          toolName: "__metrics",
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      // swallow metrics errors; requeue small portion to avoid loss
      const retryPortion = batch.slice(-Math.min(10, batch.length));
      this.buffer.unshift(...retryPortion);
    }
  }
}
