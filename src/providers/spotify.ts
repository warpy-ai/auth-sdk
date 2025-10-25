import { OAuthProvider } from "../utils/oauth";
import type { OAuthProviderConfig, UserProfile } from "./types";

export interface SpotifyProviderOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  pkce?: "S256" | "plain" | false;
}

export function spotify(options: SpotifyProviderOptions): OAuthProviderConfig {
  const oauthProvider = new OAuthProvider({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: "https://accounts.spotify.com/authorize",
    tokenUrl: "https://accounts.spotify.com/api/token",
    userInfoUrl: "https://api.spotify.com/v1/me",
    redirectUri: options.redirectUri,
    scope: options.scope || ["user-read-email", "user-read-private"],
  });

  return {
    type: "oauth",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: "https://accounts.spotify.com/authorize",
    tokenUrl: "https://accounts.spotify.com/api/token",
    userInfoUrl: "https://api.spotify.com/v1/me",
    redirectUri: options.redirectUri,
    scope: options.scope || ["user-read-email", "user-read-private"],
    pkce: options.pkce !== undefined ? options.pkce : "S256",

    async getUser(accessToken: string): Promise<UserProfile> {
      const userInfo = await oauthProvider.getUserInfo(accessToken);
      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.display_name,
        picture: userInfo.images?.[0]?.url,
      };
    },
  };
}
