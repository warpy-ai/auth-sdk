# Ready-to-Post Tweets

## Launch Announcement

```
🎉 v0.0.22 is here! Custom route paths for Next.js auth

Now you can match ANY routing convention:
• RESTful APIs: /api/user/session
• Simplified: /login/{provider}
• Custom: /auth/verify/{provider}

Full flexibility, zero compromises.

🔗 https://warpy.co/docs/guides/custom-route-paths

#NextJS #Auth #TypeScript
```

## Framework Adapter Thread (Part 1)

```
🧵 One SDK, Six Frameworks

We just shipped adapters for:
1️⃣ Express - The classic Node.js framework
2️⃣ Hono - Ultra-fast, multi-runtime
3️⃣ Remix - Full-stack React framework
4️⃣ Node.js - Zero dependencies, pure HTTP
5️⃣ Laravel - PHP integration
6️⃣ Fastify - High-performance Node.js

Same auth logic. Different adapters. 🚀
```

## Framework Adapter Thread (Part 2)

```
[Thread continuation]

Here's the same auth flow in different frameworks:

Express:
const { registerAuthRoutes, requireAuth } = require('@warpy-auth-sdk/core/adapters/express');

Hono:
import { createAuthHandler, requireAuth } from '@warpy-auth-sdk/core/adapters/hono';

Remix:
import { createAuthLoader, createAuthAction } from '@warpy-auth-sdk/core/adapters/remix';

Same security. Same features. Different syntax. ✨
```

## Custom Routes Tip

```
💡 Pro tip: Custom auth routes in Next.js

Instead of:
/api/auth/signin/google

Use:
/login/google

Just configure routes in authMiddleware:

routes: {
  signIn: "/login/{provider}",
  callback: "/auth/verify/{provider}"
}

Matches your app's routing convention perfectly! ✨
```

## Security Features

```
🔒 Security-first authentication

@warpy-auth-sdk/core includes:
✅ PKCE for OAuth (RFC 7636)
✅ CSRF protection
✅ CAPTCHA support (4 providers)
✅ 2FA with email codes
✅ JWT session management

All out of the box. Zero config. 🛡️
```

## Documentation Announcement

```
📚 200+ pages of documentation

We just shipped comprehensive docs covering:
• Getting started guides
• Provider setup (15+ providers)
• Framework adapters (6 frameworks)
• Security best practices
• MCP integration
• API reference

Everything you need to build secure auth. 📖

🔗 https://warpy.co/docs
```

## Quick Start

```
⚡ Get started in 5 minutes

1. npm install @warpy-auth-sdk/core
2. Configure your provider
3. Add authMiddleware to proxy.ts
4. Done! 🎉

Full example: https://github.com/warpy-ai/auth-sdk/tree/main/examples/nextjs-captcha-example

#NextJS #Auth #TypeScript
```

## Problem/Solution

```
❌ Problem: Fixed auth routes don't match your app

✅ Solution: Custom route paths in v0.0.22

Match your routing convention:
• RESTful APIs
• Simplified paths
• Your own patterns

No workarounds. No compromises.

🔗 https://warpy.co/docs/guides/custom-route-paths
```

## Framework Comparison

```
Same auth. Different frameworks.

Express: Middleware pattern
Hono: Multi-runtime (Node/Deno/Bun/CF)
Remix: Loader/action integration
Node.js: Zero dependencies

One SDK. Six adapters. Your choice. 🚀

#NodeJS #Express #Hono #Remix
```

## Production Ready

```
🚀 Production-ready authentication

✅ 15+ OAuth providers
✅ Email magic links
✅ 2FA support
✅ CAPTCHA integration
✅ 6 framework adapters
✅ 200+ pages of docs

Everything you need. Nothing you don't.

🔗 https://warpy.co/docs
```

## Developer Experience

```
💻 Developer experience matters

@warpy-auth-sdk/core:
• TypeScript-first
• Zero-config defaults
• Comprehensive docs
• Production examples
• Framework-agnostic

Built by developers, for developers. ✨
```






