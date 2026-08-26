import type { PaywallProvider, ToolPrice } from "../types";
export interface X402PaywallConfig {
    payTo: string;
    network: string;
    asset: string;
    facilitatorUrl?: string;
    facilitatorHeaders?: Record<string, string>;
    scheme?: string;
    version?: 1 | 2;
    decimals?: number;
    maxTimeoutSeconds?: number;
    extra?: Record<string, unknown>;
    toAtomicAmount?: (price: ToolPrice) => string;
    fetchImpl?: typeof fetch;
}
export declare function toAtomicUnits(amount: string, decimals: number): string;
export declare function x402Paywall(config: X402PaywallConfig): PaywallProvider;
export declare function decodePayment(proof: unknown): Record<string, unknown> | null;
