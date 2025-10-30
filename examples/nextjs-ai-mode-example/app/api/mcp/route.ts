// MCP Tools API endpoint for AI agents
// POST /api/mcp
//
// AUTHENTICATION FLOW:
// 1. AI agent must first call agent_login to get a JWT token
// 2. All other tools require the token in Authorization header
// 3. Token is validated before executing protected tools

import { createMCPShield, verifyJWT } from '@warpy-auth-sdk/core';
import { createFlightMCPTools } from '@/lib/mcp-tools';

// Export runtime config for Next.js 16
export const runtime = 'nodejs';

// Create MCP Shield for auth tools (agent_login, get_session, revoke_token)
const authTools = createMCPShield({
  secret: process.env.AUTH_SECRET!,
  metrics: {
    enabled: true,
    flushIntervalMs: 10000,
  },
});

// Create protected flight/user tools (require authentication)
const protectedTools = createFlightMCPTools();

// Define which tools are public (don't require agent token)
const PUBLIC_TOOLS = ['agent_login'];

// Define which tools are protected (require agent token)
const PROTECTED_TOOLS = [
  'search_flights',
  'track_flight',
  'pay_for_flight',
  'get_user_info',
  'update_user_info',
  'get_session',
  'revoke_token',
];

/**
 * Verify agent authentication from request headers
 */
function verifyAgentAuth(request: Request): {
  valid: boolean;
  payload?: any;
  error?: string;
} {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return {
      valid: false,
      error: 'Missing Authorization header. Please authenticate using agent_login first.',
    };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      error: 'Invalid Authorization header format. Use: Bearer <token>',
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const payload = verifyJWT(token, process.env.AUTH_SECRET!);

    if (!payload) {
      return {
        valid: false,
        error: 'Invalid or expired token',
      };
    }

    // Verify this is an MCP agent token
    if (payload.type !== 'mcp-agent') {
      return {
        valid: false,
        error: 'Invalid token type. Must be an MCP agent token.',
      };
    }

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Token verification failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
    };
  }
}

/**
 * Check if agent has required scopes for the tool
 */
function checkScopes(agentScopes: string[], requiredScopes: string[]): boolean {
  // If no specific scopes required, allow access
  if (!requiredScopes || requiredScopes.length === 0) {
    return true;
  }

  // Check if agent has at least one required scope
  return requiredScopes.some(scope => agentScopes.includes(scope));
}

/**
 * Get required scopes for each tool
 */
function getRequiredScopes(toolName: string): string[] {
  const scopeMap: Record<string, string[]> = {
    search_flights: ['search', 'read'],
    track_flight: ['track', 'write'],
    pay_for_flight: ['payment', 'write'],
    get_user_info: ['user', 'read'],
    update_user_info: ['user', 'write'],
    get_session: ['session', 'read'],
    revoke_token: ['admin', 'write'],
  };

  return scopeMap[toolName] || [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tool, args } = body || {};

    if (!tool) {
      return Response.json(
        {
          error: 'Missing "tool" parameter',
          usage: 'POST /api/mcp with body: { "tool": "tool_name", "args": {...} }'
        },
        { status: 400 }
      );
    }

    // Check if tool exists
    const allToolNames = [...PUBLIC_TOOLS, ...PROTECTED_TOOLS];
    if (!allToolNames.includes(tool)) {
      return Response.json(
        {
          error: `Unknown tool: ${tool}`,
          availableTools: {
            public: PUBLIC_TOOLS,
            protected: PROTECTED_TOOLS,
          },
          hint: 'Public tools can be called directly. Protected tools require authentication via agent_login first.',
        },
        { status: 400 }
      );
    }

    // Step 1: Check if this is a public tool (agent_login)
    if (PUBLIC_TOOLS.includes(tool)) {
      console.log(`[MCP API] Executing public tool: ${tool}`);

      // Execute auth tool directly
      const authTool = authTools[tool as keyof typeof authTools];
      if (!authTool) {
        return Response.json(
          { error: 'Tool not found in auth tools' },
          { status: 500 }
        );
      }

      // @ts-ignore
      const result = await authTool.execute(args || {});
      return Response.json(result, { status: 200 });
    }

    // Step 2: For protected tools, verify authentication
    if (PROTECTED_TOOLS.includes(tool)) {
      const auth = verifyAgentAuth(request);

      if (!auth.valid) {
        return Response.json(
          {
            error: 'Authentication required',
            message: auth.error,
            hint: 'Please call agent_login first to get an authentication token, then include it in the Authorization header: Bearer <token>',
            example: {
              step1: 'POST /api/mcp with {"tool":"agent_login","args":{...}}',
              step2: 'POST /api/mcp with Authorization: Bearer <token>',
            },
          },
          { status: 401 }
        );
      }

      // Step 3: Check if agent has required scopes
      const requiredScopes = getRequiredScopes(tool);
      const agentScopes = auth.payload?.scopes || [];

      if (requiredScopes.length > 0 && !checkScopes(agentScopes, requiredScopes)) {
        return Response.json(
          {
            error: 'Insufficient permissions',
            message: `This tool requires one of these scopes: ${requiredScopes.join(', ')}`,
            yourScopes: agentScopes,
            requiredScopes,
          },
          { status: 403 }
        );
      }

      console.log(`[MCP API] Executing protected tool: ${tool} for agent ${auth.payload?.agentId}`);

      // Step 4: Execute the protected tool
      let result: any;

      // Handle auth tools (get_session, revoke_token)
      if (['get_session', 'revoke_token'].includes(tool)) {
        const authTool = authTools[tool as keyof typeof authTools];
        // @ts-ignore
        result = await authTool.execute(args || {});
      } else {
        // Handle flight/user tools
        const protectedTool = protectedTools[tool as keyof typeof protectedTools];
        if (!protectedTool) {
          return Response.json(
            { error: 'Tool not found in protected tools' },
            { status: 500 }
          );
        }
        // @ts-ignore
        result = await protectedTool.execute(args || {});
      }

      // Add authentication context to response
      return Response.json({
        ...result,
        _auth: {
          agentId: auth.payload?.agentId,
          userId: auth.payload?.userId,
          scopes: agentScopes,
        },
      }, { status: 200 });
    }

    return Response.json(
      { error: 'Tool not properly categorized' },
      { status: 500 }
    );

  } catch (error) {
    console.error('[MCP API] Error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to list available tools and authentication flow
export async function GET() {
  return Response.json({
    name: 'FlightSearch AI - MCP Tools',
    version: '1.0.0',
    authentication: {
      flow: 'Bearer token authentication',
      steps: [
        {
          step: 1,
          action: 'Call agent_login to get a JWT token',
          endpoint: 'POST /api/mcp',
          body: {
            tool: 'agent_login',
            args: {
              userId: 'user-id',
              scopes: ['search', 'read', 'track', 'write'],
              agentId: 'my-agent',
              expiresIn: '15m',
            },
          },
          response: {
            success: true,
            token: '<JWT_TOKEN>',
            expires: '<ISO_DATE>',
          },
        },
        {
          step: 2,
          action: 'Use the token in Authorization header for protected tools',
          endpoint: 'POST /api/mcp',
          headers: {
            Authorization: 'Bearer <JWT_TOKEN>',
            'Content-Type': 'application/json',
          },
          body: {
            tool: 'search_flights',
            args: {
              from: 'JFK',
              to: 'LAX',
              departureDate: '2025-11-15',
              adults: 1,
              children: 0,
              infants: 0,
              cabinClass: 'Economy',
              currency: 'USD',
            },
          },
        },
      ],
    },
    tools: {
      public: PUBLIC_TOOLS.map(name => ({
        name,
        description: 'Authentication tool - no token required',
        requiresAuth: false,
      })),
      protected: PROTECTED_TOOLS.map(name => ({
        name,
        description: 'Protected tool - requires agent token',
        requiresAuth: true,
        requiredScopes: getRequiredScopes(name),
      })),
    },
    scopeDefinitions: {
      search: 'Search for flights',
      read: 'Read-only access to data',
      track: 'Track flights for price changes',
      write: 'Modify data',
      payment: 'Process payments',
      user: 'Access user information',
      session: 'Manage sessions',
      admin: 'Administrative actions',
    },
    examples: {
      curl: {
        step1_login: `curl -X POST http://localhost:3000/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"tool":"agent_login","args":{"userId":"demo-user","scopes":["search","read","track"],"agentId":"claude-agent","expiresIn":"15m"}}'`,
        step2_use_token: `curl -X POST http://localhost:3000/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -d '{"tool":"search_flights","args":{"from":"JFK","to":"LAX","departureDate":"2025-11-15","adults":1,"children":0,"infants":0,"cabinClass":"Economy","currency":"USD"}}'`,
      },
    },
  });
}
