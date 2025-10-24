# MCP Integration Guide

This guide explains how to use the Model Context Protocol (MCP) authentication tools in your Next.js application.

## Overview

The auth-sdk provides MCP tools that allow AI agents to:
- **Login as users** with scoped, time-limited access
- **Verify session tokens** to check authentication status
- **Revoke tokens** to invalidate agent access immediately

## API Endpoints

### 1. `/api/mcp` - Direct Tool Execution

Execute MCP tools directly via REST API.

**POST Request:**
```typescript
fetch('/api/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-MCP-API-Key': 'your-api-key' // Optional, if MCP_API_KEY env var is set
  },
  body: JSON.stringify({
    tool: 'agent_login',
    args: {
      userId: 'user-123',
      scopes: ['debug', 'read'],
      agentId: 'claude-assistant',
      expiresIn: '15m'
    }
  })
});
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2024-01-15T10:30:00.000Z",
  "message": "Agent claude-assistant logged in as user user-123 with scopes: debug, read"
}
```

**GET Request (List Available Tools):**
```typescript
fetch('/api/mcp');
```

**Response:**
```json
{
  "success": true,
  "tools": [
    {
      "name": "agent_login",
      "description": "Login as user for scoped agent access (returns short-lived JWT token)",
      "parameters": { /* zod schema */ }
    },
    ...
  ],
  "version": "1.0.0"
}
```

### 2. `/api/mcp/stream` - AI SDK Streaming

Use MCP tools with AI model streaming (Vercel AI SDK).

**POST Request:**
```typescript
const response = await fetch('/api/mcp/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Login as user-123 with debug and read scopes',
    userId: 'user-123' // Optional context
  })
});

// Stream the response
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}
```

## MCP Tools

### agent_login

Login as a user with scoped access.

**Parameters:**
- `userId` (string): User ID to impersonate
- `scopes` (string[]): Access scopes (e.g., `["debug", "read"]`)
- `agentId` (string): Unique identifier for the agent
- `expiresIn` (string, optional): Token expiration (default: "15m")

**Example:**
```typescript
const result = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'agent_login',
    args: {
      userId: 'user-123',
      scopes: ['debug'],
      agentId: 'my-agent-1',
      expiresIn: '30m'
    }
  })
});
```

**Response:**
```json
{
  "success": true,
  "token": "eyJ...",
  "expires": "2024-01-15T11:00:00.000Z",
  "message": "Agent my-agent-1 logged in as user user-123 with scopes: debug"
}
```

### get_session

Verify a token and get session information.

**Parameters:**
- `token` (string): JWT token to verify

**Example:**
```typescript
const result = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'get_session',
    args: {
      token: 'eyJ...'
    }
  })
});
```

**Response:**
```json
{
  "success": true,
  "session": {
    "userId": "user-123",
    "email": "user@example.com",
    "type": "mcp-agent",
    "scopes": ["debug"],
    "agentId": "my-agent-1"
  }
}
```

### revoke_token

Revoke a token immediately.

**Parameters:**
- `token` (string): JWT token to revoke

**Example:**
```typescript
const result = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'revoke_token',
    args: {
      token: 'eyJ...'
    }
  })
});
```

**Response:**
```json
{
  "success": true,
  "message": "Token for agent my-agent-1 has been revoked"
}
```

## Environment Variables

```bash
# Required
AUTH_SECRET=your-secret-key-here

# Optional - API key protection for MCP endpoint
MCP_API_KEY=your-mcp-api-key

# For streaming endpoint (if using OpenAI)
OPENAI_API_KEY=your-openai-api-key
```

## Security Considerations

1. **API Key Protection**: Set `MCP_API_KEY` to require authentication for MCP endpoints
2. **Short-lived Tokens**: Agent tokens default to 15 minutes expiration
3. **Scope-based Access**: Always use minimal scopes needed for the task
4. **Token Revocation**: Revoke tokens immediately after use or on error
5. **Audit Logging**: All MCP tool executions are logged to console

## Using MCP Tokens

Once you have an agent token, use it in the `Authorization` header:

```typescript
// Protected API route
import { verifyAgentToken } from 'auth-sdk';

export async function GET(request: Request) {
  const session = await verifyAgentToken(request, process.env.AUTH_SECRET!);

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check scopes
  if (!session.scopes?.includes('read')) {
    return new Response('Forbidden', { status: 403 });
  }

  // Agent is authenticated and authorized
  return Response.json({
    message: `Hello ${session.agentId}`,
    userId: session.user.id
  });
}
```

## Client-Side Usage with AI SDK

```typescript
'use client';

import { useChat } from 'ai/react';

export function MCPChat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/mcp/stream',
    body: {
      userId: 'user-123' // Your user context
    }
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask me to login as a user..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## Testing

Test the MCP endpoints with curl:

```bash
# List available tools
curl http://localhost:3000/api/mcp

# Login as agent
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "agent_login",
    "args": {
      "userId": "test-user",
      "scopes": ["debug"],
      "agentId": "test-agent"
    }
  }'

# Verify session
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_session",
    "args": {
      "token": "YOUR_TOKEN_HERE"
    }
  }'
```

## Production Considerations

1. **Token Storage**: Replace in-memory token revocation with Redis or database
2. **Rate Limiting**: Add rate limiting to MCP endpoints
3. **Monitoring**: Set up alerts for suspicious MCP activity
4. **Audit Trail**: Store MCP tool executions in database
5. **IP Whitelisting**: Restrict MCP endpoints to known AI agent IPs
