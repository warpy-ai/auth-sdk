import { createHash } from "node:crypto";
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
  scope?: string[];
  pkce?: "S256" | "plain" | false;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface OAuthUserInfo extends Record<string, any> {
  id: string;
  email: string;
  name?: string;
  picture?: string | { data?: { url?: string } }; // Facebook returns nested object
  // Common provider-specific fields
  sub?: string; // OpenID Connect standard
  user_id?: string;
  username?: string;
  display_name?: string;
  login?: string; // GitHub
  avatar?: string;
  avatar_url?: string;
  images?: Array<{ url: string }>; // Spotify
  account_id?: string; // Epic Games
  userPrincipalName?: string; // Microsoft
  displayName?: string; // Microsoft
  mail?: string; // Microsoft
}

export interface PKCEChallenge {
  verifier: string;
  challenge: string;
  method: "S256" | "plain";
}

export class OAuthProvider {
  constructor(private config: OAuthConfig) {}

  /**
   * Generate PKCE challenge and verifier
   * S256: SHA-256 hash of verifier (more secure, recommended)
   * plain: Verifier sent as-is (fallback for servers that don't support S256)
   */
  generatePKCEChallenge(method: "S256" | "plain" = "S256"): PKCEChallenge {
    // Generate cryptographically secure random verifier (43-128 characters)
    const verifier = this.base64URLEncode(
      Buffer.from(
        Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
      )
    );

    let challenge: string;
    if (method === "S256") {
      // SHA-256 hash the verifier
      const hash = createHash("sha256").update(verifier).digest();
      challenge = this.base64URLEncode(hash);
    } else {
      // Plain method: challenge = verifier
      challenge = verifier;
    }

    return { verifier, challenge, method };
  }

  /**
   * Base64URL encoding (RFC 4648 Section 5)
   * Standard Base64 but with URL-safe characters and no padding
   */
  private base64URLEncode(buffer: Buffer): string {
    return buffer
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  getAuthorizeUrl(state: string, pkceChallenge?: PKCEChallenge): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: this.config.scope?.join(" ") || "openid email profile",
      state,
    });

    // Add PKCE challenge if provided
    if (pkceChallenge) {
      params.set("code_challenge", pkceChallenge.challenge);
      params.set("code_challenge_method", pkceChallenge.method);
    }

    return `${this.config.authorizeUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(
    code: string,
    codeVerifier?: string
  ): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: this.config.redirectUri,
    });

    // Add PKCE code verifier if provided
    if (codeVerifier) {
      params.set("code_verifier", codeVerifier);
    }

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OAuth token exchange failed: ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(this.config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OAuth user info fetch failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Normalize response (Google format)
    return {
      id: data.sub || data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  }
}
