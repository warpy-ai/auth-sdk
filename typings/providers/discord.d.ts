import type { OAuthProviderConfig } from "./types";
export interface DiscordProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
}
export declare function discord(options: DiscordProviderOptions): OAuthProviderConfig;
