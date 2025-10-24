/**
 * Protected API Route Example
 *
 * This demonstrates how to protect an API route and verify MCP agent tokens.
 * The route checks:
 * - Valid JWT token in Authorization header
 * - Token is an MCP agent token
 * - Token has required scopes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken } from '../../../../../src/core';

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

/**
 * GET /api/protected
 * Example protected endpoint that requires MCP agent authentication
 */
export async function GET(request: NextRequest) {
  // 1. Verify the agent token
  const session = await verifyAgentToken(request, AUTH_SECRET);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing token' },
      { status: 401 }
    );
  }

  // 2. Verify it's an MCP agent token (not a regular user session)
  if (session.type !== 'mcp-agent') {
    return NextResponse.json(
      { error: 'Forbidden - MCP agent token required' },
      { status: 403 }
    );
  }

  // 3. Check required scopes
  const requiredScopes = ['read'];
  const hasRequiredScopes = requiredScopes.every(scope =>
    session.scopes?.includes(scope)
  );

  if (!hasRequiredScopes) {
    return NextResponse.json(
      {
        error: 'Forbidden - Missing required scopes',
        required: requiredScopes,
        current: session.scopes || []
      },
      { status: 403 }
    );
  }

  // 4. Agent is authenticated and authorized
  return NextResponse.json({
    message: 'Access granted',
    agent: {
      id: session.agentId,
      userId: session.user.id,
      scopes: session.scopes,
      expires: session.expires
    },
    data: {
      // Your protected data here
      example: 'This is protected data that only authorized agents can access'
    }
  });
}

/**
 * POST /api/protected
 * Example of a protected mutation endpoint
 */
export async function POST(request: NextRequest) {
  // 1. Verify the agent token
  const session = await verifyAgentToken(request, AUTH_SECRET);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Check for write scope
  if (!session.scopes?.includes('write')) {
    return NextResponse.json(
      { error: 'Forbidden - write scope required' },
      { status: 403 }
    );
  }

  // 3. Parse request body
  const body = await request.json();

  // 4. Perform the mutation
  // ... your logic here ...

  return NextResponse.json({
    message: 'Data updated successfully',
    agentId: session.agentId,
    userId: session.user.id,
    timestamp: new Date().toISOString()
  });
}
