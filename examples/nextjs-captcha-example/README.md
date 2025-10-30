# Next.js CAPTCHA Authentication Example

A complete Next.js 16 example demonstrating email authentication with CAPTCHA protection using `@warpy-auth-sdk/core`.

## Features

- ✅ **Next.js 16** with App Router and Proxy
- ✅ **CAPTCHA Protection** with reCAPTCHA v2
- ✅ **Email Magic Links** passwordless authentication
- ✅ **Beautiful UI** with Tailwind CSS
- ✅ **Type-Safe** full TypeScript support
- ✅ **Production Ready** with proper error handling

## Preview

### Sign-In Page
Beautiful gradient design with integrated reCAPTCHA v2 checkbox challenge.

### Dashboard
Protected route showing user session information after successful authentication.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: @warpy-auth-sdk/core
- **CAPTCHA**: Google reCAPTCHA v2
- **Email**: Resend
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Resend account and API key
- reCAPTCHA site and secret keys

### 1. Get API Keys

#### Resend (Email Service)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Verify your domain (or use the test domain for development)

#### reCAPTCHA v2

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Register a new site:
   - **Label**: Your app name
   - **reCAPTCHA type**: reCAPTCHA v2 ("I'm not a robot" Checkbox)
   - **Domains**: `localhost` (for development)
3. Copy your **Site Key** and **Secret Key**

### 2. Installation

```bash
# Navigate to the example directory
cd examples/nextjs-captcha-example

# Install dependencies
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your keys:

```bash
# Authentication Secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-super-secret-key-here

# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# reCAPTCHA Keys
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Public environment variable (exposed to client)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

**For Testing**, you can use Google's test keys (always pass without user interaction):

```bash
RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nextjs-captcha-example/
├── app/
│   ├── page.tsx              # Home page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── signin/
│   │   └── page.tsx          # Sign-in page with CAPTCHA
│   └── dashboard/
│       └── page.tsx          # Protected dashboard
├── proxy.ts                  # Next.js Proxy with auth config
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── .env.example
└── README.md
```

## How It Works

### 1. Authentication Flow

```
User enters email + solves CAPTCHA
         ↓
Client sends { email, captchaToken } to /api/auth/signin/email
         ↓
Proxy verifies CAPTCHA with Google
         ↓
On success, sends magic link email
         ↓
User clicks magic link
         ↓
Redirects to dashboard with session cookie
```

### 2. CAPTCHA Configuration

In [proxy.ts](proxy.ts):

```typescript
captcha: {
  provider: {
    type: "recaptcha-v2",
    siteKey: process.env.RECAPTCHA_SITE_KEY!,
    secretKey: process.env.RECAPTCHA_SECRET_KEY!,
  },
  enforceOnEmail: true,      // Require CAPTCHA for email sign-in
  enforceOnTwoFactor: true,  // Require CAPTCHA for 2FA
  enforceOnOAuth: false      // Optional for OAuth
}
```

### 3. Next.js Proxy

The [proxy.ts](proxy.ts) file handles all authentication routes:

- `POST /api/auth/signin/email` - Send magic link
- `GET /api/auth/callback/email` - Verify magic link
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - Sign out

## Alternative CAPTCHA Providers

### reCAPTCHA v3 (Invisible)

```typescript
captcha: {
  provider: {
    type: "recaptcha-v3",
    siteKey: process.env.RECAPTCHA_V3_SITE_KEY!,
    secretKey: process.env.RECAPTCHA_V3_SECRET_KEY!,
    scoreThreshold: 0.5  // 0.0 (bot) to 1.0 (human)
  }
}
```

Client-side (app/signin/page.tsx):
```typescript
// Load reCAPTCHA v3
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

// Execute on form submit
const token = await grecaptcha.execute('YOUR_SITE_KEY', { action: 'login' });
```

### hCaptcha

```typescript
captcha: {
  provider: {
    type: "hcaptcha",
    siteKey: process.env.HCAPTCHA_SITE_KEY!,
    secretKey: process.env.HCAPTCHA_SECRET_KEY!
  }
}
```

Client-side:
```html
<script src="https://js.hcaptcha.com/1/api.js" async defer></script>
<div class="h-captcha" data-sitekey="YOUR_SITE_KEY"></div>
```

### Cloudflare Turnstile

```typescript
captcha: {
  provider: {
    type: "turnstile",
    siteKey: process.env.TURNSTILE_SITE_KEY!,
    secretKey: process.env.TURNSTILE_SECRET_KEY!
  }
}
```

Client-side:
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
```

## Customization

### Change Email Provider

Edit [proxy.ts](proxy.ts) to use Nodemailer instead of Resend:

```typescript
provider: email({
  from: "noreply@example.com",
  service: {
    type: "nodemailer",
    server: "smtp.gmail.com:587",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    }
  }
})
```

### Customize UI

All styles are in Tailwind CSS. Edit the pages in `app/` to change colors, layout, etc.

### Add Database Integration

Replace the callback in [proxy.ts](proxy.ts):

```typescript
callbacks: {
  async user(u) {
    // Fetch or create user in your database
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name },
      update: { name: u.name }
    });
    return user;
  }
}
```

## Production Deployment

### 1. Environment Variables

Set these in your hosting platform:

- `AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `RESEND_API_KEY` - Your Resend API key
- `RECAPTCHA_SITE_KEY` - Production site key
- `RECAPTCHA_SECRET_KEY` - Production secret key
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` - Same as site key

### 2. reCAPTCHA Domain

Add your production domain in the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).

### 3. HTTPS Required

CAPTCHA providers require HTTPS in production. Ensure your deployment uses SSL.

### 4. Resend Domain

Verify your sending domain in Resend for production use.

## Troubleshooting

### CAPTCHA Not Showing

- Check `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set correctly
- Verify the script is loading (check browser console)
- Check for Content Security Policy (CSP) blocking scripts

### "CAPTCHA token required" Error

- Ensure the CAPTCHA is solved before submitting
- Check that `window.grecaptcha.getResponse()` returns a token
- Verify the client-side site key matches server-side

### Magic Link Not Sending

- Check Resend API key is correct
- Verify your email domain is verified in Resend
- Check server logs for email errors

### Session Not Persisting

- Verify `AUTH_SECRET` is set
- Check cookies are enabled in browser
- Ensure HTTPS is used (required for secure cookies)

## Learn More

- [CAPTCHA Integration Guide](../../content/docs/03-guides/captcha-integration.mdx)
- [@warpy-auth-sdk/core Documentation](../../CLAUDE.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [Resend Documentation](https://resend.com/docs)

## License

MIT - See [LICENSE](../../LICENSE) for details
