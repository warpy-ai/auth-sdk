import type { PaymentChallenge, PaymentReceipt } from "./types";
export interface PaywallEndpoints {
    quote: string;
    settle: string;
}
export interface PaywallRequestOptions {
    fetchImpl?: typeof fetch;
    grantToken?: string;
}
export type PaywallResult = {
    status: "paid";
    receipt: PaymentReceipt;
} | {
    status: "challenge";
    challenge: PaymentChallenge;
} | {
    status: "error";
    message: string;
};
export declare function requestQuote(endpoints: PaywallEndpoints, tool: string, options?: PaywallRequestOptions): Promise<PaywallResult>;
export declare function requestSettle(endpoints: PaywallEndpoints, tool: string, payment: unknown, options?: PaywallRequestOptions): Promise<PaywallResult>;
