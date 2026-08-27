import type { PaywallContext, PaywallProvider, ToolPrice } from "../types";
export interface CreditsPaywallConfig {
    getBalance: (context: PaywallContext) => number | Promise<number>;
    charge: (context: PaywallContext, credits: number) => boolean | Promise<boolean>;
    toCredits?: (price: ToolPrice) => number;
    topUpUrl?: string;
    unitLabel?: string;
}
export declare function creditsPaywall(config: CreditsPaywallConfig): PaywallProvider;
