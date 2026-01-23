# Customize Your Auth Routes: Introducing Custom Route Paths in @warpy-auth-sdk/core

**Meta Description**: Learn how to customize authentication endpoints in Next.js with @warpy-auth-sdk/core v0.0.22. Match any routing convention with flexible custom route paths.

**Tags**: Next.js, Authentication, TypeScript, Web Development, Security

---

## The Problem: One Size Doesn't Fit All

When building authentication into your Next.js application, you often need routes that match your existing API conventions. Maybe you're building a RESTful API and want `/api/user/session` instead of `/api/auth/session`. Or perhaps you prefer simpler paths like `/login/google` instead of `/api/auth/signin/google`.

Until now, authentication SDKs have forced you into a fixed route structure. You either adapt your app to their routes, or you build custom middleware to map between your routes and theirs. Neither option is ideal.

## The Solution: Custom Route Paths

With **@warpy-auth-sdk/core v0.0.22**, you can now configure custom authentication endpoints that match your application's routing conventions. No more compromises. No more workarounds.

### How It Works

Custom route paths use a simple `{provider}` placeholder pattern that gets replaced with the actual provider name (e.g., `google`, `github`, `email`, `twofa`). This gives you complete flexibility while maintaining a consistent API.

Here's a quick example:

```typescript
import { authMiddleware } from "@warpy-auth-sdk/core/next";
import { google } from "@warpy-auth-sdk/core";

const handler = authMiddleware(
  {
    secret: process.env.AUTH_SECRET!,
    provider: google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: "http://localhost:3000/auth/verify/google",
    }),
  },
  {
    routes: {
      session: "/api/user/me",           // Custom session endpoint
      signOut: "/api/auth/logout",        // Custom logout endpoint
      signIn: "/login/{provider}",        // Custom sign-in pattern
      callback: "/auth/verify/{provider}", // Custom callback pattern
    },
    successRedirect: "/dashboard",
    errorRedirect: "/login",
  }
);
```

Now your authentication endpoints are:
- `GET /api/user/me` - Get current session
- `POST /api/auth/logout` - Sign out
- `GET /login/google` - Start Google OAuth
- `GET /auth/verify/google` - OAuth callback

## Common Patterns

### RESTful API Style

Perfect for applications following REST conventions:

```typescript
routes: {
  session: "/api/user/session",
  signOut: "/api/user/session",     // DELETE method on same endpoint
  signIn: "/api/auth/{provider}",
  callback: "/api/auth/{provider}/callback",
}
```

### Simplified Paths

Clean, minimal routes for modern applications:

```typescript
routes: {
  session: "/session",
  signOut: "/logout",
  signIn: "/signin/{provider}",
  callback: "/callback/{provider}",
}
```

### Clerk-like Convention

Familiar pattern for developers coming from Clerk:

```typescript
routes: {
  session: "/api/auth/session",
  signOut: "/api/auth/sign-out",
  signIn: "/api/auth/sign-in/{provider}",
  callback: "/api/auth/callback/{provider}",
}
```

## Complete Example

Here's a full Next.js 16 Proxy setup with custom routes:

```typescript
// proxy.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authMiddleware } from "@warpy-auth-sdk/core/next";
import { google, github } from "@warpy-auth-sdk/core";

const handler = authMiddleware(
  {
    secret: process.env.AUTH_SECRET!,
    provider: google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: "http://localhost:3000/auth/verify/google",
    }),
    callbacks: {
      async user(u) {
        return {
          id: u.id || u.email,
          email: u.email,
          name: u.name,
          picture: u.picture,
        };
      },
    },
  },
  {
    routes: {
      session: "/api/user/me",
      signOut: "/api/auth/logout",
      signIn: "/login/{provider}",
      callback: "/auth/verify/{provider}",
    },
    successRedirect: "/dashboard",
    errorRedirect: "/",
  }
);

export function proxy(request: NextRequest) {
  const p = request.nextUrl.pathname;

  // Match all custom routes
  if (
    p.startsWith("/login/") ||
    p.startsWith("/auth/verify/") ||
    p === "/api/user/me" ||
    p === "/api/auth/logout"
  ) {
    return handler(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Client-Side Usage

Update your React components to use the new paths:

```tsx
'use client';

import { useAuth } from "@warpy-auth-sdk/core/hooks";
import { useState } from "react";

export default function LoginPage() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use custom email sign-in endpoint
    const response = await fetch('/login/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    // Handle response...
  };

  const handleSignOut = async () => {
    // Use custom logout endpoint
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <div>
      {session ? (
        <div>
          <p>Welcome, {session.user.name}</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          {/* Use custom OAuth sign-in paths */}
          <a href="/login/google">Sign in with Google</a>
          <a href="/login/github">Sign in with GitHub</a>

          {/* Email sign-in form */}
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Send Magic Link</button>
          </form>
        </div>
      )}
    </div>
  );
}
```

## Important Considerations

### Update OAuth Redirect URIs

When customizing the `callback` route, make sure to update your OAuth provider redirect URIs. For example, if you set `callback: "/auth/verify/{provider}"`, your Google redirect URI should be `http://yourdomain.com/auth/verify/google`.

### Proxy Matcher Configuration

When using custom routes outside of the default `basePath`, ensure your Next.js Proxy `matcher` configuration or manual path checks cover the new route patterns.

### Email and 2FA Providers

- **Email magic links** automatically use your custom callback route with `email` as the provider
- **Two-factor authentication** uses the `signIn` route with `twofa` as the provider

## Benefits

1. **Match Your Conventions**: Use routes that fit your application's design
2. **No Workarounds**: No need for custom middleware or route mapping
3. **Type-Safe**: Full TypeScript support with autocomplete
4. **Backward Compatible**: Default routes still work if you don't customize
5. **Provider Agnostic**: Works with all OAuth providers, email, and 2FA

## Getting Started

Ready to customize your auth routes? Here's how:

1. **Install the latest version**:
   ```bash
   npm install @warpy-auth-sdk/core@latest
   ```

2. **Check out the example**:
   ```bash
   git clone https://github.com/warpy-ai/auth-sdk
   cd examples/nextjs-captcha-example
   ```

3. **Read the full guide**:
   [Custom Route Paths Documentation](https://warpy.co/docs/guides/custom-route-paths)

## Conclusion

Custom route paths give you the flexibility to build authentication that matches your application's routing conventions. No compromises. No workarounds. Just clean, flexible authentication that works the way you want.

Try it out and let us know what you think! We're always looking for feedback to make the SDK better.

---

**Resources**:
- [Full Documentation](https://warpy.co/docs/guides/custom-route-paths)
- [GitHub Repository](https://github.com/warpy-ai/auth-sdk)
- [Example Project](https://github.com/warpy-ai/auth-sdk/tree/main/examples/nextjs-captcha-example)
- [npm Package](https://www.npmjs.com/package/@warpy-auth-sdk/core)






