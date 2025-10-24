# MVP Implementation Plan

This document outlines the step-by-step plan to build a Minimum Viable Product (MVP) of the auth-sdk with Google OAuth and magic link authentication support.

## Overview

The MVP will deliver a functional authentication SDK that supports:
- Google OAuth 2.0 authentication
- Email magic link (passwordless) authentication
- Session management with JWT/cookies
- React hooks for client-side integration
- Database adapter pattern (Prisma example)
- Next.js integration examples

## Implementation Phases

### Phase 1: Foundation

#### Task 1: Set up core TypeScript infrastructure and project dependencies
- Install runtime dependencies:
  - `jsonwebtoken` - JWT signing and verification
  - `nodemailer` - Email sending for magic links
  - `cookie` - Cookie parsing and serialization
  - `crypto` - Token generation
- Install type definitions (`@types/jsonwebtoken`, `@types/nodemailer`, `@types/cookie`)
- Verify TypeScript configuration aligns with project needs
- Ensure build pipeline works correctly

#### Task 2: Implement core authentication types and interfaces in src/core.ts
- Define `AuthConfig` interface with provider, secret, adapter options
- Define `Session` interface with user data and expiration
- Define `Provider` interface for OAuth and email providers
- Define `Adapter` interface for database operations
- Export type definitions for external consumers

#### Task 3: Create utility modules (JWT, CSRF, OAuth helpers)
- `src/utils/jwt.ts` - Sign and verify JWT tokens with expiration
- `src/utils/csrf.ts` - Generate and validate CSRF tokens
- `src/utils/oauth.ts` - Generic OAuth 2.0 flow implementation (authorize, token exchange, userInfo fetch)
- `src/utils/cookie.ts` - Cookie serialization with secure defaults (httpOnly, secure, sameSite)
- `src/utils/tokens.ts` - Cryptographically secure random token generation

### Phase 2: Providers

#### Task 4: Implement Google OAuth provider in src/providers/google.ts
- Create `google()` factory function accepting `clientId` and `clientSecret`
- Configure OAuth endpoints:
  - Authorization URL: `https://accounts.google.com/o/oauth2/auth`
  - Token URL: `https://oauth2.googleapis.com/token`
  - UserInfo URL: `https://www.googleapis.com/oauth2/v3/userinfo`
- Implement `authorize()` method to generate OAuth URL with CSRF state
- Implement `callback()` method to exchange code for access token
- Implement `getUser()` method to fetch user profile from Google
- Add proper scopes (email, profile)
- Handle error cases (invalid code, network errors)

#### Task 5: Implement email magic link provider in src/providers/email.ts
- Create `email()` factory function accepting `server` and `from` config
- Implement `sendMagicLink()` method:
  - Generate secure token
  - Store token with expiration (database or in-memory)
  - Send email with magic link URL
- Implement `verify()` method:
  - Validate token from URL
  - Check expiration
  - Return user data if valid
- Use nodemailer for email delivery
- Support custom email templates

### Phase 3: Core Logic

#### Task 6: Build core authentication functions (authenticate, getSession, signOut)
- Implement `authenticate(config, request)`:
  - Route to appropriate provider based on config
  - Handle OAuth callback flow
  - Handle magic link verification flow
  - Validate CSRF tokens
  - Create session after successful authentication
  - Sign JWT and set secure cookies
  - Return `{ session, error }` object
- Implement `getSession(request)`:
  - Parse cookies from request
  - Verify JWT signature
  - Check expiration
  - Optionally revalidate with adapter
  - Return `Session | null`
- Implement `signOut(request, response)`:
  - Clear session cookies
  - Revoke tokens (if adapter provided)
  - Handle redirect after sign out

### Phase 4: React Integration

#### Task 7: Create React hooks (useAuth) for client-side session management
- Create `AuthContext` for sharing session state
- Implement `AuthProvider` component:
  - Fetch session on mount via `getSession()`
  - Store session in React state
  - Provide `session`, `signIn`, `signOut` methods
  - Auto-revalidate session periodically
- Implement `useAuth()` hook:
  - Return context value
  - Throw error if used outside provider
- Add TypeScript types for hooks
- Support loading states

### Phase 5: Database & Examples

#### Task 8: Set up basic Prisma adapter for session storage
- Create `prismaAdapter(client)` factory function
- Implement adapter methods:
  - `createSession(data)` - Store new session
  - `getSession(sessionToken)` - Retrieve session
  - `updateSession(sessionToken, data)` - Update session
  - `deleteSession(sessionToken)` - Remove session
- Add user and account CRUD operations
- Include Prisma schema example in comments/docs

#### Task 9: Create example Next.js API routes for authentication flows
- Create example route handlers:
  - `app/api/auth/[...auth]/route.ts` - Catch-all route for auth operations
  - Handle `/auth/signin/google` - Initiate Google OAuth
  - Handle `/auth/signin/email` - Send magic link
  - Handle `/auth/callback/google` - OAuth callback
  - Handle `/auth/verify` - Verify magic link token
  - Handle `/auth/signout` - Sign out user
  - Handle `/auth/session` - Get current session
- Show how to configure AuthConfig
- Demonstrate error handling
- Include TypeScript examples

### Phase 6: Testing & Documentation

#### Task 10: Add test setup with Vitest and write basic unit tests
- Configure Vitest in `vitest.config.ts`
- Write unit tests for:
  - JWT signing and verification
  - CSRF token generation and validation
  - OAuth flow helpers
  - Provider factory functions
  - Core authentication functions (mocked providers)
  - Session management
- Add test script to package.json
- Aim for >80% code coverage on core modules

#### Task 11: Update CLAUDE.md with implementation progress and usage examples
- Document completed features
- Add usage examples:
  - Basic setup with Google OAuth
  - Basic setup with email magic link
  - Next.js App Router integration
  - React client-side usage
- Document testing approach
- Add troubleshooting section
- Link to example implementations

## Success Criteria

The MVP is considered complete when:
- ✅ Users can authenticate with Google OAuth
- ✅ Users can authenticate with email magic links
- ✅ Sessions are properly managed with JWT/cookies
- ✅ React hooks work in client components
- ✅ Database sessions can be stored via Prisma adapter
- ✅ Example Next.js routes demonstrate integration
- ✅ Core functions have unit test coverage
- ✅ Documentation includes usage examples

## Architecture Principles

Throughout implementation, maintain these principles from the Implementation.md:

1. **Security First**
   - Always use CSRF protection for OAuth flows
   - Sign all tokens with cryptographic keys
   - Use secure cookie settings (httpOnly, secure, sameSite)
   - Validate all inputs and tokens

2. **Developer Experience**
   - Type-safe APIs with full TypeScript support
   - Clear, descriptive error messages
   - Sensible defaults with escape hatches
   - Tree-shakeable modules

3. **Framework Agnostic Core**
   - Core logic works with any Node.js framework
   - Framework-specific adapters (Next.js examples) separate
   - Standard Request/Response interfaces

4. **Modular Design**
   - Each provider is independent
   - Adapters are optional
   - Utilities are reusable
   - Easy to extend with new providers

## Next Steps After MVP

After completing the MVP, consider:
- Additional OAuth providers (GitHub, Microsoft, etc.)
- Credentials provider (username/password)
- Multi-factor authentication (MFA/2FA)
- JWT refresh token rotation
- Rate limiting for magic links
- Webhook support for events
- Admin UI for session management
- Production hardening and security audit
