# API Routes Documentation

Complete reference for all authentication API routes in the Next.js example app.

## Table of Contents

- [Configuration](#configuration)
- [Authentication Routes](#authentication-routes)
- [Session Management](#session-management)
- [MCP Routes](#mcp-routes)
- [Protected Routes](#protected-routes)

## Configuration

All routes use a centralized configuration in `app/api/auth/config.ts`:

```typescript
import { google, email } from 'auth-sdk';

export const googleAuthConfig = {
  provider: google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
  }),
  secret: process.env.AUTH_SECRET,
};

export const emailAuthConfig = {
  provider: email({
    server: process.env.SMTP_HOST + ':' + process.env.SMTP_PORT,
    from: process.env.SMTP_FROM,
  }),
  secret: process.env.AUTH_SECRET,
};
```

## Authentication Routes

### Google OAuth Sign In

**Endpoint:** `GET /api/auth/signin/google`

Initiates Google OAuth flow by redirecting to Google's authorization page.

**Usage:**
```html
<a href="/api/auth/signin/google">Sign in with Google</a>
```

**Flow:**
1. User clicks sign-in link
2. Redirects to Google OAuth consent page
3. User authorizes
4. Google redirects to `/api/auth/callback/google`

---

### Google OAuth Callback

**Endpoint:** `GET /api/auth/callback/google`

Handles the OAuth callback from Google after user authorization.

**Query Parameters:**
- `code` (string) - Authorization code from Google
- `state` (string) - CSRF state token
- `error` (string, optional) - Error if user denied access

**Success Response:**
- Sets session cookie
- Redirects to `/`

**Error Response:**
- Redirects to `/login?error={error_code}`

**Error Codes:**
- `invalid_callback` - Missing code or state
- `oauth_failed` - Failed to exchange code for token
- `no_session` - Failed to create session
- `server_error` - Unexpected error

---

### Email Magic Link Sign In

**Endpoint:** `POST /api/auth/signin/email`

Sends a magic link to the provided email address.

**Request Body:**
```json
{
  "email": "user@example.com",
  "callbackUrl": "http://localhost:3000/api/auth/callback/email" // optional
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Magic link sent! Check your email.",
  "email": "user@example.com"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid email address"
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/auth/signin/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

const data = await response.json();
if (data.success) {
  console.log('Check your email!');
}
```

---

### Email Magic Link Callback

**Endpoint:** `GET /api/auth/callback/email`

Verifies the magic link token and creates a session.

**Query Parameters:**
- `token` (string, required) - Magic link token from email

**Success Response:**
- Sets session cookie
- Redirects to `/`

**Error Response:**
- Redirects to `/login?error={error_code}`

**Error Codes:**
- `invalid_link` - Missing or malformed token
- `expired_link` - Token has expired (>15 minutes)
- `server_error` - Unexpected error

---

## Session Management

### Get Session

**Endpoint:** `GET /api/auth/session`

Returns the current session or null if not authenticated.

**Success Response:**
```json
{
  "session": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "picture": "https://..."
    },
    "expires": "2024-10-31T10:00:00.000Z",
    "type": "standard"
  }
}
```

**Not Authenticated Response:**
```json
{
  "session": null
}
```

**Example Usage:**
```typescript
const response = await fetch('/api/auth/session');
const { session } = await response.json();

if (session) {
  console.log('User:', session.user.email);
} else {
  console.log('Not signed in');
}
```

---

### Sign Out

**Endpoint:** `POST /api/auth/signout` or `GET /api/auth/signout`

Signs out the user by clearing the session cookie.

**POST Usage:**
```typescript
await fetch('/api/auth/signout', { method: 'POST' });
window.location.href = '/login';
```

**GET Usage:**
```html
<a href="/api/auth/signout">Sign Out</a>
```

**Response:**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

**Behavior:**
- Clears session cookie
- Deletes session from database (if adapter configured)
- POST returns JSON, GET redirects to `/`

---

## MCP Routes

### Execute MCP Tool

**Endpoint:** `POST /api/mcp`

Execute MCP authentication tools for AI agents.

**Request Body:**
```json
{
  "tool": "agent_login",
  "args": {
    "userId": "user-123",
    "scopes": ["debug", "read"],
    "agentId": "claude-assistant",
    "expiresIn": "15m"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires": "2024-10-24T11:00:00.000Z",
  "message": "Agent claude-assistant logged in as user user-123 with scopes: debug, read"
}
```

**Available Tools:**
- `agent_login` - Login as user with scoped access
- `get_session` - Verify and retrieve session info
- `revoke_token` - Invalidate a token

See [MCP-INTEGRATION.md](./MCP-INTEGRATION.md) for complete MCP documentation.

---

### List MCP Tools

**Endpoint:** `GET /api/mcp`

List all available MCP tools and their schemas.

**Response:**
```json
{
  "success": true,
  "tools": [
    {
      "name": "agent_login",
      "description": "Login as user for scoped agent access...",
      "parameters": { /* Zod schema */ }
    }
  ],
  "version": "1.0.0"
}
```

---

### MCP Streaming

**Endpoint:** `POST /api/mcp/stream`

Stream AI responses with MCP tool access (Vercel AI SDK).

**Request Body:**
```json
{
  "prompt": "Login as user-123 with debug scope",
  "userId": "user-123"
}
```

**Response:**
- Streaming response with AI-generated text
- Tools are executed automatically during generation
- Returns data stream compatible with `useChat()` hook

---

## Protected Routes

### Protected API Example

**Endpoint:** `GET /api/protected`

Example protected route that requires MCP agent authentication.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "message": "Access granted",
  "agent": {
    "id": "my-agent",
    "userId": "user-123",
    "scopes": ["read", "debug"],
    "expires": "2024-10-24T11:00:00.000Z"
  },
  "data": {
    "example": "Protected data"
  }
}
```

**Error Responses:**

**401 Unauthorized** - No token or invalid token:
```json
{
  "error": "Unauthorized - Invalid or missing token"
}
```

**403 Forbidden** - Missing required scopes:
```json
{
  "error": "Forbidden - Missing required scopes",
  "required": ["read"],
  "current": []
}
```

**Example Usage:**
```typescript
const token = 'eyJhbGciOiJIUzI1NiIs...'; // From agent_login

const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.message); // "Access granted"
```

---

## Error Handling

All routes follow consistent error handling:

### HTTP Status Codes

- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal server error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": { /* Optional error details */ }
}
```

### Common Error Messages

- `"Invalid email address"` - Email validation failed
- `"Unauthorized - Invalid or missing token"` - Authentication required
- `"Forbidden - Missing required scopes"` - Insufficient permissions
- `"Invalid or expired magic link"` - Magic link token invalid
- `"Failed to send magic link"` - Email sending failed

---

## Environment Variables

Required for routes to function:

```bash
# Required
AUTH_SECRET=your-secret-key-min-32-chars

# For Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# For Email Magic Links
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional - MCP Protection
MCP_API_KEY=your-mcp-api-key
```

---

## Testing Routes

Use curl to test routes:

```bash
# Get session
curl http://localhost:3000/api/auth/session

# Send magic link
curl -X POST http://localhost:3000/api/auth/signin/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Sign out
curl -X POST http://localhost:3000/api/auth/signout

# MCP agent login
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "agent_login",
    "args": {
      "userId": "user-123",
      "scopes": ["debug"],
      "agentId": "test-agent"
    }
  }'
```

---

## Next Steps

- See [README.md](./README.md) for setup instructions
- See [MCP-INTEGRATION.md](./MCP-INTEGRATION.md) for MCP details
- Check [/app](./app) directory for page examples
- Run `npm run test:mcp` to test MCP endpoints
