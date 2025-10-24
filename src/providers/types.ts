export interface OAuthProviderConfig {
  type: 'oauth';
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
  scope?: string[];
  getUser: (accessToken: string) => Promise<UserProfile>;
}

export interface EmailProviderConfig {
  type: 'email';
  server: string;
  from: string;
  sendMagicLink: (email: string, url: string) => Promise<void>;
  verify: (token: string) => Promise<{ email: string; userId?: string } | null>;
}

export type Provider = OAuthProviderConfig | EmailProviderConfig;

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}
