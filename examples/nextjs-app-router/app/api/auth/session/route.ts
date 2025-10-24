/**
 * Session Route
 *
 * GET /api/auth/session
 * Returns the current session or null if not authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../../../src/core';
import { authConfig } from '../config';

export async function GET(request: NextRequest) {
  try {
    // Get session from request
    const session = await getSession(request, authConfig.secret);

    if (!session) {
      return NextResponse.json(
        { session: null },
        { status: 200 }
      );
    }

    // Return session data (excluding sensitive token)
    return NextResponse.json({
      session: {
        user: session.user,
        expires: session.expires,
        type: session.type,
      }
    });

  } catch (error) {
    console.error('[Auth] Session fetch error:', error);
    return NextResponse.json(
      { session: null, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
