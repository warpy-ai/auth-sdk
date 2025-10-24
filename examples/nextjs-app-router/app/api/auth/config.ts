/**
 * Authentication Configuration
 *
 * Central configuration for all auth routes.
 * Import this in your auth route handlers.
 */

import { google, email, type AuthConfig } from '../../../../../src/core';
// import { prismaAdapter } from '../../../../../src/adapters/prisma';
// import { PrismaClient } from '@prisma/client';

// Optional: Initialize Prisma client
// const prisma = new PrismaClient();

// Validate environment variables
const AUTH_SECRET = process.env.AUTH_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

/**
 * Google OAuth Configuration
 */
export const googleAuthConfig: AuthConfig = {
  provider: google({
    clientId: GOOGLE_CLIENT_ID || '',
    clientSecret: GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
    scope: ['openid', 'email', 'profile'],
  }),
  secret: AUTH_SECRET,
  // adapter: prismaAdapter(prisma), // Uncomment to enable DB sessions
  mcp: {
    enabled: false, // MCP not needed for standard auth
  },
};

/**
 * Email Magic Link Configuration
 */
export const emailAuthConfig: AuthConfig = {
  provider: email({
    server: process.env.SMTP_HOST + ':' + process.env.SMTP_PORT || 'smtp.gmail.com:587',
    from: process.env.SMTP_FROM || 'noreply@example.com',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  }),
  secret: AUTH_SECRET,
  // adapter: prismaAdapter(prisma),
};

/**
 * General Auth Configuration
 */
export const authConfig = {
  secret: AUTH_SECRET,
  sessionMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  pages: {
    signIn: '/login',
    error: '/login?error=true',
    signOut: '/',
  },
};
