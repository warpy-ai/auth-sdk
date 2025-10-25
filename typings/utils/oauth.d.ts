export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    authorizeUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    redirectUri: string;
    scope?: string[];
    pkce?: "S256" | "plain" | false;
}
export interface OAuthTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
}
export interface OAuthUserInfo {
    id: string;
    email: string;
    name?: string;
    picture?: string;
}
export interface PKCEChallenge {
    verifier: string;
    challenge: string;
    method: "S256" | "plain";
}
export declare class OAuthProvider {
    private config;
    constructor(config: OAuthConfig);
    generatePKCEChallenge(method?: "S256" | "plain"): PKCEChallenge;
    private base64URLEncode;
    getAuthorizeUrl(state: string, pkceChallenge?: PKCEChallenge): string;
    exchangeCodeForToken(code: string, codeVerifier?: string): Promise<OAuthTokenResponse>;
    getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}
