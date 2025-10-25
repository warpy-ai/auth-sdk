import type { OAuthProviderConfig } from "./types";
export interface LinkedInProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
}
export declare function linkedin(options: LinkedInProviderOptions): OAuthProviderConfig;
