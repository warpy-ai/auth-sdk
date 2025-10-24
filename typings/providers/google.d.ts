import type { OAuthProviderConfig } from "./types";
export interface GoogleProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
}
export declare function google(options: GoogleProviderOptions): OAuthProviderConfig;
