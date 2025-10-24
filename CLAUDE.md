# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an authentication SDK for Node.js and React applications, providing a flexible authentication system with support for multiple providers (OAuth, email magic links) and database adapters.

## Development Commands

### Building and Development

- `bun run build` - Compile TypeScript to JavaScript (outputs to `dist/` and type definitions to `typings/`)
- `bun  dev` - Run development server with hot reload using ts-node-dev
- `bun start` - Run the compiled application from dist/

### Code Quality

- `bun run eslint` - Run ESLint on all TypeScript files in src/
- Prettier is configured and enforced via ESLint (see `.prettierrc` for config: single quotes, 2-space tabs, semicolons)

## Architecture

### Core Authentication System

The SDK is built around a provider-based architecture:

1. **Core Module** ([src/core.ts](src/core.ts)) - Central authentication logic
   - `AuthConfig` interface: Main configuration accepting a provider, secret, and optional adapter
   - `authenticate()`: Handles sign-in flow, CSRF validation
   - `getSession()`: Parses and validates session cookies/JWT
   - `signOut()`: Clears sessions and revokes tokens

2. **Provider System** ([src/providers/](src/providers/))
   - Providers are factory functions that return configuration objects
   - **OAuth Provider** ([google.ts](src/providers/google.ts)): OAuth 2.0 flow with authorize/token/userInfo URLs
   - **Email Provider** ([email.ts](src/providers/email.ts)): Magic link authentication via email
   - Each provider exports a function that accepts credentials and returns a provider object with `type` and auth methods

3. **Adapter System** ([src/adapters/](src/adapters/))
   - Optional database adapters for session persistence
   - [prisma.ts](src/adapters/prisma.ts): Example adapter for Prisma ORM
   - Adapters implement methods like `createSession()` to interface with databases

4. **React Integration** ([src/hooks/useAuth.ts](src/hooks/useAuth.ts))
   - `AuthProvider`: Context provider for managing session state
   - `useAuth()`: Hook for accessing session and auth methods in components
   - Auto-revalidates session on mount

### Documentation

- `/docs`: Directory containing the documentation for the project , and where we add all project documentation.

### TypeScript Configuration

- **Target**: ES6 with CommonJS modules
- **Strict Mode**: Enabled with strict null checks, no implicit any/this/returns
- **Output**: Compiled JS to `dist/`, type declarations to `typings/`
- **Unused code detection**: Enabled for locals and parameters

### Code Style

- ESLint enforces TypeScript recommended rules with Prettier integration
- Semicolons required, no var allowed, single quotes preferred
- Node and Mocha environments configured

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

- Runs on pushes/PRs to master branch
- **ESLint job**: Lints code with `bun run eslint`
- **Publish job**: Builds and publishes prerelease versions to bun with beta tag
  - Versions tagged with branch name and commit SHA

## Package Structure

- Published files: `dist/` and `typings/` directories only
- Entry point: `dist/index.js`
- Type definitions: `types/index.d.ts`
