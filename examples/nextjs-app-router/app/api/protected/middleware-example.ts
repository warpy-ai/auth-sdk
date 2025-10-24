/**
 * Middleware Example for Protected Routes
 *
 * This demonstrates how to create reusable middleware for protecting API routes.
 * Use this pattern when you have many routes that need authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken, type Session } from '../../../../../src/core';

const AUTH_SECRET = process.env.AUTH_SECRET!;

interface ProtectedRouteOptions {
  requiredScopes?: string[];
  requireMCPAgent?: boolean;
}

type RouteHandler = (
  request: NextRequest,
  session: Session
) => Promise<NextResponse> | NextResponse;

/**
 * Create a protected route handler with automatic authentication
 */
export function withAuth(
  handler: RouteHandler,
  options: ProtectedRouteOptions = {}
) {
  return async (request: NextRequest) => {
    // 1. Verify token
    const session = await verifyAgentToken(request, AUTH_SECRET);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      );
    }

    // 2. Check if MCP agent is required
    if (options.requireMCPAgent && session.type !== 'mcp-agent') {
      return NextResponse.json(
        { error: 'Forbidden - MCP agent token required' },
        { status: 403 }
      );
    }

    // 3. Check required scopes
    if (options.requiredScopes && options.requiredScopes.length > 0) {
      const hasRequiredScopes = options.requiredScopes.every(scope =>
        session.scopes?.includes(scope)
      );

      if (!hasRequiredScopes) {
        return NextResponse.json(
          {
            error: 'Forbidden - Missing required scopes',
            required: options.requiredScopes,
            current: session.scopes || []
          },
          { status: 403 }
        );
      }
    }

    // 4. Call the actual handler with verified session
    return handler(request, session);
  };
}

/**
 * Example usage:
 *
 * export const GET = withAuth(
 *   async (request, session) => {
 *     return NextResponse.json({
 *       message: 'Hello ' + session.agentId,
 *       userId: session.user.id
 *     });
 *   },
 *   { requiredScopes: ['read'], requireMCPAgent: true }
 * );
 */
