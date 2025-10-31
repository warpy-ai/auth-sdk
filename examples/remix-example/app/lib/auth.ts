import { google, type AuthConfig } from "@warpy-auth-sdk/core";

// Validate environment variables
const requiredEnvVars = [
  "AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
];

const missing = requiredEnvVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`
  );
  console.error("Please create a .env file with these variables");
}

// Configure Auth SDK (Google OAuth as example)
export const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET!,
  provider: google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  }),
  callbacks: {
    // Resolve/upsert your user with smallest overhead
    async user(u) {
      // In a real app, you'd query your database here
      // For this example, we'll just return the user data
      return {
        id: u.id || `user-${u.email}`,
        email: u.email,
        name: u.name,
        picture: u.picture,
      };
    },
    jwt: (t) => t,
    session: (s) => s,
  },
};
