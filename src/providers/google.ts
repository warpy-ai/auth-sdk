import { OAuthProvider } from "../utils/oauth";
import type { OAuthProviderConfig, UserProfile } from "./types";

export interface GoogleProviderOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  pkce?: "S256" | "plain" | false;
}

export function google(options: GoogleProviderOptions): OAuthProviderConfig {
  const oauthProvider = new OAuthProvider({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    redirectUri: options.redirectUri,
    scope: options.scope || ["openid", "email", "profile"],
  });

  return {
    type: "oauth",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    redirectUri: options.redirectUri,
    scope: options.scope || ["openid", "email", "profile"],
    pkce: options.pkce !== undefined ? options.pkce : "S256", // Default to S256

    // eslint-disable-next-line require-await
    async getUser(accessToken: string): Promise<UserProfile> {
      return oauthProvider.getUserInfo(accessToken);
    },
  };
}
