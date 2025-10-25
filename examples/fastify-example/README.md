# Fastify Authentication Example

This example demonstrates how to use `@warpy-auth-sdk/core` with Fastify, showcasing the platform-agnostic nature of the SDK.

## Features

- **Platform-agnostic authentication**: Uses standard Web APIs (Request/Response)
- **Google OAuth 2.0**: Complete OAuth flow implementation
- **JWT sessions**: Secure token-based authentication
- **Cookie management**: HttpOnly, Secure, SameSite cookies
- **Protected routes**: Example API endpoints with authentication
- **Modern UI**: Clean, responsive HTML/CSS/JS frontend

## Architecture

The SDK's core is completely framework-agnostic. This example shows how to integrate it with Fastify by:

1. Converting Fastify requests to standard Web API `Request` objects
2. Calling core SDK functions (`authenticate`, `getSession`, `signOut`)
3. Converting standard `Response` objects back to Fastify responses

### Key Files

- **[src/routes/auth.ts](src/routes/auth.ts)** - Authentication routes using SDK core
- **[src/index.ts](src/index.ts)** - Fastify server setup
- **[src/public/](src/public/)** - HTML pages (index, login, dashboard)

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
AUTH_SECRET=your-secret-key-min-32-chars-long-for-jwt-signing
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google
```

### 3. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/callback/google`
5. Copy Client ID and Client Secret to `.env`

### 4. Run the Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## Available Endpoints

### Authentication Routes

- `GET /auth/session` - Get current session
- `POST /auth/signout` - Sign out user
- `GET /auth/signin/google` - Start Google OAuth flow
- `GET /auth/callback/google` - Handle OAuth callback

### API Routes

- `GET /api/user` - Get current user (protected)

### Pages

- `GET /` - Home page
- `GET /login` - Login page
- `GET /dashboard` - Protected dashboard

## How It Works

### 1. Request Conversion

Fastify requests are converted to Web API `Request` objects:

```typescript
function toWebRequest(request: FastifyRequest): Request {
  const url = `${request.protocol}://${request.hostname}${request.url}`;
  const headers = new Headers();

  Object.entries(request.headers).forEach(([key, value]) => {
    if (value) {
      headers.set(key, String(value));
    }
  });

  return new Request(url, {
    method: request.method,
    headers,
  });
}
```

### 2. Core SDK Usage

The SDK's core functions work with standard Request objects:

```typescript
import { authenticate, getSession, signOut } from '@warpy-auth-sdk/core';

// Start OAuth flow
const result = await authenticate(authConfig, webRequest);

// Get session from cookie
const session = await getSession(webRequest, config.secret);

// Sign out
await signOut(webRequest, config);
```

### 3. Cookie Management

Session cookies are parsed from standard `Set-Cookie` headers:

```typescript
const sessionCookie = createSessionCookie(session);
setCookieFromHeader(reply, sessionCookie);
```

## Platform-Agnostic Design

This example proves the SDK works with **any Node.js framework**. The same core functions can be used with:

- **Next.js** (see `examples/next-mcp-example`)
- **Express** (coming soon)
- **Hono** (coming soon)
- **Koa** (coming soon)
- **Any framework** that can create Web API Request/Response objects

### Comparison with Next.js Integration

| Feature | Fastify (this example) | Next.js (`/next` module) |
|---------|----------------------|------------------------|
| Core SDK | ✅ Same | ✅ Same |
| OAuth Flow | ✅ Manual routing | ✅ Auto routing via middleware |
| Session Management | ✅ Manual cookie parsing | ✅ Auto cookie handling |
| Framework-specific | Fastify request/reply | Next.js Request/Response |
| Complexity | Medium (more control) | Low (zero-config) |

## Extending to Other Frameworks

To adapt this example to another framework:

1. **Convert framework request to Web API Request**
   ```typescript
   function toWebRequest(frameworkRequest): Request
   ```

2. **Use core SDK functions**
   ```typescript
   import { authenticate, getSession, signOut } from '@warpy-auth-sdk/core';
   ```

3. **Convert responses back to framework format**
   ```typescript
   const result = await authenticate(config, webRequest);
   return frameworkReply.redirect(result.redirectUrl);
   ```

## Production Considerations

- [ ] Use Redis/database for session storage via `adapter` option
- [ ] Enable HTTPS and update cookie `secure` flag
- [ ] Set up proper error logging
- [ ] Implement rate limiting on auth routes
- [ ] Add CSRF protection for state-changing operations
- [ ] Configure proper CORS headers
- [ ] Use environment-specific redirect URIs
- [ ] Add health checks and monitoring

## MCP AI Agent Support

The SDK includes built-in support for AI agent authentication. See the main SDK docs for MCP integration examples.

## License

ISC

## Contributing

Contributions are welcome! Please open an issue or PR.
