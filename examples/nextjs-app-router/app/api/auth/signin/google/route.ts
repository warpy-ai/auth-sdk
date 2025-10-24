/**
 * Google OAuth Sign In Route
 *
 * GET /api/auth/signin/google
 * Initiates Google OAuth flow by redirecting to Google's authorization page
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '../../../../../../../src/core';
import { googleAuthConfig } from '../../config';

export async function GET(request: NextRequest) {
  try {
    // Create a mock request with the callback URL
    const mockRequest = new Request(request.url);

    // Initiate OAuth flow
    const result = await authenticate(googleAuthConfig, mockRequest);

    if (result.error) {
      console.error('[Auth] Google sign in error:', result.error);
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    if (result.redirectUrl) {
      // Redirect to Google's OAuth consent page
      return NextResponse.redirect(result.redirectUrl);
    }

    return NextResponse.redirect(new URL('/login?error=no_redirect', request.url));
  } catch (error) {
    console.error('[Auth] Google sign in exception:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
