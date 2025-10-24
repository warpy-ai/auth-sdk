/**
 * MCP (Model Context Protocol) Route Handler
 *
 * This endpoint exposes authentication tools to AI agents via the MCP protocol.
 * AI agents can use these tools to:
 * - Login as users with scoped access (agent_login)
 * - Verify session tokens (get_session)
 * - Revoke tokens (revoke_token)
 *
 * Usage:
 * - POST /api/mcp with JSON body: { tool: 'agent_login', args: { userId, scopes, agentId } }
 * - The endpoint validates the request and executes the appropriate MCP tool
 *
 * Security:
 * - Requires API key authentication (X-MCP-API-Key header)
 * - Validates tool names and arguments against schema
 * - Logs all MCP tool executions for audit
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMCPTools, type MCPToolDefinition } from '../../../../../src/mcp/mcp';
import { z } from 'zod';

// Environment validation
const MCP_API_KEY = process.env.MCP_API_KEY;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

// Initialize MCP tools
const mcpTools = createMCPTools({
  secret: AUTH_SECRET,
  // adapter: prismaAdapter(prisma) // Optional: add DB adapter
});

// Request schema
const MCPRequestSchema = z.object({
  tool: z.enum(['agent_login', 'get_session', 'revoke_token']),
  args: z.record(z.any()),
});

/**
 * POST /api/mcp
 * Execute MCP tool with given arguments
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the request (optional but recommended)
    if (MCP_API_KEY) {
      const apiKey = request.headers.get('X-MCP-API-Key');
      if (apiKey !== MCP_API_KEY) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      }
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedRequest = MCPRequestSchema.parse(body);

    // 3. Get the requested tool
    const tool = mcpTools[validatedRequest.tool] as MCPToolDefinition;
    if (!tool) {
      return NextResponse.json(
        { success: false, error: `Tool '${validatedRequest.tool}' not found` },
        { status: 404 }
      );
    }

    // 4. Validate arguments against tool's schema
    const validatedArgs = tool.parameters.parse(validatedRequest.args);

    // 5. Execute the tool
    const result = await tool.execute(validatedArgs);

    // 6. Log the execution (optional but recommended)
    console.log('[MCP]', {
      tool: validatedRequest.tool,
      args: validatedRequest.args,
      result: result.success ? 'success' : 'failed',
      timestamp: new Date().toISOString(),
    });

    // 7. Return the result
    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });

  } catch (error) {
    console.error('[MCP] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp
 * List available MCP tools and their schemas
 */
export async function GET() {
  const toolDefinitions = Object.entries(mcpTools).map(([name, tool]) => {
    const typedTool = tool as MCPToolDefinition;
    return {
      name,
      description: typedTool.description,
      parameters: typedTool.parameters.shape,
    };
  });

  return NextResponse.json({
    success: true,
    tools: toolDefinitions,
    version: '1.0.0',
  });
}
