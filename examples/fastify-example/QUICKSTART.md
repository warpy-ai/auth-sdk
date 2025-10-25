# Quick Start Guide

Get the Fastify example running in 5 minutes!

## Prerequisites

- Node.js 18+ or Bun
- Google OAuth credentials (or any OAuth provider)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google OAuth (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing one
3. Enable **Google+ API** (APIs & Services → Library)
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Fastify Auth Example`
   - Authorized redirect URIs: `http://localhost:3000/auth/callback/google`
   - Click **Create**
5. Copy the **Client ID** and **Client Secret**

### 3. Configure Environment

Edit `.env` file and add your credentials:

```env
AUTH_SECRET=your-super-secret-jwt-signing-key-must-be-32-chars-minimum
GOOGLE_CLIENT_ID=your-client-id-from-step-2.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-from-step-2
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google
```

**Security Note**: Generate a random 32+ character secret for `AUTH_SECRET`:

```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run the Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### 5. Test the Flow

1. Open `http://localhost:3000` in your browser
2. Click **Get Started** → **Sign in with Google**
3. Complete Google OAuth consent
4. You'll be redirected to the dashboard!

## What You'll See

### Home Page (`/`)
- Landing page with features list
- Authentication status check
- Links to login and dashboard

### Login Page (`/login`)
- Google OAuth button
- Error handling display
- Automatic redirect if already authenticated

### Dashboard (`/dashboard`)
- User profile display
- Session information
- Raw session JSON
- Sign out button
- Protected API test

## Available Endpoints

### Public Endpoints
- `GET /` - Home page
- `GET /login` - Login page
- `GET /health` - Health check

### Auth Endpoints
- `GET /auth/signin/google` - Start OAuth flow
- `GET /auth/callback/google` - OAuth callback
- `GET /auth/session` - Get current session (JSON)
- `POST /auth/signout` - Sign out

### Protected Endpoints
- `GET /dashboard` - Dashboard page (redirects if not authenticated)
- `GET /api/user` - Get current user (returns 401 if not authenticated)

## Testing the Integration

### Test 1: OAuth Flow

```bash
# 1. Start OAuth (should get redirect)
curl http://localhost:3000/auth/signin/google

# 2. Complete OAuth in browser

# 3. Check session (with cookies from browser)
curl http://localhost:3000/auth/session --cookie "your-session-cookie"
```

### Test 2: Protected API

```bash
# Without auth (should fail)
curl http://localhost:3000/api/user
# Response: {"error":"Unauthorized"}

# With auth (use browser with active session)
# Opens browser console and run:
fetch('/api/user').then(r => r.json()).then(console.log)
```

### Test 3: Sign Out

```bash
curl -X POST http://localhost:3000/auth/signout \
  --cookie "your-session-cookie"
```

## Architecture Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌──────────────────────┐
│  Fastify Server      │
│  ┌────────────────┐  │
│  │ Request → Web  │  │  Convert framework request
│  │ API Request    │  │  to standard Request object
│  └────────┬───────┘  │
│           │          │
│  ┌────────▼───────┐  │
│  │ @warpy-auth-   │  │  Core SDK handles auth logic
│  │ sdk/core       │  │  (OAuth, JWT, sessions)
│  │ • authenticate │  │
│  │ • getSession   │  │
│  │ • signOut      │  │
│  └────────┬───────┘  │
│           │          │
│  ┌────────▼───────┐  │
│  │ Response →     │  │  Convert back to Fastify
│  │ Fastify Reply  │  │  response format
│  └────────────────┘  │
└──────────────────────┘
```

## Common Issues

### Issue: "Missing required environment variables"

**Solution**: Make sure `.env` file exists and contains all required variables:
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### Issue: "redirect_uri_mismatch" from Google

**Solution**: The redirect URI in Google Console must **exactly** match `GOOGLE_REDIRECT_URI` in `.env`:
- Check for trailing slashes
- Verify the port number (default: 3000)
- Must be `http://localhost:3000/auth/callback/google`

### Issue: Session not persisting

**Solution**:
- Check browser cookies are enabled
- Verify `AUTH_SECRET` is set correctly
- Check cookie settings in browser DevTools

### Issue: "Invalid CSRF token"

**Solution**: This happens if the OAuth state cookie is lost:
- Clear browser cookies and try again
- Make sure cookies are enabled
- Check if running behind a proxy that strips cookies

## Next Steps

### Add Database Persistence

The example uses in-memory session storage. For production, add a database adapter:

```typescript
import { PrismaAdapter } from '@warpy-auth-sdk/core/adapters';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET!,
  provider: google({ /* ... */ }),
  adapter: PrismaAdapter(prisma), // Add this!
};
```

### Add More Providers

```typescript
import { google, email } from '@warpy-auth-sdk/core';

// Add email magic links
const emailProvider = email({
  from: 'noreply@yourdomain.com',
  sendMagicLink: async (email, link) => {
    // Send email with link
  },
});
```

### Add MCP AI Agent Support

```typescript
import { createMCPTools } from '@warpy-auth-sdk/core';

const mcpTools = createMCPTools({
  secret: process.env.AUTH_SECRET!,
});

// Use with AI SDK
import { generateText } from 'ai';

const { text } = await generateText({
  model: yourModel,
  tools: mcpTools,
  prompt: 'Login as user-123',
});
```

### Deploy to Production

See [README.md](README.md) Production Considerations section for deployment checklist.

## Support

- GitHub Issues: [Report a bug](https://github.com/anthropics/claude-code/issues)
- Documentation: [Full docs](../../docs/)
- Examples: [Other framework examples](../)

## License

ISC
