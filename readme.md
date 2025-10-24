# Auth SDK

A lightweight, modular authentication SDK for Next.js applications with **Model Context Protocol (MCP)** support for AI agent authentication.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)]()
[![License](https://img.shields.io/badge/license-ISC-green.svg)]()

## Features

- ✅ **Multiple Authentication Providers**
  - Google OAuth 2.0
  - Email Magic Links (passwordless)
  - Extensible provider system

- ✅ **MCP (Model Context Protocol) Integration**
  - AI agent delegated authentication
  - Scoped, time-limited access tokens
  - Compatible with Vercel AI SDK

- ✅ **Session Management**
  - JWT-based sessions
  - Secure, httpOnly cookies
  - Database adapter support (Prisma)

- ✅ **React Integration**
  - `useAuth()` hook
  - `AuthProvider` context
  - Server-side session helpers

- ✅ **Security First**
  - CSRF protection for OAuth flows
  - Signed JWT tokens
  - Token revocation support
  - Input validation with Zod

- ✅ **Next.js 15+ App Router**
  - Server components
  - API routes
  - Streaming support

## Quick Start

### Installation

```bash
npm install auth-sdk
```

### Basic Setup

```typescript
// app/api/auth/config.ts
import { google, email } from 'auth-sdk';

export const authConfig = {
  provider: google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: 'http://localhost:3000/api/auth/callback/google',
  }),
  secret: process.env.AUTH_SECRET!,
};
```

### Environment Variables

```bash
AUTH_SECRET=your-secret-key-min-32-characters-long
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Usage Examples

### Google OAuth Sign In

```typescript
// app/api/auth/signin/google/route.ts
import { authenticate } from 'auth-sdk';
import { googleAuthConfig } from '../config';

export async function GET(request: Request) {
  const result = await authenticate(googleAuthConfig, request);

  if (result.redirectUrl) {
    return Response.redirect(result.redirectUrl);
  }
}
```

### Email Magic Link

```typescript
// app/api/auth/signin/email/route.ts
import { authenticate, email } from 'auth-sdk';

const emailConfig = {
  provider: email({
    server: 'smtp.gmail.com:587',
    from: 'noreply@yourdomain.com',
  }),
  secret: process.env.AUTH_SECRET!,
};

export async function POST(request: Request) {
  const { email } = await request.json();
  const result = await authenticate(emailConfig, request);

  return Response.json({ success: !result.error });
}
```

### Get Session

```typescript
// app/api/auth/session/route.ts
import { getSession } from 'auth-sdk';

export async function GET(request: Request) {
  const session = await getSession(request, process.env.AUTH_SECRET!);
  return Response.json({ session });
}
```

### React Hook

```tsx
'use client';

import { useAuth } from 'auth-sdk/hooks';

export function ProfileButton() {
  const { session, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!session) return <a href="/login">Sign In</a>;

  return (
    <div>
      <span>{session.user.email}</span>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## MCP (AI Agent Authentication)

Enable AI agents to authenticate as users with scoped, time-limited access.

### Create MCP Tools

```typescript
// app/api/mcp/route.ts
import { createMCPTools } from 'auth-sdk/mcp';

const mcpTools = createMCPTools({
  secret: process.env.AUTH_SECRET!,
});

export async function POST(request: Request) {
  const { tool, args } = await request.json();
  const result = await mcpTools[tool].execute(args);
  return Response.json(result);
}
```

### Agent Login

```typescript
// AI agent logs in as user
const response = await fetch('/api/mcp', {
  method: 'POST',
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

const { token } = await response.json();
```

### Use Agent Token

```typescript
// Protected route
import { verifyAgentToken } from 'auth-sdk';

export async function GET(request: Request) {
  const session = await verifyAgentToken(request, process.env.AUTH_SECRET!);

  if (!session || !session.scopes?.includes('read')) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json({ data: 'Protected data' });
}
```

### AI SDK Integration

```typescript
import { generateText } from 'ai';
import { createMCPTools } from 'auth-sdk/mcp';

const mcpTools = createMCPTools({ secret: process.env.AUTH_SECRET! });

const { text } = await generateText({
  model: openai('gpt-4'),
  tools: mcpTools,
  prompt: 'Login as user-123 with debug scope and check their activity'
});
```

## Database Adapter

Use Prisma adapter for session persistence.

```typescript
import { prismaAdapter } from 'auth-sdk/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const authConfig = {
  provider: google({ /* ... */ }),
  secret: process.env.AUTH_SECRET!,
  adapter: prismaAdapter(prisma), // Enable DB sessions
};
```

## API Reference

### Core Functions

#### `authenticate(config, request?, payload?)`

Main authentication function supporting OAuth, email, and MCP.

**Parameters:**
- `config: AuthConfig` - Authentication configuration
- `request?: Request` - HTTP request (for OAuth/email)
- `payload?: MCPLoginPayload` - MCP agent login payload

**Returns:** `Promise<AuthenticateResult>`

```typescript
interface AuthenticateResult {
  session?: Session;
  error?: string;
  redirectUrl?: string;
}
```

#### `getSession(request, secret)`

Get current session from request cookies.

**Parameters:**
- `request: Request` - HTTP request with cookies
- `secret: string` - JWT signing secret

**Returns:** `Promise<Session | null>`

#### `signOut(request, config)`

Sign out user and clear session.

**Parameters:**
- `request: Request` - HTTP request
- `config: AuthConfig` - Auth configuration

**Returns:** `Promise<void>`

#### `verifyAgentToken(request, secret)`

Verify MCP agent token from Authorization header.

**Parameters:**
- `request: Request` - HTTP request
- `secret: string` - JWT signing secret

**Returns:** `Promise<Session | null>`

### Providers

#### `google(options)`

Google OAuth provider.

```typescript
google({
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[]; // Default: ['openid', 'email', 'profile']
})
```

#### `email(options)`

Email magic link provider.

```typescript
email({
  server: string;      // 'smtp.gmail.com:587'
  from: string;        // 'noreply@example.com'
  auth?: {
    user: string;
    pass: string;
  };
})
```

### MCP Tools

#### `createMCPTools({ secret, adapter? })`

Create MCP tools for AI agents.

**Returns:**
- `agent_login` - Login as user with scoped access
- `get_session` - Verify and retrieve session info
- `revoke_token` - Invalidate a token

### React Hooks

#### `useAuth()`

Access session and auth methods in React components.

```typescript
const {
  session: Session | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
} = useAuth();
```

## Examples

See the [examples/nextjs-app-router](examples/nextjs-app-router) directory for a complete Next.js App Router example with:

- Google OAuth sign-in
- Email magic link sign-in
- Session management
- MCP agent authentication
- Protected routes
- React hooks usage

### Run Example

```bash
cd examples/nextjs-app-router
cp .env.example .env.local
# Edit .env.local with your credentials
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Architecture and implementation guide
- **[API-ROUTES.md](examples/nextjs-app-router/API-ROUTES.md)** - Complete API reference
- **[MCP-INTEGRATION.md](examples/nextjs-app-router/MCP-INTEGRATION.md)** - MCP integration guide
- **[MVP-Plan.md](docs/MVP-Plan.md)** - Implementation roadmap
- **[Implementation.md](docs/Implementation.md)** - Detailed implementation docs

## Architecture

```
auth-sdk/
├── src/
│   ├── core.ts                 # Main authentication functions
│   ├── providers/              # OAuth, Email providers
│   │   ├── google.ts
│   │   ├── email.ts
│   │   └── types.ts
│   ├── adapters/               # Database adapters
│   │   ├── prisma.ts
│   │   └── types.ts
│   ├── mcp/                    # MCP tools for AI agents
│   │   └── mcp.ts
│   ├── hooks/                  # React hooks
│   │   └── useAuth.tsx
│   └── utils/                  # Utilities
│       ├── jwt.ts
│       ├── csrf.ts
│       ├── oauth.ts
│       ├── cookie.ts
│       └── tokens.ts
└── examples/
    └── nextjs-app-router/      # Complete Next.js example
```

## Security

### Best Practices

1. **Use strong secrets**: Min 32 characters for `AUTH_SECRET`
2. **Enable HTTPS**: Always use HTTPS in production
3. **Set secure cookies**: httpOnly, secure, sameSite flags
4. **Validate inputs**: All inputs validated with Zod
5. **Short token lifetimes**: MCP tokens expire in 15 minutes
6. **Scope-based access**: Use minimal scopes for agents
7. **Token revocation**: Revoke tokens after use

### Production Checklist

- [ ] Set strong `AUTH_SECRET` (min 32 chars)
- [ ] Use production OAuth credentials
- [ ] Configure production SMTP server
- [ ] Enable HTTPS/TLS
- [ ] Add rate limiting
- [ ] Set up error monitoring
- [ ] Configure database adapter
- [ ] Review security settings
- [ ] Add audit logging
- [ ] Test all auth flows

## TypeScript Support

Fully typed with TypeScript 5.9+. All functions and interfaces are exported with types.

```typescript
import type {
  AuthConfig,
  Session,
  Provider,
  Adapter,
  MCPLoginPayload,
  AuthenticateResult,
} from 'auth-sdk';
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Development

```bash
# Clone repository
git clone https://github.com/yourusername/auth-sdk.git
cd auth-sdk

# Install dependencies
npm install

# Build
npm run build

# Run tests (when available)
npm test

# Lint
npm run eslint
```

## Roadmap

### Completed ✅
- [x] Core authentication system
- [x] Google OAuth provider
- [x] Email magic link provider
- [x] Session management
- [x] MCP tools for AI agents
- [x] React hooks
- [x] Prisma adapter
- [x] Next.js example app
- [x] Comprehensive documentation

### Future 🚀
- [ ] Additional OAuth providers (GitHub, Microsoft, Twitter)
- [ ] Credentials provider (username/password)
- [ ] Multi-factor authentication (MFA/2FA)
- [ ] JWT refresh token rotation
- [ ] Redis adapter for sessions
- [ ] Rate limiting middleware
- [ ] Webhook support
- [ ] Admin UI for session management
- [ ] Vitest unit tests

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Credits

Created with ♥ by [Lucas Oliveira](mailto:jucas.oliveira@gmail.com)

Inspired by:
- [NextAuth.js](https://next-auth.js.org/) - Authentication patterns
- [Vercel AI SDK](https://sdk.vercel.ai/) - API design philosophy
- [Model Context Protocol](https://modelcontextprotocol.io) - AI agent integration

## Support

- 📖 [Documentation](CLAUDE.md)
- 💬 [GitHub Issues](https://github.com/yourusername/auth-sdk/issues)
- 📧 [Email](mailto:jucas.oliveira@gmail.com)

---

**Made with TypeScript and Next.js** • [Documentation](CLAUDE.md) • [Examples](examples/nextjs-app-router)
