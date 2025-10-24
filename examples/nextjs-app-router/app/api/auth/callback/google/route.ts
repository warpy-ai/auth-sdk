/**
 * Google OAuth Callback Route
 *
 * GET /api/auth/callback/google
 * Handles the OAuth callback from Google after user authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, createSessionCookie } from '../../../../../../../src/core';
import { googleAuthConfig } from '../../config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors (user denied access, etc.)
    if (error) {
      console.error('[Auth] Google OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/login?error=${error}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[Auth] Missing code or state parameter');
      return NextResponse.redirect(
        new URL('/login?error=invalid_callback', request.url)
      );
    }

    // Complete OAuth flow
    const result = await authenticate(googleAuthConfig, request);

    if (result.error) {
      console.error('[Auth] Google authentication error:', result.error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(result.error)}`, request.url)
      );
    }

    if (!result.session) {
      console.error('[Auth] No session created');
      return NextResponse.redirect(
        new URL('/login?error=no_session', request.url)
      );
    }

    // Create session cookie
    const sessionCookie = createSessionCookie(result.session);

    // Redirect to home page with session cookie
    const response = NextResponse.redirect(new URL('/', request.url));
    response.headers.set('Set-Cookie', sessionCookie);

    return response;

  } catch (error) {
    console.error('[Auth] Google callback exception:', error);
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    );
  }
}
