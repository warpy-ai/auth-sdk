# Changelog - v0.0.22

## [0.0.22] - 2025-11-22

### 🎉 Added

#### Custom Route Paths
- **Custom Route Paths**: Configure custom authentication endpoints to match your application's routing conventions. Use `{provider}` placeholder for dynamic provider routes. See [Custom Route Paths Guide](https://warpy.co/docs/guides/custom-route-paths).
  - Customize `session`, `signOut`, `signIn`, and `callback` endpoints
  - Support for RESTful API patterns, simplified paths, and custom conventions
  - Full TypeScript support with type-safe configuration

#### Framework Adapters
- **Express Adapter**: Full Express.js integration with middleware pattern and route registration. See [Express Adapter Guide](https://warpy.co/docs/guides/express-adapter).
  - `registerAuthRoutes()` for automatic route registration
  - `requireAuth` middleware for protecting routes
  - Complete example project included

- **Hono Adapter**: Multi-runtime support (Node/Deno/Bun/Cloudflare) with Hono framework integration. See [Hono Adapter Guide](https://warpy.co/docs/guides/hono-adapter).
  - `createAuthHandler()` for route handling
  - `requireAuth` guard function
  - Works across all Hono-supported runtimes

- **Node.js Adapter**: Pure Node.js HTTP adapter with zero framework dependencies. See [Node.js Adapter Guide](https://warpy.co/docs/guides/nodejs-adapter).
  - Framework-agnostic HTTP handling
  - Perfect for custom server implementations
  - Minimal dependencies

- **Remix Adapter**: Full-stack Remix framework integration with loader/action support. See [Remix Example](https://github.com/warpy-ai/auth-sdk/tree/main/examples/remix-example).
  - `createAuthLoader()` for server-side session handling
  - `createAuthAction()` for authentication actions
  - Full Remix route integration

- **Laravel Adapter**: PHP Laravel framework integration with guards and middleware. See [Laravel Adapter PR](https://github.com/warpy-ai/auth-sdk/pull/28).
  - Laravel guards and middleware
  - Service provider integration
  - Full PHP type support

#### Documentation
- **Comprehensive Documentation**: 200+ pages covering all features, providers, guides, examples, and API references
  - Getting started guides (installation, quickstart, environment setup, first auth flow)
  - Provider documentation for all 15+ OAuth providers
  - Framework adapter guides (Express, Hono, Node.js, Next.js Proxy)
  - Security best practices guide
  - MCP integration documentation
  - Comprehensive API reference
  - Example projects documentation

#### Examples
- **Production Examples**: Complete working examples for multiple frameworks
  - Express example with complete authentication flow
  - Hono example with multi-runtime support
  - Node.js example with pure HTTP implementation
  - Remix example with full-stack integration
  - Next.js CAPTCHA example with custom routes demonstration

### ✨ Enhanced

- **Email Templates**: Improved Magic Link and 2FA email templates with better styling and responsiveness
  - Enhanced visual design
  - Better mobile responsiveness
  - Improved accessibility

- **Type Safety**: Enhanced TypeScript types for all adapters and configuration options
  - Better autocomplete support
  - More accurate type inference
  - Comprehensive type coverage

- **Error Handling**: Improved error messages and handling across all adapters
  - More descriptive error messages
  - Better error context
  - Improved debugging experience

### 📚 Documentation

- Added getting started guides (installation, quickstart, environment setup, first auth flow)
- Added provider documentation for all 15+ OAuth providers
- Added framework adapter guides (Express, Hono, Node.js, Next.js Proxy)
- Added security best practices guide
- Added MCP integration documentation
- Added comprehensive API reference
- Added example projects documentation
- Added troubleshooting guides

### 🔧 Examples

- Added Express example with complete authentication flow
- Added Hono example with multi-runtime support
- Added Node.js example with pure HTTP implementation
- Added Remix example with full-stack integration
- Added Next.js CAPTCHA example with custom routes demonstration

### 🐛 Bug Fixes

- Fixed type definitions for custom route paths
- Improved error handling in adapter implementations
- Fixed email template rendering issues

### 🔄 Migration Guide

#### Upgrading from v0.0.21

No breaking changes! Custom route paths are opt-in. Your existing code will continue to work with default routes.

To use custom routes:

```typescript
// Before (default routes)
const handler = authMiddleware(config, {
  basePath: "/api/auth",
});

// After (custom routes - optional)
const handler = authMiddleware(config, {
  basePath: "/api/auth",
  routes: {
    session: "/api/user/me",
    signOut: "/api/auth/logout",
    signIn: "/login/{provider}",
    callback: "/auth/verify/{provider}",
  },
});
```

### 📦 Dependencies

- No new dependencies added
- Updated internal type definitions
- Improved compatibility with latest TypeScript versions

### 🔗 Links

- [Full Documentation](https://warpy.co/docs)
- [Custom Route Paths Guide](https://warpy.co/docs/guides/custom-route-paths)
- [GitHub Repository](https://github.com/warpy-ai/auth-sdk)
- [npm Package](https://www.npmjs.com/package/@warpy-auth-sdk/core)

---

**Full Changelog**: [v0.0.21...v0.0.22](https://github.com/warpy-ai/auth-sdk/compare/v0.0.21...v0.0.22)






