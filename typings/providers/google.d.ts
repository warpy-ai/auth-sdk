import type { OAuthProviderConfig } from "./types";
export interface GoogleProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
}
export declare function google(options: GoogleProviderOptions): OAuthProviderConfig;
