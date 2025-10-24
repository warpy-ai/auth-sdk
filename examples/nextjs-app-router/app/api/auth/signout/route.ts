/**
 * Sign Out Route
 *
 * POST /api/auth/signout
 * Signs out the user by clearing the session cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { signOut, clearSessionCookie } from '../../../../../../src/core';
import { googleAuthConfig } from '../config';

export async function POST(request: NextRequest) {
  try {
    // Clear session in database (if adapter is configured)
    await signOut(request, googleAuthConfig);

    // Create response with cleared cookie
    const response = NextResponse.json({
      success: true,
      message: 'Signed out successfully'
    });

    // Clear the session cookie
    response.headers.set('Set-Cookie', clearSessionCookie());

    return response;

  } catch (error) {
    console.error('[Auth] Sign out error:', error);

    // Even on error, clear the cookie
    const response = NextResponse.json(
      { success: true, message: 'Signed out' },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', clearSessionCookie());

    return response;
  }
}

// Also support GET for simple sign out links
export async function GET(request: NextRequest) {
  try {
    await signOut(request, googleAuthConfig);

    // Redirect to home page with cleared cookie
    const response = NextResponse.redirect(new URL('/', request.url));
    response.headers.set('Set-Cookie', clearSessionCookie());

    return response;

  } catch (error) {
    console.error('[Auth] Sign out error:', error);

    const response = NextResponse.redirect(new URL('/', request.url));
    response.headers.set('Set-Cookie', clearSessionCookie());

    return response;
  }
}
