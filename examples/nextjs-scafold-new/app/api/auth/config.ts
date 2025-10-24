import { google, email } from "@auth-sdk/core";

// Google OAuth - provider handles all OAuth URLs internally
export const googleAuthConfig = {
  secret: process.env.AUTH_SECRET!,
  provider: google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  }),
};

// Email Magic Link - provider handles sending emails internally
export const emailAuthConfig = {
  secret: process.env.AUTH_SECRET!,
  provider: email({
    server: `${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT || "587"}`,
    from: process.env.EMAIL_FROM!,
    auth:
      process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
        ? {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          }
        : undefined,
  }),
};
