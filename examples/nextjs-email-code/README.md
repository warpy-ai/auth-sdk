# Next.js 2FA Email Authentication Example

This is a complete example demonstrating two-factor email authentication using [@warpy-auth-sdk/core](https://www.npmjs.com/package/@warpy-auth-sdk/core) with Next.js 16.

## Features

- ✅ **Two-Factor Email Authentication** with 6-digit verification codes
- ✅ **Next.js 16 Proxy** integration (single file setup)
- ✅ **Resend** email service integration
- ✅ **Beautiful UI** with Tailwind CSS
- ✅ **TypeScript** throughout
- ✅ **Session Management** with JWT cookies
- ✅ **Protected Routes** with authentication checks

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file with the following variables:

```env
# Required: Secret key for JWT signing (min 32 characters)
AUTH_SECRET=your-secret-key-min-32-characters-long-replace-me

# Required: Email sender address (must be verified in Resend)
EMAIL_FROM=noreply@yourdomain.com

# Required: Resend API key (get from https://resend.com)
RESEND_API_KEY=re_your_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

### Authentication Flow

1. **User enters email** on the login page
2. **SDK sends 6-digit code** to the email address via Resend
3. **User enters code** from their email
4. **SDK verifies code** and creates a session
5. **User is redirected** to the dashboard

### File Structure

```
app/
├── page.tsx              # Home page with "Sign In" link
├── login/
│   └── page.tsx          # 2FA login form (email + code input)
├── dashboard/
│   └── page.tsx          # Protected dashboard page
└── layout.tsx            # Root layout with AuthProvider

proxy.ts                  # Next.js 16 Proxy configuration
.env.local               # Environment variables (not in git)
```

### Key Files

#### `proxy.ts` - Authentication Configuration

```typescript
import { authMiddleware } from "@warpy-auth-sdk/core/next";
import { twofa } from "@warpy-auth-sdk/core";

const handler = authMiddleware(
  {
    secret: process.env.AUTH_SECRET!,
    provider: twofa({
      from: process.env.EMAIL_FROM!,
      service: {
        type: "resend",
        apiKey: process.env.RESEND_API_KEY!,
      },
      expirationMinutes: 5,
    }),
  },
  {
    basePath: "/api/auth",
    successRedirect: "/dashboard",
    errorRedirect: "/login",
  }
);
```

#### `app/login/page.tsx` - Two-Step Login Form

Handles both email input and code verification:

```typescript
// Step 1: Send code
await fetch(`/api/auth/signin/twofa?email=${email}`);

// Step 2: Verify code
await fetch(`/api/auth/signin/twofa?identifier=${identifier}&code=${code}`);
```

#### `app/dashboard/page.tsx` - Protected Page

Uses `useAuth()` hook to check authentication:

```typescript
import { useAuth } from "@warpy-auth-sdk/core/hooks";

const { session, loading } = useAuth();
```

## Available Routes

The proxy automatically creates these auth endpoints:

- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/signin/twofa?email=user@example.com` - Send 2FA code
- `GET /api/auth/signin/twofa?identifier=xxx&code=123456` - Verify code

## Customization

### Change Code Expiration

Edit `proxy.ts`:

```typescript
provider: twofa({
  // ...
  expirationMinutes: 10, // Change from 5 to 10 minutes
});
```

### Use Nodemailer Instead of Resend

Edit `proxy.ts` and `.env.local`:

```typescript
// proxy.ts
service: {
  type: "nodemailer",
  server: process.env.SMTP_SERVER!,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
}
```

```env
# .env.local
SMTP_SERVER=smtp.gmail.com:587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Custom Email Template

Create a custom React Email template:

```typescript
import { TwoFactorEmail } from "@warpy-auth-sdk/core";

provider: twofa({
  // ...
  template: {
    component: ({ code }) => <MyCustomTemplate code={code} />,
    subject: "Your custom verification code",
  },
});
```

### Add Database Persistence

Install Prisma adapter:

```bash
npm install @prisma/client
```

Configure in `proxy.ts`:

```typescript
import { prismaAdapter } from "@warpy-auth-sdk/core";

authMiddleware(
  {
    provider: twofa({ /* ... */ }),
    adapter: prismaAdapter(prisma),
  },
  { /* ... */ }
);
```

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Important Production Considerations

- ✅ Use a strong `AUTH_SECRET` (generate with `openssl rand -base64 32`)
- ✅ Verify your email domain in Resend
- ✅ Configure SPF, DKIM, and DMARC DNS records
- ✅ Use Redis/DB for token storage (not in-memory)
- ✅ Add rate limiting to prevent abuse
- ✅ Monitor email deliverability
- ✅ Set up error logging (e.g., Sentry)

## Troubleshooting

### Codes Not Arriving

- Check spam folder
- Verify `EMAIL_FROM` domain is verified in Resend
- Check Resend logs for delivery errors
- Test with different email provider

### "Invalid or Expired Code"

- Codes expire after 5 minutes (configurable)
- Codes are single-use only
- Ensure code is exactly 6 digits
- Check for typos

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

## Resources

- [2FA Guide](../../docs/2FA-Guide.md) - Complete 2FA documentation
- [Auth SDK Documentation](../../README.md) - Main SDK documentation
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Resend Documentation](https://resend.com/docs)

## Support

- GitHub Issues: [github.com/warpy-ai/auth-sdk/issues](https://github.com/warpy-ai/auth-sdk/issues)
- Documentation: [github.com/warpy-ai/auth-sdk/docs](https://github.com/warpy-ai/auth-sdk/tree/main/docs)
