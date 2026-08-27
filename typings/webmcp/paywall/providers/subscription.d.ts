import type { PaywallContext, PaywallProvider } from "../types";
export interface SubscriptionPaywallConfig {
    entitled: (context: PaywallContext) => boolean | Promise<boolean>;
    upgradeUrl?: string;
    planName?: string;
    callsPerCheck?: number;
    recheckSeconds?: number;
}
export declare function subscriptionPaywall(config: SubscriptionPaywallConfig): PaywallProvider;
