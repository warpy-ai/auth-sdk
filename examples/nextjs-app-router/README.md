# Next.js App Router Example - Auth SDK with MCP

This example demonstrates how to use the auth-sdk in a Next.js 15+ application with App Router, including MCP (Model Context Protocol) integration for AI agent authentication.

## Features

- ✅ MCP endpoint for AI agent authentication
- ✅ Streaming AI responses with auth tools
- ✅ Token-based agent authentication
- ✅ Scope-based access control
- ✅ Token revocation support
- ✅ Comprehensive testing script

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:

```env
AUTH_SECRET=your-secret-key-at-least-32-characters
MCP_API_KEY=optional-api-key-for-mcp-protection
OPENAI_API_KEY=sk-... # For streaming endpoint
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## MCP Endpoints

### `/api/mcp` - Direct Tool Execution

Execute MCP tools via REST API.

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "agent_login",
    "args": {
      "userId": "user-123",
      "scopes": ["debug", "read"],
      "agentId": "my-agent"
    }
  }'
```

### `/api/mcp/stream` - AI SDK Streaming

Stream AI responses with MCP tool access.

**Example:**
```bash
curl -X POST http://localhost:3000/api/mcp/stream \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Login as user-123 with debug scope"
  }'
```

## Testing

Run the comprehensive MCP test suite:

```bash
npm run test:mcp
```

This will test:
- Listing available tools
- Agent login
- Session verification
- Token usage in Authorization header
- Token revocation

## Project Structure

```
examples/nextjs-app-router/
├── app/
│   └── api/
│       └── mcp/
│           ├── route.ts          # Direct MCP tool execution
│           └── stream/
│               └── route.ts      # AI SDK streaming with tools
├── scripts/
│   └── test-mcp.ts              # MCP testing script
├── .env.example                 # Environment variables template
├── MCP-INTEGRATION.md          # Detailed MCP integration guide
└── package.json
```

## Documentation

- [MCP Integration Guide](./MCP-INTEGRATION.md) - Complete guide to MCP integration
- [Main Documentation](../../docs/Implementation.md) - Full auth-sdk documentation
- [MVP Plan](../../docs/MVP-Plan.md) - Implementation roadmap

## Usage Examples

### Agent Login

```typescript
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'agent_login',
    args: {
      userId: 'user-123',
      scopes: ['debug', 'read'],
      agentId: 'my-ai-agent',
      expiresIn: '15m'
    }
  })
});

const { token } = await response.json();
```

### Use Token

```typescript
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Verify Session

```typescript
const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'get_session',
    args: { token }
  })
});

const { session } = await response.json();
console.log(session.userId, session.scopes);
```

### Revoke Token

```typescript
await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'revoke_token',
    args: { token }
  })
});
```

## Security Notes

1. **Always set AUTH_SECRET** to a secure random string (min 32 characters)
2. **Use MCP_API_KEY** in production to protect MCP endpoints
3. **Use HTTPS** in production for all requests
4. **Set short expiration times** for agent tokens (default: 15 minutes)
5. **Use minimal scopes** for agent access
6. **Revoke tokens** immediately after use when possible
7. **Monitor MCP activity** through logs and alerts

## Deployment

### Vercel

```bash
vercel
```

Make sure to set environment variables in Vercel dashboard:
- `AUTH_SECRET`
- `MCP_API_KEY`
- `OPENAI_API_KEY` (if using streaming)

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Learn More

- [Auth SDK Documentation](../../CLAUDE.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)
