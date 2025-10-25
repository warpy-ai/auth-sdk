import type { OAuthProviderConfig } from "./types";
export interface GitLabProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
    domain?: string;
}
export declare function gitlab(options: GitLabProviderOptions): OAuthProviderConfig;
