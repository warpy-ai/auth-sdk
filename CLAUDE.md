# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an authentication SDK for Node.js and React applications, providing a flexible authentication system with support for multiple providers (OAuth, email magic links), database adapters, and **MCP (Model Context Protocol)** for AI agent-delegated authentication.

## Development Commands

### Building and Development
- `npm run build` - Compile TypeScript to JavaScript (outputs to `dist/` and type definitions to `typings/`)
- `npm run dev` - Run development server with hot reload using ts-node-dev
- `npm start` - Run the compiled application from dist/

### Code Quality
- `npm run eslint` - Run ESLint on all TypeScript files in src/
- Prettier is configured and enforced via ESLint (see `.prettierrc` for config: single quotes, 2-space tabs, semicolons)

## Architecture

### Core Authentication System

The SDK is built around a provider-based architecture with MCP integration:

1. **Core Module** ([src/core.ts](src/core.ts)) - Central authentication logic
   - `AuthConfig` interface: Main configuration accepting a provider, secret, optional adapter, and MCP config
   - `authenticate()`: Handles sign-in flow (OAuth, email, **MCP agent login**)
   - `getSession()`: Parses and validates session cookies/JWT
   - `signOut()`: Clears sessions and revokes tokens
   - `verifyAgentToken()`: Validates MCP agent tokens for scoped access
   - `createSessionCookie()` / `clearSessionCookie()`: Cookie management helpers

2. **Provider System** ([src/providers/](src/providers/))
   - Providers are factory functions that return configuration objects
   - **OAuth Provider** ([google.ts](src/providers/google.ts)): Full OAuth 2.0 flow implementation
   - **Email Provider** ([email.ts](src/providers/email.ts)): Magic link authentication via nodemailer
   - Type definitions in [types.ts](src/providers/types.ts)

3. **Utility Modules** ([src/utils/](src/utils/))
   - [jwt.ts](src/utils/jwt.ts): JWT signing and verification with jsonwebtoken
   - [csrf.ts](src/utils/csrf.ts): CSRF token generation and validation (in-memory store)
   - [oauth.ts](src/utils/oauth.ts): Generic OAuth 2.0 flow implementation
   - [cookie.ts](src/utils/cookie.ts): Cookie serialization with secure defaults
   - [tokens.ts](src/utils/tokens.ts): Magic link token generation and verification

4. **MCP Integration** ([src/mcp/mcp.ts](src/mcp/mcp.ts)) - **AI Agent Delegated Authentication**
   - `createMCPTools()`: Factory function that creates AI SDK-compatible tools
   - **agent_login**: Allows AI agents to log in as users with scoped access (returns short-lived JWT)
   - **get_session**: Verifies and retrieves session information from a token
   - **revoke_token**: Invalidates agent tokens immediately
   - Token revocation list (in-memory, should use Redis/DB in production)
   - Tools are compatible with Vercel AI SDK for LLM function calling

5. **Adapter System** ([src/adapters/](src/adapters/))
   - Optional database adapters for session persistence
   - [prisma.ts](src/adapters/prisma.ts): Full Prisma adapter with session, user, and account CRUD
   - Type definitions in [types.ts](src/adapters/types.ts)

6. **React Integration** ([src/hooks/useAuth.tsx](src/hooks/useAuth.tsx))
   - `AuthProvider`: Context provider for managing session state in React apps
   - `useAuth()`: Hook for accessing session, loading state, and auth methods
   - `getServerSession()`: Server-side session helper
   - Auto-fetches session from `/api/auth/session` endpoint

### MCP (Model Context Protocol) Details

The auth-sdk implements **AI agent-delegated authentication** using MCP:

**Use Case**: Allow AI agents (like Claude, ChatGPT, or custom LLMs) to log in on behalf of users for scoped, time-limited actions (e.g., debugging, automation, read-only access).

**Security Model**:
- Short-lived tokens (default 15 minutes)
- Scope-based access control (e.g., `["debug", "read"]`)
- Token revocation support
- Separate token type (`mcp-agent`) from standard sessions

**Integration**:
1. Create MCP tools with `createMCPTools({ secret, adapter })`
2. Pass tools to AI SDK's `generateText()` or similar functions
3. AI agent calls `agent_login` to get a JWT token
4. Agent uses token in `Authorization: Bearer <token>` header
5. Verify agent tokens with `verifyAgentToken(request, secret)`

**Example**:
```typescript
import { createMCPTools } from 'auth-sdk';
import { generateText } from 'ai';

const mcpTools = createMCPTools({ secret: process.env.AUTH_SECRET });

const { text } = await generateText({
  model: yourModel,
  tools: mcpTools,
  prompt: 'Login as user-123 with debug scope',
});
```

### Documentation

- `/docs`: Directory containing the documentation for the project, including:
  - [Implementation.md](docs/Implementation.md): Full implementation details and architecture
  - [MVP-Plan.md](docs/MVP-Plan.md): Step-by-step implementation plan

### TypeScript Configuration

- **Target**: ES6 with CommonJS modules
- **JSX**: React (for hooks)
- **Strict Mode**: Enabled with strict null checks
- **Output**: Compiled JS to `dist/`, type declarations to `typings/`
- **ESModule Interop**: Enabled for better module compatibility

### Code Style

- ESLint enforces TypeScript recommended rules with Prettier integration
- Semicolons required, no var allowed, single quotes preferred
- Node and Mocha environments configured

## Implementation Status

### ✅ Completed (MVP Ready)
- Core authentication functions (authenticate, getSession, signOut)
- Google OAuth provider with full OAuth 2.0 flow
- Email magic link provider with nodemailer
- JWT/cookie-based session management
- CSRF protection for OAuth flows
- MCP tools (agent_login, get_session, revoke_token)
- Prisma adapter with full CRUD operations
- React useAuth hook for client-side integration
- Utility modules (JWT, CSRF, OAuth, cookies, tokens)

### 🚧 Pending
- Next.js API route examples
- MCP route handler for exposing tools to AI agents
- Vitest test configuration and unit tests
- Additional OAuth providers (GitHub, Microsoft, etc.)
- Production-ready token storage (Redis/DB instead of in-memory)

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):
- Runs on pushes/PRs to master branch
- **ESLint job**: Lints code with `npm run eslint`
- **Publish job**: Builds and publishes prerelease versions to npm with beta tag
  - Versions tagged with branch name and commit SHA

## Package Structure

- Published files: `dist/` and `typings/` directories only
- Entry point: `dist/index.js`
- Type definitions: `types/index.d.ts`

## Key Dependencies

- **jsonwebtoken**: JWT signing and verification
- **cookie**: Cookie parsing and serialization
- **nodemailer**: Email sending for magic links
- **ai** (Vercel AI SDK): MCP tool integration
- **zod**: Schema validation for MCP tools
- **react**: React hooks for client integration
