# OAuth Providers Guide

This guide covers all available OAuth providers in the `@warpy-auth-sdk/core` package.

## Table of Contents

- [Google](#google)
- [Facebook](#facebook)
- [GitHub](#github)
- [GitLab](#gitlab)
- [LinkedIn](#linkedin)
- [Microsoft](#microsoft)
- [Spotify](#spotify)
- [Discord](#discord)
- [Twitch](#twitch)
- [Epic Games](#epic-games)
- [Custom Provider](#custom-provider)

## Common Features

All OAuth providers share these features:

- **PKCE Support**: Enabled by default with S256 method for enhanced security
- **Configurable Scopes**: Customize requested permissions
- **Type Safety**: Full TypeScript support with type definitions
- **Consistent API**: Same interface across all providers

## Provider Details

### Google

Google OAuth 2.0 with OpenID Connect support.

```typescript
import { google } from '@warpy-auth-sdk/core';

const provider = google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/google',
  scope: ['openid', 'email', 'profile'], // Optional, these are defaults
  pkce: 'S256', // Optional: 'S256' (default), 'plain', or false
});
```

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

**Default Scopes:** `openid`, `email`, `profile`

---

### Facebook

Facebook OAuth 2.0 for social login.

```typescript
import { facebook } from '@warpy-auth-sdk/core';

const provider = facebook({
  clientId: process.env.FACEBOOK_CLIENT_ID!,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/facebook',
  scope: ['email', 'public_profile'], // Optional, these are defaults
  pkce: 'S256',
});
```

**Setup Instructions:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Get App ID and App Secret

**Default Scopes:** `email`, `public_profile`

---

### GitHub

GitHub OAuth 2.0 with automatic email fetching for private emails.

```typescript
import { github } from '@warpy-auth-sdk/core';

const provider = github({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/github',
  scope: ['read:user', 'user:email'], // Optional, these are defaults
  pkce: 'S256',
});
```

**Setup Instructions:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details
4. Add authorization callback URL
5. Get Client ID and Client Secret

**Default Scopes:** `read:user`, `user:email`

**Special Features:**
- Automatically fetches email from `/user/emails` endpoint if not public
- Returns primary email or first available email

---

### GitLab

GitLab OAuth 2.0 with support for self-hosted instances.

```typescript
import { gitlab } from '@warpy-auth-sdk/core';

// GitLab.com (default)
const provider = gitlab({
  clientId: process.env.GITLAB_CLIENT_ID!,
  clientSecret: process.env.GITLAB_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/gitlab',
  scope: ['read_user', 'email'], // Optional, these are defaults
  pkce: 'S256',
});

// Self-hosted GitLab
const selfHostedProvider = gitlab({
  clientId: process.env.GITLAB_CLIENT_ID!,
  clientSecret: process.env.GITLAB_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/gitlab',
  domain: 'https://gitlab.yourcompany.com', // Custom domain
  scope: ['read_user', 'email'],
  pkce: 'S256',
});
```

**Setup Instructions:**
1. Go to GitLab (or your instance) User Settings
2. Navigate to Applications
3. Create a new application
4. Add redirect URI
5. Get Application ID and Secret

**Default Scopes:** `read_user`, `email`

**Special Features:**
- Supports self-hosted GitLab instances via `domain` option
- Defaults to `https://gitlab.com`

---

### LinkedIn

LinkedIn OAuth 2.0 with OpenID Connect.

```typescript
import { linkedin } from '@warpy-auth-sdk/core';

const provider = linkedin({
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/linkedin',
  scope: ['openid', 'profile', 'email'], // Optional, these are defaults
  pkce: 'S256',
});
```

**Setup Instructions:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add Sign In with LinkedIn product
4. Configure redirect URLs
5. Get Client ID and Client Secret

**Default Scopes:** `openid`, `profile`, `email`

---

### Microsoft

Microsoft/Azure AD OAuth 2.0 with multi-tenant support.

```typescript
import { microsoft } from '@warpy-auth-sdk/core';

// Common (multi-tenant)
const provider = microsoft({
  clientId: process.env.MICROSOFT_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/microsoft',
  tenant: 'common', // Optional: 'common' (default), 'organizations', 'consumers', or tenant ID
  scope: ['openid', 'profile', 'email', 'User.Read'], // Optional, these are defaults
  pkce: 'S256',
});

// Single tenant
const singleTenantProvider = microsoft({
  clientId: process.env.MICROSOFT_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/microsoft',
  tenant: 'your-tenant-id',
  scope: ['openid', 'profile', 'email', 'User.Read'],
  pkce: 'S256',
});
```

**Setup Instructions:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory
3. Register a new application
4. Add redirect URI
5. Create a client secret
6. Get Application (client) ID and client secret

**Default Scopes:** `openid`, `profile`, `email`, `User.Read`

**Tenant Options:**
- `common`: Multi-tenant (personal and work/school accounts)
- `organizations`: Work/school accounts only
- `consumers`: Personal Microsoft accounts only
- Specific tenant ID for single-tenant apps

---

### Spotify

Spotify OAuth 2.0 for music streaming integration.

```typescript
import { spotify } from '@warpy-auth-sdk/core';

const provider = spotify({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/spotify',
  scope: ['user-read-email', 'user-read-private'], // Optional, these are defaults
  pkce: 'S256',
});
```

**Setup Instructions:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new app
3. Add redirect URI
4. Get Client ID and Client Secret

**Default Scopes:** `user-read-email`, `user-read-private`

---

### Discord

Discord OAuth 2.0 for gaming community integration.

```typescript
import { discord } from '@warpy-auth-sdk/core';

const provider = discord({
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/discord',
  scope: ['identify', 'email'], // Optional, these are defaults
  pkce: 'S256',
});
```

**Setup Instructions:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Navigate to OAuth2 settings
4. Add redirect URI
5. Get Client ID and Client Secret

**Default Scopes:** `identify`, `email`

**Special Features:**
- Automatically constructs avatar URL from user ID and avatar hash

---

### Twitch

Twitch OAuth 2.0 for streaming platform integration.

```typescript
import { twitch } from '@warpy-auth-sdk/core';

const provider = twitch({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/twitch',
  scope: ['user:read:email'], // Optional, this is the default
  pkce: 'S256',
});
```

**Setup Instructions:**
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Register a new application
3. Add OAuth redirect URL
4. Get Client ID and Client Secret

**Default Scopes:** `user:read:email`

**Special Features:**
- Requires Client-ID header in addition to access token for API calls
- Automatically handles Helix API response format

---

### Epic Games

Epic Games OAuth 2.0 for gaming integration.

```typescript
import { epic } from '@warpy-auth-sdk/core';

const provider = epic({
  clientId: process.env.EPIC_CLIENT_ID!,
  clientSecret: process.env.EPIC_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/epic',
  scope: ['basic_profile', 'friends_list'], // Optional, these are defaults
  pkce: 'S256',
});
```

**Setup Instructions:**
1. Go to [Epic Games Developer Portal](https://dev.epicgames.com/)
2. Create a new application
3. Configure OAuth settings
4. Add redirect URI
5. Get Client ID and Client Secret

**Default Scopes:** `basic_profile`, `friends_list`

**Note:** Epic Games does not provide profile pictures in basic profile scope.

---

### Custom Provider

Custom OAuth 2.0 provider for any OAuth-compliant service.

```typescript
import { custom } from '@warpy-auth-sdk/core';

const provider = custom({
  clientId: process.env.CUSTOM_CLIENT_ID!,
  clientSecret: process.env.CUSTOM_CLIENT_SECRET!,
  redirectUri: 'https://yourdomain.com/auth/callback/custom',
  authorizeUrl: 'https://oauth.provider.com/authorize',
  tokenUrl: 'https://oauth.provider.com/token',
  userInfoUrl: 'https://oauth.provider.com/userinfo',
  scope: ['read:user', 'email'],
  pkce: 'S256',
  // Optional: Map provider's user data to standard UserProfile
  userInfoMapper: (userInfo) => ({
    id: userInfo.user_id,
    email: userInfo.user_email,
    name: userInfo.display_name,
    picture: userInfo.avatar_url,
  }),
});
```

**When to Use:**
- Integrating with OAuth providers not included in the SDK
- Testing with custom OAuth servers
- Internal company OAuth systems

**Default Mapping:**
If `userInfoMapper` is not provided, the custom provider assumes standard OIDC claims:
- `id`: `sub || id || user_id`
- `email`: `email`
- `name`: `name || display_name || username`
- `picture`: `picture || avatar || avatar_url`

---

## PKCE Configuration

All providers support PKCE (Proof Key for Code Exchange) for enhanced security. PKCE is enabled by default with the S256 method.

```typescript
const provider = google({
  clientId: '...',
  clientSecret: '...',
  redirectUri: '...',
  pkce: 'S256', // SHA-256 challenge (default, recommended)
  // pkce: 'plain', // Plain text challenge (legacy servers)
  // pkce: false, // Disable PKCE
});
```

**PKCE Options:**
- `'S256'` (default): SHA-256 hashed challenge - most secure
- `'plain'`: Plain text challenge - for legacy OAuth servers
- `false`: Disable PKCE - not recommended for production

## Usage with Next.js Proxy

Example using multiple providers with Next.js 16 Proxy:

```typescript
// proxy.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authMiddleware } from '@warpy-auth-sdk/core/next';
import { google, github, discord } from '@warpy-auth-sdk/core';

const handler = authMiddleware(
  {
    secret: process.env.AUTH_SECRET!,
    // You can switch providers based on route or use multiple handlers
    provider: google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    }),
    callbacks: {
      async user(u) {
        // Resolve/upsert user in your database
        return { id: u.id, email: u.email, name: u.name, picture: u.picture };
      },
    },
  },
  {
    basePath: '/api/auth',
    successRedirect: '/dashboard',
    errorRedirect: '/login',
  }
);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/auth')) {
    return handler(request);
  }
  return NextResponse.next();
}
```

## Environment Variables

Recommended environment variable naming convention:

```bash
# Auth Secret
AUTH_SECRET=your-secret-key

# Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/callback/google

# GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://yourdomain.com/api/auth/callback/github

# Discord
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=https://yourdomain.com/api/auth/callback/discord

# Add similar patterns for other providers...
```

## Type Definitions

All providers return the standard `UserProfile` interface:

```typescript
interface UserProfile {
  id: string;        // Unique user identifier from provider
  email: string;     // User's email address
  name?: string;     // User's display name (optional)
  picture?: string;  // User's profile picture URL (optional)
}
```

## Error Handling

All providers throw errors for common OAuth issues:

- Invalid credentials
- Network errors
- Invalid tokens
- Missing required scopes
- User denied authorization

Wrap provider calls in try-catch blocks:

```typescript
try {
  const result = await authenticate(request, config);
  // Handle success
} catch (error) {
  // Handle error
  console.error('Authentication failed:', error);
}
```

## Best Practices

1. **Use Environment Variables**: Never hardcode credentials
2. **Enable PKCE**: Use S256 method for production (default)
3. **Minimal Scopes**: Only request necessary permissions
4. **Secure Redirect URIs**: Use HTTPS in production
5. **Error Handling**: Implement proper error handling and user feedback
6. **Token Storage**: Use secure, HttpOnly cookies (handled by SDK)
7. **Session Management**: Implement session expiration and refresh logic

## Additional Resources

- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [PKCE RFC](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect Spec](https://openid.net/connect/)
