import type { OAuthProviderConfig } from "./types";
export interface TwitchProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
}
export declare function twitch(options: TwitchProviderOptions): OAuthProviderConfig;
