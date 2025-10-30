import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authMiddleware } from '@warpy-auth-sdk/core/next';
import { google } from '@warpy-auth-sdk/core';
import { db, generateId } from './lib/database';
import type { User } from './lib/types';

const handler = authMiddleware(
  {
    secret: process.env.AUTH_SECRET!,
    provider: google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    }),
    callbacks: {
      // Upsert user in our in-memory database
      async user(oauthUser) {
        const existingUser = db.getUserByEmail(oauthUser.email);

        if (existingUser) {
          // Update existing user
          return db.updateUser(existingUser.id, {
            name: oauthUser.name || existingUser.name,
            picture: oauthUser.picture || existingUser.picture,
          })!;
        }

        // Create new user
        const newUser: User = {
          id: generateId('user'),
          email: oauthUser.email,
          name: oauthUser.name || oauthUser.email.split('@')[0],
          picture: oauthUser.picture,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return db.createUser(newUser);
      },
      jwt: (token) => token,
      session: (session) => session,
    },
  },
  {
    basePath: '/api/auth',
    successRedirect: '/dashboard',
    errorRedirect: '/login',
  }
);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle auth routes
  if (pathname.startsWith('/api/auth')) {
    return handler(request);
  }

  // Let other routes pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
