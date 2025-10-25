import { OAuthProvider } from "../utils/oauth";
import type { OAuthProviderConfig, UserProfile } from "./types";

export interface GitLabProviderOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  pkce?: "S256" | "plain" | false;
  domain?: string; // Allow self-hosted GitLab instances
}

export function gitlab(options: GitLabProviderOptions): OAuthProviderConfig {
  const domain = options.domain || "https://gitlab.com";

  const oauthProvider = new OAuthProvider({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: `${domain}/oauth/authorize`,
    tokenUrl: `${domain}/oauth/token`,
    userInfoUrl: `${domain}/api/v4/user`,
    redirectUri: options.redirectUri,
    scope: options.scope || ["read_user", "email"],
  });

  return {
    type: "oauth",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: `${domain}/oauth/authorize`,
    tokenUrl: `${domain}/oauth/token`,
    userInfoUrl: `${domain}/api/v4/user`,
    redirectUri: options.redirectUri,
    scope: options.scope || ["read_user", "email"],
    pkce: options.pkce !== undefined ? options.pkce : "S256",

    async getUser(accessToken: string): Promise<UserProfile> {
      const userInfo = await oauthProvider.getUserInfo(accessToken);
      return {
        id: userInfo.id.toString(),
        email: userInfo.email,
        name: userInfo.name || userInfo.username,
        picture: userInfo.avatar_url,
      };
    },
  };
}
