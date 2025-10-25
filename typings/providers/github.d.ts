import type { OAuthProviderConfig } from "./types";
export interface GitHubProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
}
export declare function github(options: GitHubProviderOptions): OAuthProviderConfig;
