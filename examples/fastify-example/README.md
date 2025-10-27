# Fastify Authentication Example

This example demonstrates how to use `@warpy-auth-sdk/core` with Fastify, showcasing the platform-agnostic nature of the SDK.

## Features

- **Platform-agnostic authentication**: Uses standard Web APIs (Request/Response)
- **Multiple Authentication Providers**:
  - **Google OAuth 2.0**: Complete OAuth flow implementation with PKCE
  - **Two-Factor Email**: Email-based 2FA with 6-digit verification codes
  - **Magic Link Email**: Passwordless authentication via email links
- **JWT sessions**: Secure token-based authentication
- **Cookie management**: HttpOnly, Secure, SameSite cookies
- **Protected routes**: Example API endpoints with authentication
- **Modern UI**: Clean, responsive HTML/CSS/JS frontend
- **Email Services**: Support for Resend and Nodemailer (SMTP)

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

#### Required Environment Variables

All configurations require:

```env
AUTH_SECRET=your-secret-key-min-32-chars-long-for-jwt-signing
```

Choose **ONE** authentication provider:

#### Option A: Google OAuth 2.0

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

**Setup Steps:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env`

#### Option B: Two-Factor Email Authentication

```env
# Required
TWOFA_FROM_EMAIL=noreply@example.com
TWOFA_APP_NAME=Fastify Auth Example
TWOFA_EXPIRATION_MINUTES=5

# Choose ONE email service:

# Option B1: Resend (Recommended)
RESEND_API_KEY=re_your_resend_api_key

# Option B2: SMTP (Nodemailer)
SMTP_SERVER=smtp.gmail.com:587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Setup Steps (Resend):**

1. Sign up at [Resend](https://resend.com/)
2. Create an API key
3. Verify your domain or use onboarding domain for testing
4. Copy API key to `.env`

**Setup Steps (SMTP):**

1. For Gmail:
   - Enable 2-Step Verification in your Google Account
   - Generate an App Password
   - Use `smtp.gmail.com:587` as server
2. For other SMTP providers, use their server settings

#### Option C: Magic Link Email Authentication

```env
# Required
MAGIC_LINK_FROM_EMAIL=noreply@example.com
MAGIC_LINK_APP_NAME=Fastify Auth Example
MAGIC_LINK_EXPIRATION_MINUTES=15

# Choose ONE email service (same as 2FA):

# Option C1: Resend (Recommended)
RESEND_API_KEY=re_your_resend_api_key

# Option C2: SMTP (Nodemailer)
SMTP_SERVER=smtp.gmail.com:587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Setup Steps:** Same as Option B (2FA) - uses the same email service

### 3. Install Dependencies

```bash
npm install
# or
bun install
```

### 4. Run the Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## Available Endpoints

### Authentication Routes

#### Common Routes (All Providers)
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - Sign out user

#### Google OAuth Routes
- `GET /api/auth/signin/google` - Start Google OAuth flow
- `GET /api/auth/callback/google` - Handle OAuth callback

#### Two-Factor Email Routes
- `POST /api/auth/signin/twofa` - Send verification code to email
  - Body: `{ "email": "user@example.com" }`
  - Returns: `{ "identifier": "...", "expiresIn": 300000 }`
- `POST /api/auth/verify/twofa` - Verify the 6-digit code
  - Body: `{ "identifier": "...", "code": "123456" }`

#### Magic Link Email Routes
- `POST /api/auth/signin/email` - Send magic link to email
  - Body: `{ "email": "user@example.com" }`
  - Returns: `{ "success": true, "message": "Magic link sent to your email" }`
- `GET /api/auth/callback/email` - Verify magic link token
  - Query: `?token=<token>&email=<email>`
  - Redirects to dashboard on success or login on failure

### API Routes

- `GET /api/user` - Get current user (protected)

### Pages

- `GET /` - Home page
- `GET /login` - Login page (auto-detects provider)
- `GET /verify` - 2FA verification page (for email codes)
- `GET /dashboard` - Protected dashboard

## How It Works

### Authentication Flows

#### Google OAuth Flow

1. User clicks "Sign in with Google"
2. User is redirected to Google consent screen
3. Google redirects back with authorization code
4. SDK exchanges code for user info and creates session
5. User is redirected to dashboard

#### Two-Factor Email Flow

1. User enters email address on login page
2. SDK generates a 6-digit verification code
3. Code is sent via email (Resend or SMTP)
4. User is redirected to verification page
5. User enters the 6-digit code
6. SDK verifies code and creates session
7. User is redirected to dashboard

**Security Features:**
- Codes expire after 5 minutes (configurable)
- Codes are single-use only
- Failed attempts don't delete the code (allow retries)
- 60-second cooldown between code resends
- Codes are cryptographically secure (crypto.randomBytes)

#### Magic Link Email Flow

1. User enters email address on login page
2. SDK generates a secure token
3. Magic link with token is sent via email (Resend or SMTP)
4. User clicks the link in their email
5. SDK verifies the token
6. Session is created and user is redirected to dashboard

**Security Features:**
- Links expire after 15 minutes (configurable)
- Tokens are single-use only
- Tokens are cryptographically secure
- Beautiful email template with modern design

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
import { authenticate, getSession, signOut, google, twofa } from '@warpy-auth-sdk/core';

// Option A: Google OAuth provider
const authConfig = {
  secret: process.env.AUTH_SECRET,
  provider: google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  }),
};

// Option B: Two-Factor Email provider
const authConfig = {
  secret: process.env.AUTH_SECRET,
  provider: twofa({
    from: 'noreply@example.com',
    service: {
      type: 'resend',
      apiKey: process.env.RESEND_API_KEY,
    },
    appName: 'Fastify Auth Example',
    expirationMinutes: 5,
  }),
};

// Use the SDK
const result = await authenticate(authConfig, webRequest);
const session = await getSession(webRequest, config.secret);
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
