import type { OAuthProviderConfig } from "./types";
export interface SpotifyProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
}
export declare function spotify(options: SpotifyProviderOptions): OAuthProviderConfig;
