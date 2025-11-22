# Custom Route Paths Example

This example demonstrates how to use custom authentication route paths with @warpy-auth-sdk/core.

## Default Routes

By default, the SDK uses these routes:

```
GET  /api/auth/session              # Get current session
POST /api/auth/signout              # Sign out
GET  /api/auth/signin/{provider}    # Start OAuth sign-in
POST /api/auth/signin/email         # Send magic link
GET  /api/auth/callback/{provider}  # OAuth callback
```

## Custom Routes Configuration

You can customize these paths using the `routes` option:

### Example: Custom Paths

```typescript
// proxy.ts
import { authMiddleware } from "@warpy-auth-sdk/core/next";
import { google } from "@warpy-auth-sdk/core";

const handler = authMiddleware(
  {
    secret: process.env.AUTH_SECRET!,
    provider: google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // IMPORTANT: Update redirect URI to match custom callback path
      redirectUri: "http://localhost:3000/auth/verify/google",
    }),
  },
  {
    basePath: "/api/auth", // Only used as fallback

    // Custom route paths
    routes: {
      session: "/api/user/me",
      signOut: "/api/auth/logout",
      signIn: "/login/{provider}",
      callback: "/auth/verify/{provider}",
    },

    successRedirect: "/dashboard",
    errorRedirect: "/signin",
  }
);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Match custom routes
  if (
    pathname.startsWith("/login/") ||
    pathname.startsWith("/auth/verify/") ||
    pathname === "/api/user/me" ||
    pathname === "/api/auth/logout"
  ) {
    return handler(request);
  }

  return NextResponse.next();
}
```

## Updated Client Code

### Custom Sign-in Links

```tsx
// app/signin/page.tsx
export default function SignInPage() {
  return (
    <div>
      {/* Use custom sign-in path */}
      <a href="/login/google">Sign in with Google</a>
      <a href="/login/github">Sign in with GitHub</a>
    </div>
  );
}
```

### Custom Session Endpoint

```tsx
// app/layout.tsx
import { AuthProvider } from "@warpy-auth-sdk/core/hooks";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Configure custom session endpoint */}
        <AuthProvider sessionEndpoint="/api/user/me">
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Custom Sign-out

```tsx
// components/SignOutButton.tsx
export function SignOutButton() {
  const handleSignOut = async () => {
    // Use custom logout endpoint
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

## Common Route Patterns

### RESTful API Style

```typescript
routes: {
  session: "/api/user/session",
  signOut: "/api/user/session", // DELETE on same endpoint
  signIn: "/api/auth/{provider}",
  callback: "/api/auth/{provider}/callback",
}
```

### Clerk-like Convention

```typescript
routes: {
  session: "/api/auth/session",
  signOut: "/api/auth/sign-out",
  signIn: "/api/auth/sign-in/{provider}",
  callback: "/api/auth/callback/{provider}",
}
```

### Simplified Paths

```typescript
routes: {
  session: "/session",
  signOut: "/logout",
  signIn: "/signin/{provider}",
  callback: "/callback/{provider}",
}
```

## Important Notes

1. **OAuth Redirect URIs**: Update your OAuth provider redirect URIs to match custom callback paths
2. **Proxy Matcher**: Ensure Next.js proxy matcher includes custom route patterns
3. **{provider} Placeholder**: Will be replaced with actual provider name (google, github, email, twofa)
4. **AuthProvider**: Update `sessionEndpoint` prop if you customize the session route

## Benefits

- Match your existing API conventions
- Cleaner, more semantic URLs
- Better integration with existing routing
- Flexibility for different environments (staging, production)
