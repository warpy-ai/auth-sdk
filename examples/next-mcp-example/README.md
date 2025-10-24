# Next.js MCP Example

This example demonstrates how to use the `@warpy-auth-sdk/core` package with Next.js 16, including:

- Next.js 16 Proxy-based authentication (Clerk-like ergonomics)
- Google OAuth integration
- MCP (Model Context Protocol) for AI agent authentication
- Server and client-side session management

## Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Configure environment variables in `.env.local`:

   ```env
   AUTH_SECRET=your-secret-key-min-32-chars-long-replace-this-in-production
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
   ```

3. Run the development server:

   ```bash
   bun dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Authentication Endpoints

All authentication is handled via the Proxy at `/api/auth`:

- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/signin/google` - Start Google OAuth flow
- `GET /api/auth/callback/google` - Google OAuth callback

## MCP (AI Agent Authentication)

The MCP endpoint at `/api/mcp` exposes tools for AI agents to authenticate:

### Agent Login

Create a short-lived agent token:

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "agent_login",
    "args": {
      "userId": "user-123",
      "scopes": ["debug", "read"],
      "agentId": "dev-agent",
      "expiresIn": "15m"
    }
  }'
```

Response:

```json
{
  "token": "eyJhbGc...",
  "expiresAt": "2024-01-24T15:30:00.000Z"
}
```

### Get Session

Retrieve session info from a token:

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_session",
    "args": {
      "token": "eyJhbGc..."
    }
  }'
```

Response:

```json
{
  "userId": "user-123",
  "scopes": ["debug", "read"],
  "agentId": "dev-agent",
  "type": "mcp-agent"
}
```

### Revoke Token

Invalidate an agent token:

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "revoke_token",
    "args": {
      "token": "eyJhbGc..."
    }
  }'
```

Response:

```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

## Project Structure

```
app/
├── api/
│   └── mcp/
│       └── route.ts       # MCP endpoint for AI agent auth
├── dashboard/
│   └── page.tsx          # Protected dashboard page
├── login/
│   └── page.tsx          # Login page
├── layout.tsx            # Root layout with AuthProvider
└── page.tsx              # Home page
proxy.ts                  # Next.js 16 Proxy for auth routes
```

## Development Notes

- The package is installed from the tarball (`../../auth-sdk-core-0.0.0-dev-01.tgz`) for local development
- After making changes to `@warpy-auth-sdk/core`, rebuild and repack:
  ```bash
  cd ../../
  npm run build
  npm pack
  cd examples/next-mcp-example
  bun remove @warpy-auth-sdk/core
  bun add ../../auth-sdk-core-0.0.0-dev-01.tgz
  ```

## Security Notes

- MCP tokens are short-lived (default 15 minutes)
- Scope-based access control limits what agents can do
- Token revocation is supported (use Redis/DB in production, not in-memory)
- Always use HTTPS in production
- The `AUTH_SECRET` must be at least 32 characters
