/**
 * MCP Streaming Route Handler
 *
 * This endpoint provides a streaming interface for AI agents using the Vercel AI SDK.
 * It allows AI models to call MCP tools during conversation generation.
 *
 * Usage with AI SDK:
 * ```typescript
 * const { text } = await generateText({
 *   model: openai('gpt-4'),
 *   tools: mcpTools,
 *   prompt: 'Login as user-123 with debug scope'
 * });
 * ```
 *
 * This route handles:
 * - Tool execution during streaming
 * - Real-time responses with tool results
 * - Automatic token management
 */

import { NextRequest } from 'next/server';
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai'; // or any other provider
import { createMCPTools } from '../../../../../../src/mcp/mcp';
import { z } from 'zod';

const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

// Initialize MCP tools
const rawMcpTools = createMCPTools({
  secret: AUTH_SECRET,
});

// Convert MCP tools to AI SDK format
const aiSdkTools = {
  agent_login: tool({
    description: rawMcpTools.agent_login.description,
    parameters: rawMcpTools.agent_login.parameters,
    execute: rawMcpTools.agent_login.execute,
  }),
  get_session: tool({
    description: rawMcpTools.get_session.description,
    parameters: rawMcpTools.get_session.parameters,
    execute: rawMcpTools.get_session.execute,
  }),
  revoke_token: tool({
    description: rawMcpTools.revoke_token.description,
    parameters: rawMcpTools.revoke_token.parameters,
    execute: rawMcpTools.revoke_token.execute,
  }),
};

/**
 * POST /api/mcp/stream
 * Stream AI responses with MCP tool access
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, userId } = await request.json();

    if (!prompt) {
      return new Response('Missing prompt', { status: 400 });
    }

    // Stream the AI response with MCP tools available
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      tools: aiSdkTools,
      system: `You are a helpful AI assistant with access to authentication tools.
You can log in as users, check session status, and revoke tokens.
Always be cautious when using authentication tools and explain what you're doing.
Current context: ${userId ? `User ID: ${userId}` : 'No user context'}`,
      prompt,
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[MCP Stream] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
