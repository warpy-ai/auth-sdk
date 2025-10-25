import { OAuthProvider } from "../utils/oauth";
import type { OAuthProviderConfig, UserProfile } from "./types";

export interface MicrosoftProviderOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  pkce?: "S256" | "plain" | false;
  tenant?: string; // "common", "organizations", "consumers", or a specific tenant ID
}

export function microsoft(
  options: MicrosoftProviderOptions
): OAuthProviderConfig {
  const tenant = options.tenant || "common";

  const oauthProvider = new OAuthProvider({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    redirectUri: options.redirectUri,
    scope: options.scope || ["openid", "profile", "email", "User.Read"],
  });

  return {
    type: "oauth",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    redirectUri: options.redirectUri,
    scope: options.scope || ["openid", "profile", "email", "User.Read"],
    pkce: options.pkce !== undefined ? options.pkce : "S256",

    async getUser(accessToken: string): Promise<UserProfile> {
      const userInfo = await oauthProvider.getUserInfo(accessToken);
      return {
        id: userInfo.id,
        email: userInfo.userPrincipalName || userInfo.mail || userInfo.email,
        name: userInfo.displayName || userInfo.name,
        picture: undefined, // Microsoft Graph requires separate endpoint for photos
      };
    },
  };
}
