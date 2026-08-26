export interface ToolPrice {
    amount: string;
    currency?: string;
    calls?: number;
    windowSeconds?: number;
    freeCalls?: number;
    description?: string;
    plan?: string;
}
export interface X402PaymentRequirements {
    scheme: string;
    network: string;
    amount?: string;
    maxAmountRequired?: string;
    asset: string;
    payTo: string;
    maxTimeoutSeconds: number;
    resource?: string;
    description?: string;
    mimeType?: string;
    extra?: Record<string, unknown>;
}
export interface X402PaymentRequired {
    x402Version: number;
    error?: string;
    resource?: {
        url: string;
        description?: string;
        mimeType?: string;
    };
    accepts: X402PaymentRequirements[];
    extensions?: Record<string, unknown>;
}
export interface X402SettlementResponse {
    success: boolean;
    errorReason?: string;
    payer?: string;
    transaction?: string;
    network?: string;
    amount?: string;
}
export interface PaymentChallenge {
    provider: string;
    tool: string;
    price: ToolPrice;
    instructions: string;
    x402?: X402PaymentRequired;
    chargesUser?: boolean;
    extra?: Record<string, unknown>;
}
export interface PaymentReceipt {
    tool: string;
    provider: string;
    calls: number;
    expiresAt: number;
    payer?: string;
    amount?: string;
    currency?: string;
    transaction?: string;
    token?: string;
}
export interface PaywallContext {
    tool: string;
    price: ToolPrice;
    userId?: string;
    agentId?: string;
    resourceUrl: string;
    request: Request;
}
export type PaywallRedemption = {
    ok: true;
    calls?: number;
    expiresInSeconds?: number;
    payer?: string;
    amount?: string;
    currency?: string;
    transaction?: string;
} | {
    ok: false;
    reason: string;
};
export interface PaywallProvider {
    readonly name: string;
    entitled?: (context: PaywallContext) => boolean | Promise<boolean> | PaywallRedemption | Promise<PaywallRedemption>;
    quote: (context: PaywallContext) => PaymentChallenge | Promise<PaymentChallenge>;
    redeem: (context: PaywallContext, proof: unknown) => PaywallRedemption | Promise<PaywallRedemption>;
}
export type PricingTable = Record<string, ToolPrice>;
export interface PaywallQuoteResponse {
    paid: boolean;
    receipt?: {
        token: string;
        calls: number;
        expires: string;
        payer?: string;
        transaction?: string;
    };
    challenge?: PaymentChallenge;
}
export interface UsageStore {
    consume: (receiptId: string, limit: number, expiresAt: number) => boolean | Promise<boolean>;
}
