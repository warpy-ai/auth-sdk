import type { OAuthProviderConfig } from "./types";
export interface MicrosoftProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
    tenant?: string;
}
export declare function microsoft(options: MicrosoftProviderOptions): OAuthProviderConfig;
