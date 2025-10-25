# Auth SDK - Next.js 16 Example

This is a complete authentication example using [auth-sdk](../../) with Next.js 16, showcasing **multiple authentication providers** working simultaneously: Google OAuth, GitHub OAuth, and Email Magic Links with **Resend** and **React Email**.

## Features

- ✅ **Multiple Providers** - Google, GitHub, and Email all working together
- ✅ **Google OAuth** - Sign in with Google
- ✅ **GitHub OAuth** - Sign in with GitHub
- ✅ **Email Magic Links** - Passwordless authentication with Resend
- ✅ **React Email Templates** - Beautiful, responsive email templates
- ✅ **Next.js 16 Proxy** - Zero-config authentication middleware
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

Then configure the providers you want to use:

```env
# Auth SDK Configuration
AUTH_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/callback/github

# Email Magic Link Configuration (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourapp.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**You can enable any combination of providers!** Just configure the credentials for the providers you want to use. Users will be able to choose their preferred sign-in method.

#### Setting up Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy your Client ID and Client Secret to `.env.local`

#### Setting up GitHub OAuth (Optional)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the Client ID to `GITHUB_CLIENT_ID` in `.env.local`
6. Generate a new client secret and copy it to `GITHUB_CLIENT_SECRET`

#### Setting up Email Magic Links with Resend

1. Go to [Resend](https://resend.com) and create a free account
2. Verify your domain or use Resend's test domain for development
3. Go to [API Keys](https://resend.com/api-keys) and create a new API key
4. Copy the API key to `RESEND_API_KEY` in `.env.local`
5. Set `EMAIL_FROM` to your verified domain email (e.g., `noreply@yourdomain.com`)
6. Change `AUTH_PROVIDER=email` in `.env.local` to use email authentication

**Why Resend?**
- Simple API with excellent developer experience
- Great deliverability out of the box
- Free tier includes 3,000 emails/month and 100 emails/day
- Built-in React Email support
- No SMTP configuration needed

#### Alternative: Email with SMTP (Nodemailer)

If you prefer to use SMTP instead of Resend, update your `proxy.ts`:

```typescript
const emailProvider = email({
  from: process.env.EMAIL_FROM!,
  service: {
    type: 'nodemailer',
    server: 'smtp.gmail.com:587',
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASSWORD!
    }
  }
});
```

For Gmail SMTP:
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

### 1. Zero-Config Proxy Authentication

This example uses Next.js 16's Proxy (formerly Middleware) for zero-config authentication. The `proxy.ts` file handles all authentication routes automatically:

```typescript
import { authMiddleware } from '@warpy-auth-sdk/core/next';
import { google, email } from '@warpy-auth-sdk/core';

// Configure your providers
const googleProvider = google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI!,
});

const emailProvider = email({
  from: process.env.EMAIL_FROM!,
  service: {
    type: 'resend',
    apiKey: process.env.RESEND_API_KEY!,
  },
  appName: 'Next.js Auth Example',
  companyName: 'Your Company',
});

// Create handler with automatic routing
const handler = authMiddleware(
  {
    secret: process.env.AUTH_SECRET!,
    provider: process.env.AUTH_PROVIDER === 'email' ? emailProvider : googleProvider,
    callbacks: {
      async user(u) {
        // Lookup/create user in your database
        return { id: '1', email: u.email, name: u.name, picture: u.picture };
      }
    },
  },
  {
    basePath: '/api/auth',
    successRedirect: '/dashboard',
    errorRedirect: '/login',
  }
);
```

The proxy automatically handles:
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/signin/google` - Start OAuth flow
- `GET /api/auth/callback/google` - OAuth callback
- `POST /api/auth/signin/email` - Send magic link
- `GET /api/auth/callback/email` - Verify magic link

### 2. Email Templates with React Email

Email magic links use React Email for beautiful, responsive templates. The default template includes:

- Professional branding with customizable app/company names
- Prominent call-to-action button
- Clear expiration messaging
- Fallback text link
- Mobile-responsive design

**Customizing Email Templates:**

You can create your own email template:

```typescript
import { MagicLinkEmail } from '@warpy-auth-sdk/core';

// Use the default template with custom branding
const emailProvider = email({
  from: 'noreply@yourapp.com',
  service: { type: 'resend', apiKey: process.env.RESEND_API_KEY! },
  appName: 'Your App Name',
  companyName: 'Your Company Name',
  expirationMinutes: 30, // Custom expiration
});

// Or use your own custom React Email template
const emailProvider = email({
  from: 'noreply@yourapp.com',
  service: { type: 'resend', apiKey: process.env.RESEND_API_KEY! },
  template: {
    component: ({ magicLink }) => <CustomEmailTemplate link={magicLink} />,
    subject: 'Sign in to Your App'
  }
});
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

## Multiple Providers Working Together

This example demonstrates how to use **multiple authentication providers simultaneously**. All configured providers are available to users at the same time - they can choose their preferred sign-in method.

### How It Works

The `proxy.ts` file creates separate handlers for each provider and routes requests based on the URL:

```typescript
const providers = {
  google: google({ /* config */ }),
  github: github({ /* config */ }),
  email: email({ /* config */ }),
};
```

Each provider gets its own routes:
- `/api/auth/signin/google` - Google OAuth
- `/api/auth/signin/github` - GitHub OAuth
- `/api/auth/signin/email` - Email Magic Link (POST)

### Adding or Removing Providers

**To add a new provider:**

1. Import the provider in `proxy.ts`:
   ```typescript
   import { google, github, email, microsoft } from '@warpy-auth-sdk/core';
   ```

2. Add it to the `providers` object:
   ```typescript
   const providers = {
     google: google({ /* config */ }),
     github: github({ /* config */ }),
     microsoft: microsoft({ /* config */ }),
     email: email({ /* config */ }),
   };
   ```

3. Configure the environment variables

**To remove a provider:**

Simply remove it from the `providers` object and its routes will no longer be available.

### Available Providers

The auth-sdk supports these providers:
- **Google** - OAuth 2.0
- **Facebook** - OAuth 2.0
- **GitHub** - OAuth 2.0
- **GitLab** - OAuth 2.0 (self-hosted support)
- **LinkedIn** - OAuth 2.0 with OpenID Connect
- **Microsoft** - OAuth 2.0 (Azure AD, multi-tenant)
- **Spotify** - OAuth 2.0
- **Discord** - OAuth 2.0
- **Twitch** - OAuth 2.0
- **Epic Games** - OAuth 2.0
- **Custom OAuth** - Configure any OAuth 2.0 provider
- **Email** - Magic links with Resend or Nodemailer

## Testing Authentication

### Test Google OAuth

1. Configure Google OAuth credentials in `.env.local`
2. Navigate to `/api/auth/signin/google` or add a "Sign in with Google" button
3. Select a Google account
4. Redirected to `/dashboard` with session

### Test GitHub OAuth

1. Configure GitHub OAuth credentials in `.env.local`
2. Navigate to `/api/auth/signin/github` or add a "Sign in with GitHub" button
3. Authorize the application
4. Redirected to `/dashboard` with session

### Test Email Magic Link

1. Configure Resend API key in `.env.local`
2. Make a POST request to `/api/auth/signin/email` with `{ email: "user@example.com" }`
3. Check your email for the magic link
4. Click the link to be signed in
5. Redirected to `/dashboard` with session

**Email Template Preview:**

The default React Email template includes:
- Your app name and company branding
- A prominent blue "Sign In" button
- Fallback text link for accessibility
- Expiration time warning (15 minutes by default)
- Security message about ignoring unexpected emails
- Professional footer with copyright

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
