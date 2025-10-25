import type { OAuthProviderConfig } from "./types";
export interface EpicProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
}
export declare function epic(options: EpicProviderOptions): OAuthProviderConfig;
