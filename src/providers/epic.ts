import { OAuthProvider } from "../utils/oauth";
import type { OAuthProviderConfig, UserProfile } from "./types";

export interface EpicProviderOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  pkce?: "S256" | "plain" | false;
}

export function epic(options: EpicProviderOptions): OAuthProviderConfig {
  const oauthProvider = new OAuthProvider({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: "https://www.epicgames.com/id/authorize",
    tokenUrl: "https://api.epicgames.dev/epic/oauth/v2/token",
    userInfoUrl: "https://api.epicgames.dev/epic/oauth/v2/userInfo",
    redirectUri: options.redirectUri,
    scope: options.scope || ["basic_profile", "friends_list"],
  });

  return {
    type: "oauth",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: "https://www.epicgames.com/id/authorize",
    tokenUrl: "https://api.epicgames.dev/epic/oauth/v2/token",
    userInfoUrl: "https://api.epicgames.dev/epic/oauth/v2/userInfo",
    redirectUri: options.redirectUri,
    scope: options.scope || ["basic_profile", "friends_list"],
    pkce: options.pkce !== undefined ? options.pkce : "S256",

    async getUser(accessToken: string): Promise<UserProfile> {
      const userInfo = await oauthProvider.getUserInfo(accessToken);
      return {
        id: userInfo.account_id || userInfo.id,
        email: userInfo.email,
        name: userInfo.display_name || userInfo.name,
        picture: undefined, // Epic doesn't provide profile pictures in basic profile
      };
    },
  };
}
