/**
 * Email Magic Link Callback Route
 *
 * GET /api/auth/callback/email
 * Verifies the magic link token and creates a session
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, createSessionCookie } from '../../../../../../../src/core';
import { emailAuthConfig } from '../../config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const token = searchParams.get('token');

    // Validate token parameter
    if (!token) {
      console.error('[Auth] Missing token parameter');
      return NextResponse.redirect(
        new URL('/login?error=invalid_link', request.url)
      );
    }

    // Verify magic link token
    const result = await authenticate(emailAuthConfig, request);

    if (result.error) {
      console.error('[Auth] Email verification error:', result.error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(result.error)}`, request.url)
      );
    }

    if (!result.session) {
      console.error('[Auth] No session created from magic link');
      return NextResponse.redirect(
        new URL('/login?error=expired_link', request.url)
      );
    }

    // Create session cookie
    const sessionCookie = createSessionCookie(result.session);

    // Redirect to home page with session cookie
    const response = NextResponse.redirect(new URL('/', request.url));
    response.headers.set('Set-Cookie', sessionCookie);

    return response;

  } catch (error) {
    console.error('[Auth] Email callback exception:', error);
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    );
  }
}
