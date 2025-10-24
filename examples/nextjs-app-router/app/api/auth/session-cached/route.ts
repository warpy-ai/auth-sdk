/**
 * Session Route with Next.js 16 Cache Components
 *
 * GET /api/auth/session-cached
 * Returns the current session with optimized caching using Next.js 16 "use cache" directive
 *
 * New in Next.js 16:
 * - "use cache" directive for explicit caching control
 * - Works with Cache Components and PPR
 * - Better control over cache invalidation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../../../src/core';
import { authConfig } from '../config';

// Next.js 16: Use cache directive for session data
// This enables Cache Components optimization
async function getCachedSession(request: NextRequest) {
  'use cache';

  // Cache tags for selective invalidation
  const session = await getSession(request, authConfig.secret);

  return session;
}

export async function GET(request: NextRequest) {
  try {
    // Get cached session (or fetch if not cached)
    const session = await getCachedSession(request);

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
