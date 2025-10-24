import { NextRequest, NextResponse } from 'next/server';
import { authenticate, createSessionCookie } from 'auth-sdk';
import { googleAuthConfig } from '../../config';

export async function GET(request: NextRequest) {
  try {
    const result = await authenticate(googleAuthConfig, request);

    if (result.error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(result.error)}`, request.url)
      );
    }

    if (result.session) {
      const sessionCookie = createSessionCookie(result.session);
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      response.headers.set('Set-Cookie', sessionCookie);
      return response;
    }

    return NextResponse.redirect(new URL('/login?error=no_session', request.url));
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    );
  }
}
