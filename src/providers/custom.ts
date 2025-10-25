import { OAuthProvider } from "../utils/oauth";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userInfoMapper?: (userInfo: any) => UserProfile;
}

/**
 * Custom OAuth provider for any OAuth 2.0 compliant service
 *
 * This provider allows you to integrate with any OAuth 2.0 provider by
 * specifying the authorization, token, and user info endpoints.
 *
 * @example
 * ```typescript
 * const customProvider = custom({
 *   clientId: "your-client-id",
 *   clientSecret: "your-client-secret",
 *   redirectUri: "https://yourdomain.com/auth/callback/custom",
 *   authorizeUrl: "https://oauth.provider.com/authorize",
 *   tokenUrl: "https://oauth.provider.com/token",
 *   userInfoUrl: "https://oauth.provider.com/userinfo",
 *   scope: ["read:user", "email"],
 *   userInfoMapper: (userInfo) => ({
 *     id: userInfo.user_id,
 *     email: userInfo.user_email,
 *     name: userInfo.display_name,
 *     picture: userInfo.avatar_url,
 *   }),
 * });
 * ```
 */
export function custom(options: CustomProviderOptions): OAuthProviderConfig {
  const oauthProvider = new OAuthProvider({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: options.authorizeUrl,
    tokenUrl: options.tokenUrl,
    userInfoUrl: options.userInfoUrl,
    redirectUri: options.redirectUri,
    scope: options.scope || [],
  });

  return {
    type: "oauth",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorizeUrl: options.authorizeUrl,
    tokenUrl: options.tokenUrl,
    userInfoUrl: options.userInfoUrl,
    redirectUri: options.redirectUri,
    scope: options.scope || [],
    pkce: options.pkce !== undefined ? options.pkce : "S256",

    async getUser(accessToken: string): Promise<UserProfile> {
      const userInfo = await oauthProvider.getUserInfo(accessToken);

      // Use custom mapper if provided, otherwise use default mapping
      if (options.userInfoMapper) {
        return options.userInfoMapper(userInfo);
      }

      // Default mapping assumes standard OIDC claims
      const picture =
        typeof userInfo.picture === "string"
          ? userInfo.picture
          : userInfo.picture?.data?.url ||
            userInfo.avatar ||
            userInfo.avatar_url;

      return {
        id: userInfo.sub || userInfo.id || userInfo.user_id || "",
        email: userInfo.email,
        name: userInfo.name || userInfo.display_name || userInfo.username,
        picture: picture,
      };
    },
  };
}
