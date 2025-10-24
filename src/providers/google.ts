// src/providers/google.ts
import { OAuthProvider } from "../utils/oauth";

export function google(options: { clientId: string; clientSecret: string }) {
  return {
    type: "oauth",
    authorizeUrl: "https://accounts.google.com/o/oauth2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    ...options,
    async getUser(token) {
      // Fetch user profile
    },
  };
}
