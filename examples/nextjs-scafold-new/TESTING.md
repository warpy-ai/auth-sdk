# Testing Guide - Email Magic Link with Resend

This guide will help you test the email magic link functionality in this example.

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month)
2. **Domain Verification** (Optional for testing): You can use Resend's test domain for development

## Setup Steps

### 1. Get Your Resend API Key

1. Log in to [Resend](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Click "Create API Key"
4. Give it a name (e.g., "Dev Testing")
5. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Required
AUTH_SECRET=your-secret-key-at-least-32-characters-long
RESEND_API_KEY=re_your_actual_api_key_here

# Email sender (use your verified domain or Resend's test domain)
EMAIL_FROM=onboarding@resend.dev  # For testing
# EMAIL_FROM=noreply@yourdomain.com  # For production
```

**Important Notes:**
- `onboarding@resend.dev` is Resend's test email domain - works immediately
- For production, verify your own domain at [resend.com/domains](https://resend.com/domains)
- The `AUTH_SECRET` should be at least 32 characters for security

### 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

## Testing the Email Flow

### Step 1: Open Browser Console

1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to the Console tab
3. Keep it open to see debug logs

### Step 2: Submit Email

1. Enter your email address in the form
2. Click "Send magic link"
3. Watch the console for:
   ```
   📧 Sending magic link to: your@email.com
   📬 Response status: 200
   📦 Response data: { success: true }
   ```

### Step 3: Check Email

1. Check your inbox for an email from `onboarding@resend.dev` (or your configured sender)
2. Subject: "Sign in to Next.js Auth Example"
3. The email should have:
   - App name and branding
   - Blue "Sign In" button
   - Fallback text link
   - Expiration warning (15 minutes)

### Step 4: Click Magic Link

1. Click the "Sign In" button in the email
2. You should be redirected to `/dashboard`
3. Your session is now active!

## Troubleshooting

### Issue: "Provider not found" error

**Solution**: Check that your proxy.ts has the email provider configured:

```typescript
const providers = {
  // ... other providers
  email: email({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    service: {
      type: 'resend',
      apiKey: process.env.RESEND_API_KEY!,
    },
  }),
};
```

### Issue: "Invalid API key" or 403 error

**Solution**:
1. Double-check your `RESEND_API_KEY` in `.env.local`
2. Make sure there are no extra spaces
3. Restart the dev server after changing env variables

### Issue: Email not received

**Possible causes**:
1. **Wrong sender email**: Use `onboarding@resend.dev` for testing
2. **Spam folder**: Check your spam/junk folder
3. **API key permissions**: Make sure the API key has "send" permissions
4. **Rate limits**: Free tier has 100 emails/day limit

**To debug**:
1. Check the console logs for response status
2. Check Resend dashboard for logs: [resend.com/emails](https://resend.com/emails)
3. Look for error messages in the response data

### Issue: Magic link doesn't work

**Solution**:
1. Make sure you're using the full URL (starts with `http://localhost:3000`)
2. Check that the link hasn't expired (15 minutes default)
3. Magic links are single-use - request a new one if needed

### Issue: CORS or network errors

**Solution**:
1. Make sure you're running on `localhost:3000`
2. Check that the proxy is correctly routing `/api/auth/*` requests
3. Restart the dev server

## Console Debug Logs

You should see these logs in the browser console:

**On form submit:**
```
📧 Sending magic link to: user@example.com
```

**On successful API call:**
```
📬 Response status: 200
📦 Response data: { success: true }
```

**On error:**
```
❌ Failed to send magic link: [error details]
```

## Testing with Multiple Providers

This example supports Google, GitHub, and Email simultaneously!

### Test All Three:

1. **Google**: Click "Continue with Google" button
2. **GitHub**: Click "Continue with GitHub" button
3. **Email**: Use the email form

All three will work at the same time - users can choose their preferred method!

## Production Considerations

Before deploying to production:

1. **Verify Your Domain**:
   - Go to [resend.com/domains](https://resend.com/domains)
   - Add your domain (e.g., `yourdomain.com`)
   - Add DNS records (SPF, DKIM, DMARC)
   - Wait for verification
   - Update `EMAIL_FROM=noreply@yourdomain.com`

2. **Secure Your Secrets**:
   - Use a strong `AUTH_SECRET` (32+ characters)
   - Never commit `.env.local` to git
   - Use environment variables in your hosting platform

3. **Monitor Email Deliverability**:
   - Check Resend dashboard for delivery stats
   - Monitor bounce and complaint rates
   - Set up webhooks for delivery notifications

4. **Customize the Template**:
   - Use your app's branding
   - Add your logo
   - Customize colors and messaging
   - See [Email Provider Guide](../../docs/Email-Provider-Guide.md)

## Need Help?

- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **Auth SDK Docs**: [Email Provider Guide](../../docs/Email-Provider-Guide.md)
- **Example Issues**: Check the console logs first!
- **Resend Support**: support@resend.com

## Quick Reference

```env
# Minimal working config
AUTH_SECRET=your-32-char-secret-key-here-abcdefgh
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=onboarding@resend.dev
```

```bash
# Start testing
npm run dev
# Open http://localhost:3000/login
# Enter email → Check inbox → Click link → Success! 🎉
```
