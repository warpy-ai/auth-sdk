import { OAuthProvider } from "../utils/oauth";
import type { OAuthProviderConfig, UserProfile } from "./types";

export interface FacebookProviderOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  pkce?: "S256" | "plain" | false;
}

export function facebook(
  options: FacebookProviderOptions
): OAuthProviderConfig {
  const oauthProvider = new OAuthProvider({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me",
    redirectUri: options.redirectUri,
    scope: options.scope || ["email", "public_profile"],
  });

  return {
    type: "oauth",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email,picture",
    redirectUri: options.redirectUri,
    scope: options.scope || ["email", "public_profile"],
    pkce: options.pkce !== undefined ? options.pkce : "S256",

    async getUser(accessToken: string): Promise<UserProfile> {
      const userInfo = await oauthProvider.getUserInfo(accessToken);
      // Facebook picture can be a string or an object with data.url
      const pictureUrl =
        typeof userInfo.picture === "string"
          ? userInfo.picture
          : userInfo.picture?.data?.url;

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: pictureUrl,
      };
    },
  };
}
