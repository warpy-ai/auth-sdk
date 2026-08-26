import type { PaywallProvider, PricingTable, ToolPrice, UsageStore } from "./types";
export interface PaywallOptions {
    provider?: PaywallProvider;
    pricing?: PricingTable;
    usageStore?: UsageStore;
    receiptSeconds?: number;
    onPayment?: (event: {
        tool: string;
        provider: string;
        userId?: string;
        agentId?: string;
        payer?: string;
        amount?: string;
        currency?: string;
        transaction?: string;
        calls: number;
        timestamp: string;
    }) => void;
    onPaymentFailed?: (event: {
        tool: string;
        provider: string;
        reason: string;
        userId?: string;
        timestamp: string;
    }) => void;
}
export declare function createMemoryUsageStore(): UsageStore;
export declare function quotePaywall(request: Request, secret: string, actor: {
    userId?: string;
    agentId?: string;
}, options: PaywallOptions): Promise<Response>;
export declare function settlePaywall(request: Request, secret: string, actor: {
    userId?: string;
    agentId?: string;
}, options: PaywallOptions): Promise<Response>;
export interface PaymentClaims {
    tool: string;
    provider: string;
    calls: number;
    userId?: string;
    agentId?: string;
    payer?: string;
}
export declare function verifyWebMCPPayment(request: Request, secret: string, options?: {
    tool?: string;
    usageStore?: UsageStore;
}): Promise<PaymentClaims | null>;
export declare function authorizePaidRequest(request: Request, secret: string, options?: {
    tool?: string;
    usageStore?: UsageStore;
    chargeEveryone?: boolean;
}): Promise<{
    allowed: boolean;
    actor: "human" | "agent";
    paid: boolean;
    claims?: PaymentClaims;
    reason?: string;
}>;
export declare function describePricing(pricing?: PricingTable): Array<ToolPrice & {
    tool: string;
}>;
