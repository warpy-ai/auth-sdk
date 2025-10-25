import type { OAuthProviderConfig, UserProfile } from "./types";
export interface CustomProviderOptions {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    authorizeUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
    userInfoMapper?: (userInfo: any) => UserProfile;
}
export declare function custom(options: CustomProviderOptions): OAuthProviderConfig;
