export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    authorizeUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    redirectUri: string;
    scope?: string[];
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
export declare class OAuthProvider {
    private config;
    constructor(config: OAuthConfig);
    getAuthorizeUrl(state: string): string;
    exchangeCodeForToken(code: string): Promise<OAuthTokenResponse>;
    getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}
