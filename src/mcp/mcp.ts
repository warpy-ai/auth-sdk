import { authenticate, type AuthConfig } from '../core';
import { verifyJWT } from '../utils/jwt';
import { z } from 'zod';

// Store revoked tokens (in-memory, should use Redis/DB in production)
const revokedTokens = new Set<string>();

export interface MCPToolDefinition {
  description: string;
  parameters: z.ZodObject<any>;
  execute: (args: any) => Promise<any>;
}

export function createMCPTools({ secret, adapter }: { secret: string; adapter?: any }) {
  const baseConfig: AuthConfig = {
    secret,
    mcp: { enabled: true },
    adapter,
    provider: {} as any, // Not used for MCP auth
  };

  const tools = {
    agent_login: {
      description: 'Login as user for scoped agent access (returns short-lived JWT token)',
      parameters: z.object({
        userId: z.string().describe('User ID to impersonate'),
        scopes: z.array(z.string()).describe('Scopes for agent access (e.g., ["debug", "read"])'),
        agentId: z.string().describe('Unique identifier for the agent'),
        expiresIn: z.string().optional().default('15m').describe('Token expiration (e.g., "15m", "1h")'),
      }),
      execute: async (args: { userId: string; scopes: string[]; agentId: string; expiresIn?: string }) => {
        try {
          const { userId, scopes, agentId, expiresIn } = args;
          const result = await authenticate(
            baseConfig,
            undefined,
            { userId, scopes, agentId, expiresIn: expiresIn || '15m' }
          );

          if (result.session && result.session.token) {
            return {
              success: true,
              token: result.session.token,
              expires: result.session.expires.toISOString(),
              message: `Agent ${agentId} logged in as user ${userId} with scopes: ${scopes.join(', ')}`,
            };
          }

          return {
            success: false,
            error: result.error || 'Failed to create agent session',
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    } as MCPToolDefinition,

    get_session: {
      description: 'Get current session information from a token',
      parameters: z.object({
        token: z.string().describe('JWT token to verify'),
      }),
      execute: async (args: { token: string }) => {
        try {
          const { token } = args;

          // Check if token is revoked
          if (revokedTokens.has(token)) {
            return {
              success: false,
              error: 'Token has been revoked',
            };
          }

          const payload = verifyJWT(token, secret);

          if (!payload) {
            return {
              success: false,
              error: 'Invalid or expired token',
            };
          }

          return {
            success: true,
            session: {
              userId: payload.userId,
              email: payload.email,
              name: payload.name,
              type: payload.type,
              scopes: payload.scopes,
              agentId: payload.agentId,
            },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get session',
          };
        }
      },
    } as MCPToolDefinition,

    revoke_token: {
      description: 'Revoke an agent token (invalidate it)',
      parameters: z.object({
        token: z.string().describe('JWT token to revoke'),
      }),
      execute: async (args: { token: string }) => {
        try {
          const { token } = args;
          const payload = verifyJWT(token, secret);

          if (!payload) {
            return {
              success: false,
              error: 'Invalid token',
            };
          }

          // Add to revoked list
          revokedTokens.add(token);

          return {
            success: true,
            message: `Token for ${payload.type === 'mcp-agent' ? `agent ${payload.agentId}` : `user ${payload.userId}`} has been revoked`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to revoke token',
          };
        }
      },
    } as MCPToolDefinition,
  };

  return tools;
}

export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}
