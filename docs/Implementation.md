# Auth SDK Implementation Document

## Overview

The Auth SDK is a lightweight, modular authentication library for Next.js applications, designed to provide a seamless and developer-friendly authentication workflow. Inspired by Vercel's AI SDK, which abstracts complex AI model integrations into a unified API, Auth SDK aims to do the same for authentication—reducing bloat seen in libraries like NextAuth.js while emphasizing flexibility, security, and modern Next.js features.

Key motivations:

- **Bloat Reduction**: Unlike NextAuth.js, which bundles extensive features leading to larger bundle sizes, Auth SDK uses modular imports (e.g., import only the Google provider if needed), targeting <50KB total bundle size.
- **Unified API**: High-level functions like `authenticate()` and `getSession()` work across providers, similar to `generateText()` in the AI SDK.
- **Next.js 16 Integration**: Leverages new features like Cache Components for session caching, proxy.ts for middleware, and Next.js DevTools MCP (Model Context Protocol) for AI-agent delegated login.
- **Security and Flexibility**: Built-in CSRF, JWT/cookies, and optional database adapters. Supports serverless environments without forcing a database.
- **AI-Agent Support**: Extends MCP to allow AI agents (e.g., via Vercel AI SDK) to log in on behalf of users for scoped, delegated actions like debugging or automation.

This document outlines the full implementation, including architecture, code examples, setup, and usage. The SDK is open-source friendly, with a focus on TypeScript ergonomics and community extensibility.

## Design Principles

- **Modular and Lightweight**: Import only needed components to minimize dependencies.
- **Framework-Agnostic Hooks**: Works with Next.js App Router, but extensible to React/Node.js.
- **Opt-In Features**: Caching, MCP, and adapters are configurable; defaults to dynamic, request-time execution aligning with Next.js 16's Cache Components model.
- **Security Defaults**: Signed cookies/JWT, CSRF validation, and short-lived tokens for MCP.
- **Developer Experience**: Type-safe APIs, hooks like `useAuth()`, templates for quick starts, and an `auth.txt` file for LLM querying (mirroring AI SDK's `llms.txt`).
- **MCP-Enabled Delegation**: AI agents can impersonate users via scoped tokens, integrating with Next.js 16's MCP tools for context-aware auth.

## Project Setup

### Dependencies

- Core: TypeScript, esbuild (for bundling), vitest (testing).
- Runtime: `jsonwebtoken` (for JWT), `@ai-sdk/next` and `@ai-sdk/core` (for MCP tools).
- Optional: `cookies-next` (cookie handling), adapters like Prisma.

Install:

```bash
npm init -y
npm install typescript esbuild vitest @types/node jsonwebtoken @ai-sdk/next @ai-sdk/core
npx tsc --init
```

### Directory Structure

```
auth-sdk/
├── src/
│   ├── core.ts          # Unified API (authenticate, getSession, etc.)
│   ├── providers/       # Modular: google.ts, email.ts, etc.
│   ├── hooks/           # useAuth.ts
│   ├── adapters/        # Optional: prisma.ts
│   ├── mcp/             # MCP tools: mcp.ts
│   └── utils/           # jwt.ts, csrf.ts, oauth.ts
├── templates/           # Next.js starters
├── auth.txt             # Docs for LLM querying
├── next.config.ts       # Next.js config
└── package.json
```

### Next.js Config (next.config.ts)

Enable Next.js 16 features:

```typescript
const nextConfig = {
  cacheComponents: true, // For session caching
  experimental: {
    mcpServer: true, // Enables MCP for dev agents
  },
};

export default nextConfig;
```

## Core API (src/core.ts)

The core provides unified functions for auth flows.

```typescript
import jwt from 'jsonwebtoken';
import type { Provider } from './providers/types';
import { createMCPTools } from './mcp/mcp'; // MCP integration

export interface AuthConfig {
  provider: Provider;
  secret: string;
  adapter?: Adapter; // Optional DB for sessions
  mcp?: { enabled: boolean; scopes?: string[] }; // MCP config
}

export interface Session {
  user: { id: string; email: string; name?: string };
  expires: Date;
  token?: string; // For MCP agents
  type?: 'standard' | 'mcp-agent';
}

export interface MCPLoginPayload {
  userId: string;
  scopes: string[];
  agentId: string;
  expiresIn: string; // e.g., '15m'
}

export async function authenticate(config: AuthConfig, payload?: MCPLoginPayload) {
  if (payload && config.mcp?.enabled) {
    // MCP Agent Login
    const token = jwt.sign(
      { userId: payload.userId, scopes: payload.scopes, agentId: payload.agentId },
      config.secret,
      { expiresIn: payload.expiresIn }
    );
    return { session: { user: { id: payload.userId }, token, type: 'mcp-agent' } };
  }
  // Standard auth logic (OAuth flow, etc.)
  // Handle sign-in, validate CSRF...
  return { session: /* ... */ };
}

export async function getSession(req: Request): Promise<Session | null> {
  // Parse cookies/JWT, validate
  // Use Next.js 16 Cache Components for opt-in caching
  return /* session */;
}

export async function signOut() {
  // Clear session, revoke tokens
}

export async function verifyAgentToken(req: Request, secret: string): Promise<Session | null> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, secret) as any;
    return { user: { id: decoded.userId }, scopes: decoded.scopes, agentId: decoded.agentId };
  } catch {
    return null;
  }
}

// Export providers and MCP tools
export { google } from './providers/google';
export { email } from './providers/email';
export const mcpTools = createMCPTools({ secret: process.env.AUTH_SECRET });
```

## Providers (src/providers/)

Modular functions returning provider configs.

### Google OAuth (google.ts)

```typescript
import { OAuthProvider } from "../utils/oauth";

export function google(options: { clientId: string; clientSecret: string }) {
  return {
    type: "oauth",
    authorizeUrl: "https://accounts.google.com/o/oauth2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    ...options,
    async getUser(token) {
      // Fetch profile
    },
  };
}
```

### Email/Passwordless (email.ts)

```typescript
export function email(options: { server: string; from: string }) {
  return {
    type: "email",
    async sendMagicLink(email: string) {
      // Send link (e.g., via nodemailer)
    },
    async verify(token: string) {
      // Validate
    },
    ...options,
  };
}
```

## Hooks (src/hooks/useAuth.ts)

Client-side session management.

```typescript
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSession, authenticate, signOut } from '../core';
import { generateText } from 'ai'; // For MCP tool calls
import { mcpTools } from '../core'; // MCP tools

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  useEffect(() => {
    getSession().then(setSession);
  }, []);
  const mcpSignIn = useCallback(async (userId: string, scopes: string[]) => {
    const { text } = await generateText({
      model: /* your AI model */,
      tools: [mcpTools.agent_login],
      prompt: `Login as ${userId} with scopes ${scopes.join(',')}`,
    });
    // Parse tool result for token
    setSession(/* updated session */);
  }, []);
  return (
    <AuthContext.Provider value={{ session, signIn: mcpSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

## Adapters (src/adapters/)

Optional for DB sessions.

### Prisma Adapter (prisma.ts)

```typescript
export function prismaAdapter(client) {
  return {
    createSession: async (data) => client.session.create({ data }),
    // getSession, deleteSession, etc.
  };
}
```

## MCP Integration (src/mcp/mcp.ts)

AI-agent delegated login using Next.js 16 MCP and Vercel AI SDK tools.

```typescript
import { createTool } from "ai"; // AI SDK
import { authenticate } from "../core";
import { z } from "zod"; // For schema (optional)

export function createMCPTools({ secret }: { secret: string }) {
  return {
    agent_login: createTool({
      description: "Login as user for scoped agent access",
      parameters: z.object({
        userId: z.string(),
        scopes: z.array(z.string()),
        agentId: z.string(),
      }),
      execute: async ({ userId, scopes, agentId }) => {
        const result = await authenticate(
          { secret, mcp: { enabled: true } },
          { userId, scopes, agentId, expiresIn: "15m" }
        );
        return result.session
          ? { success: true, token: result.session.token }
          : { success: false };
      },
    }),
    // Additional: get_session, revoke_token
  };
}
```

Expose via route:

```typescript
// app/mcp/route.ts
import { mcpTools } from "auth-sdk";
// Use AI SDK or custom handler for MCP transport (SSE/WebSocket)
```

## Security and Sessions

- **Tokens/Cookies**: HTTP-only, signed with `secret`. Use JWT for stateless.
- **CSRF**: Auto-validate on POST.
- **MCP Security**: Short-lived tokens (15m), scoped access, revocation via `revokeAgentToken`. Log actions.
- **Middleware (proxy.ts)**: Use Next.js 16's `proxy.ts` for auth checks.

  ```typescript
  // proxy.ts
  import { verifyAgentToken } from "auth-sdk";
  import { NextRequest } from "next/server";

  export default async function proxy(req: NextRequest) {
    const session = await verifyAgentToken(req, process.env.AUTH_SECRET);
    if (!session) return new Response("Unauthorized", { status: 401 });
    // Proceed
  }
  ```

## Usage Examples

### Standard Login (app/api/auth/route.ts)

```typescript
import { authenticate, google } from "auth-sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const result = await authenticate({
    provider: google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    secret: process.env.AUTH_SECRET,
  });
  // Set cookies, redirect
}
```

### MCP Agent Login

Prompt an AI agent: "Login as user-123 with scopes ['debug'] to check errors."

- Agent calls `agent_login` tool, gets token.
- Use in headers for subsequent requests.

### Client Page (app/page.tsx)

```tsx
"use client";
import { useAuth } from "auth-sdk";

export default function Home() {
  const { session, signIn } = useAuth();
  if (session)
    return (
      <div>
        Signed in as {session.user.email}{" "}
        <button onClick={signOut}>Sign out</button>
      </div>
    );
  return (
    <button onClick={() => signIn("user-123", ["debug"])}>Agent Login</button>
  );
}
```

Wrap app:

```tsx
// app/layout.tsx
import { AuthProvider } from "auth-sdk";

export default function RootLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
```

## Testing and Extras

- **Unit Tests**: Mock providers with vitest.
- **Templates**: Starters for Next.js via `create-next-app`.
- **Docs (auth.txt)**: Markdown for LLM prompts:
  ```
  Documentation:
  {full docs}
  ---
  Based on above, answer: {question}
  ```
- **Deployment**: Works with Vercel; use Cache Components for prod caching.

## Future Improvements

- Custom providers/adapters.
- Integration with React 19.2 features (e.g., View Transitions for auth UI).
- Community feedback via GitHub.

This implementation provides a robust, Next.js 16-aligned auth solution. For contributions, publish to npm as `@your-org/auth-sdk`.
