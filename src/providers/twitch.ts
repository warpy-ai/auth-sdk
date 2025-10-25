import type { OAuthProviderConfig, UserProfile } from "./types";

export interface TwitchProviderOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  pkce?: "S256" | "plain" | false;
}

export function twitch(options: TwitchProviderOptions): OAuthProviderConfig {
  return {
    type: "oauth",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: "https://id.twitch.tv/oauth2/authorize",
    tokenUrl: "https://id.twitch.tv/oauth2/token",
    userInfoUrl: "https://api.twitch.tv/helix/users",
    redirectUri: options.redirectUri,
    scope: options.scope || ["user:read:email"],
    pkce: options.pkce !== undefined ? options.pkce : "S256",

    async getUser(accessToken: string): Promise<UserProfile> {
      // Twitch API requires Client-ID header in addition to access token
      const response = await fetch("https://api.twitch.tv/helix/users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": options.clientId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user info from Twitch");
      }

      const data = await response.json();
      const userInfo = data.data?.[0];

      if (!userInfo) {
        throw new Error("No user data returned from Twitch");
      }

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.display_name,
        picture: userInfo.profile_image_url,
      };
    },
  };
}
