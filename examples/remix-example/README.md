# Remix Auth Example

This is an example Remix application demonstrating how to use `@warpy-auth-sdk/core` for authentication.

## Features

- Google OAuth authentication
- Protected routes using `requireAuth`
- Session management
- Sign out functionality

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Create a `.env` file:**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

- `AUTH_SECRET` - A secure random string (minimum 32 characters)
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - Must be `http://localhost:3000/auth/callback/google` for local development

3. **Set up Google OAuth:**

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
1. Create a new project or select an existing one
1. Enable the Google+ API
1. Create OAuth 2.0 credentials
1. Add `http://localhost:3000/auth/callback/google` to authorized redirect URIs

## Running the Application

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
  routes/
    _index.tsx          # Home page
    login.tsx           # Login page
    dashboard.tsx       # Protected dashboard
    auth.$.ts          # Auth routes handler (catches all /auth/* routes)
  lib/
    auth.ts            # Auth configuration
  root.tsx             # Root component
  styles.css           # Global styles
```

## How It Works

### Auth Routes

The `app/routes/auth.$.ts` file uses Remix's catch-all route (`$`) to handle all authentication-related requests:

- `GET /auth/session` - Get current session
- `GET /auth/signin/google` - Initiate Google OAuth flow
- `GET /auth/callback/google` - Handle OAuth callback
- `POST /auth/signout` - Sign out the user

### Protected Routes

The `dashboard.tsx` route uses `requireAuth` from the Remix adapter to protect the route:

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireAuth(request, authConfig, {
    redirectTo: "/login",
  });
  return { session };
}
```

If the user is not authenticated, they'll be redirected to `/login`.

### Using the Auth Handlers

The Remix adapter provides `createAuthHandlers` which returns loader and action functions:

```typescript
import { createAuthHandlers } from "@warpy-auth-sdk/core/adapters/remix";

const { authLoader, authAction } = createAuthHandlers(authConfig, {
  basePath: "/auth",
  successRedirect: "/dashboard",
  errorRedirect: "/login",
});
```

## Customization

You can customize the auth configuration in `app/lib/auth.ts`. For example, you can:

- Add more OAuth providers
- Configure email magic link authentication
- Add two-factor authentication
- Customize callbacks for user resolution

See the [@warpy-auth-sdk/core documentation](../../README.md) for more details.
