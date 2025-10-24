# Auth SDK - Next.js 16 Example

This is a complete authentication example using [auth-sdk](../../) with Next.js 16, showcasing Google OAuth and email magic link authentication.

## Features

- ✅ **Google OAuth** - Sign in with Google
- ✅ **Email Magic Links** - Passwordless authentication
- ✅ **Protected Routes** - Dashboard requiring authentication
- ✅ **Session Management** - JWT-based sessions with secure cookies
- ✅ **React Hooks** - `useAuth()` hook for client-side state
- ✅ **Next.js 16** - Latest Next.js features with React 19
- ✅ **Tailwind CSS** - Beautiful, responsive UI

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Then update the values:

```env
# Auth SDK Configuration
AUTH_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth Configuration (Get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Email Configuration (for magic links)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy your Client ID and Client Secret to `.env.local`

#### Setting up Email (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this password in `EMAIL_PASSWORD` (not your regular password)

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── api/
│   └── auth/
│       ├── config.ts              # Authentication configuration
│       ├── signin/
│       │   ├── google/route.ts    # Initiate Google OAuth
│       │   └── email/route.ts     # Send magic link
│       ├── callback/
│       │   ├── google/route.ts    # Handle Google OAuth callback
│       │   └── email/route.ts     # Verify magic link
│       ├── session/route.ts       # Get current session
│       └── signout/route.ts       # Sign out user
├── dashboard/
│   └── page.tsx                   # Protected dashboard page
├── login/
│   └── page.tsx                   # Login page
├── layout.tsx                     # Root layout with AuthProvider
└── page.tsx                       # Home page
```

## How It Works

### 1. Authentication Configuration

The `app/api/auth/config.ts` file configures auth-sdk with providers:

```typescript
import { google, email } from 'auth-sdk';

export const googleAuthConfig = {
  secret: process.env.AUTH_SECRET!,
  providers: [google({ /* ... */ })],
};

export const emailAuthConfig = {
  secret: process.env.AUTH_SECRET!,
  providers: [email({ /* ... */ })],
};
```

### 2. API Routes

All API routes use auth-sdk's `authenticate()`, `createSessionCookie()`, and other helpers:

**Google Sign In** - `app/api/auth/signin/google/route.ts`
```typescript
import { authenticate } from 'auth-sdk';

const result = await authenticate(googleAuthConfig, request);
if (result.redirectUrl) {
  return NextResponse.redirect(result.redirectUrl);
}
```

**Google Callback** - `app/api/auth/callback/google/route.ts`
```typescript
import { authenticate, createSessionCookie } from 'auth-sdk';

const result = await authenticate(googleAuthConfig, request);
if (result.session) {
  const sessionCookie = createSessionCookie(result.session);
  response.headers.set('Set-Cookie', sessionCookie);
}
```

**Email Magic Link** - `app/api/auth/signin/email/route.ts`
```typescript
// auth-sdk handles sending the magic link email
const result = await authenticate(emailAuthConfig, mockRequest);
```

### 3. React Integration

The root layout wraps the app with `AuthProvider`:

```typescript
import { AuthProvider } from 'auth-sdk/hooks';

export default function RootLayout({ children }) {
  return (
    <AuthProvider secret={process.env.AUTH_SECRET!}>
      {children}
    </AuthProvider>
  );
}
```

Pages use the `useAuth()` hook:

```typescript
import { useAuth } from 'auth-sdk/hooks';

const { session, loading, signOut } = useAuth();
```

### 4. Protected Routes

The dashboard page checks for authentication:

```typescript
const { session, loading } = useAuth();

useEffect(() => {
  if (!loading && !session) {
    router.push('/login');
  }
}, [session, loading, router]);
```

## Available Routes

- `/` - Home page (shows auth state)
- `/login` - Login page with Google and email options
- `/dashboard` - Protected dashboard (requires authentication)
- `/api/auth/signin/google` - Initiate Google OAuth
- `/api/auth/signin/email` - Send magic link email (POST)
- `/api/auth/callback/google` - Google OAuth callback
- `/api/auth/callback/email` - Verify magic link
- `/api/auth/session` - Get current session
- `/api/auth/signout` - Sign out (POST)

## Key Features Demonstrated

### Minimal API Routes

Each route is just a few lines of code using auth-sdk:

```typescript
// Google OAuth - 3 function calls
const result = await authenticate(googleAuthConfig, request);
const sessionCookie = createSessionCookie(result.session);
response.headers.set('Set-Cookie', sessionCookie);
```

### Type-Safe

Full TypeScript support throughout:

```typescript
import type { Session } from 'auth-sdk';

const session: Session | null = await getSession(config, request);
```

### Secure by Default

- JWT tokens with configurable expiration
- HttpOnly, Secure, SameSite cookies
- CSRF protection for OAuth flows
- Token revocation support

## Testing Authentication

### Test Google OAuth

1. Click "Continue with Google" on `/login`
2. Select a Google account
3. Redirected to `/dashboard` with session

### Test Email Magic Link

1. Enter your email on `/login`
2. Check your email for the magic link
3. Click the link to be signed in
4. Redirected to `/dashboard` with session

## Learn More

- [auth-sdk Documentation](../../readme.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js 16 Release](https://nextjs.org/blog/next-16)

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add all environment variables from `.env.local`
4. Update `GOOGLE_REDIRECT_URI` to your production URL
5. Deploy!
