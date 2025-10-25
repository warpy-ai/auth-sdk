import type { MCPMetric, ShieldMetricsConfig, WarpyConfig } from "./types";
export declare class ShieldMetricsBuffer {
    private readonly buffer;
    private readonly maxSize;
    private readonly flushIntervalMs;
    private timer?;
    private client?;
    constructor(config: ShieldMetricsConfig, warpy?: WarpyConfig);
    record(metric: MCPMetric): void;
    getAll(): MCPMetric[];
    start(): void;
    stop(): void;
    flush(): Promise<void>;
}
