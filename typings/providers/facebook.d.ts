import type { OAuthProviderConfig } from "./types";
export interface FacebookProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
}
export declare function facebook(options: FacebookProviderOptions): OAuthProviderConfig;
