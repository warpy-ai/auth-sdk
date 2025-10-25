# Email Provider Guide

The auth-sdk email provider supports magic link authentication with multiple email services and customizable React Email templates.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Supported Email Services](#supported-email-services)
- [Basic Usage](#basic-usage)
- [Custom Templates](#custom-templates)
- [Configuration Options](#configuration-options)
- [Examples](#examples)

## Features

- **Multiple Email Services**: Support for Nodemailer (SMTP) and Resend
- **React Email Templates**: Beautiful, responsive email templates using React Email
- **Default Template**: Professional default template included out of the box
- **Custom Templates**: Easy to customize with your own React Email components
- **TypeScript Support**: Full type safety and autocomplete
- **Configurable Expiration**: Set custom token expiration times

## Installation

The email provider requires additional dependencies for email services and templates:

```bash
npm install @warpy-auth-sdk/core resend @react-email/components @react-email/render
```

For Nodemailer (SMTP), nodemailer is already included as a dependency.

## Supported Email Services

### 1. Resend

[Resend](https://resend.com) is a modern email API with excellent developer experience.

**Pros:**
- Simple API
- Great deliverability
- Developer-friendly
- Built-in React Email support
- Generous free tier

**Configuration:**

```typescript
import { email } from '@warpy-auth-sdk/core';

const provider = email({
  from: 'noreply@example.com',
  service: {
    type: 'resend',
    apiKey: process.env.RESEND_API_KEY!
  }
});
```

### 2. Nodemailer (SMTP)

[Nodemailer](https://nodemailer.com) supports any SMTP server (Gmail, SendGrid, Mailgun, etc.).

**Pros:**
- Works with any SMTP server
- Self-hosted option
- Widely supported
- Feature-rich

**Configuration:**

```typescript
import { email } from '@warpy-auth-sdk/core';

const provider = email({
  from: 'noreply@example.com',
  service: {
    type: 'nodemailer',
    server: 'smtp.gmail.com:587',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!
    }
  }
});
```

**Common SMTP Servers:**

- **Gmail**: `smtp.gmail.com:587` (requires app password)
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **AWS SES**: `email-smtp.region.amazonaws.com:587`

## Basic Usage

### With Resend

```typescript
import { authenticate, type AuthConfig } from '@warpy-auth-sdk/core';
import { email } from '@warpy-auth-sdk/core';

const config: AuthConfig = {
  secret: process.env.AUTH_SECRET!,
  provider: email({
    from: 'noreply@yourdomain.com',
    service: {
      type: 'resend',
      apiKey: process.env.RESEND_API_KEY!
    },
    appName: 'My App',
    companyName: 'My Company',
    expirationMinutes: 15
  }),
  callbacks: {
    async user(user) {
      // Your user lookup/creation logic
      return { id: '1', email: user.email };
    }
  }
};

// In your API route
const result = await authenticate(request, config);
```

### With Nodemailer (Gmail)

```typescript
const config: AuthConfig = {
  secret: process.env.AUTH_SECRET!,
  provider: email({
    from: 'noreply@yourdomain.com',
    service: {
      type: 'nodemailer',
      server: 'smtp.gmail.com:587',
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD! // Use app password, not regular password
      }
    },
    appName: 'My App',
    companyName: 'My Company'
  }),
  callbacks: {
    async user(user) {
      return { id: '1', email: user.email };
    }
  }
};
```

## Custom Templates

You can create custom email templates using [React Email](https://react.email) components.

### Creating a Custom Template

Create a new React Email component:

```tsx
// components/CustomMagicLinkEmail.tsx
import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface CustomMagicLinkEmailProps {
  magicLink: string;
}

export function CustomMagicLinkEmail({ magicLink }: CustomMagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your custom preview text</Preview>
      <Body style={{ backgroundColor: '#f0f0f0' }}>
        <Container style={{ padding: '20px' }}>
          <Heading>Welcome Back!</Heading>
          <Text>Click below to access your account:</Text>
          <Button
            href={magicLink}
            style={{
              background: '#007bff',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '5px',
              textDecoration: 'none',
            }}
          >
            Sign In Now
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### Using the Custom Template

```typescript
import { email } from '@warpy-auth-sdk/core';
import { CustomMagicLinkEmail } from './components/CustomMagicLinkEmail';

const provider = email({
  from: 'noreply@example.com',
  service: {
    type: 'resend',
    apiKey: process.env.RESEND_API_KEY!
  },
  template: {
    component: ({ magicLink }) => <CustomMagicLinkEmail magicLink={magicLink} />,
    subject: 'Welcome Back - Sign In'
  }
});
```

## Configuration Options

### EmailProviderOptions

```typescript
interface EmailProviderOptions {
  /**
   * From email address (must be verified with your email service)
   */
  from: string;

  /**
   * Email service configuration (Nodemailer or Resend)
   */
  service: EmailServiceConfig;

  /**
   * Custom React Email template (optional)
   * If not provided, uses the default template
   */
  template?: {
    component: (props: { magicLink: string }) => React.ReactElement;
    subject: string;
  };

  /**
   * App name to display in the default email template
   * @default "Your App"
   */
  appName?: string;

  /**
   * Company name to display in the default email template
   * @default "Your Company"
   */
  companyName?: string;

  /**
   * Token expiration time in minutes
   * @default 15
   */
  expirationMinutes?: number;
}
```

### EmailServiceConfig

```typescript
// Nodemailer
type NodemailerServiceConfig = {
  type: 'nodemailer';
  server: string; // e.g., 'smtp.gmail.com:587'
  auth?: {
    user: string;
    pass: string;
  };
  secure?: boolean; // Use TLS (default: false)
};

// Resend
type ResendServiceConfig = {
  type: 'resend';
  apiKey: string;
};

type EmailServiceConfig = NodemailerServiceConfig | ResendServiceConfig;
```

## Examples

### Example 1: Minimal Configuration with Resend

```typescript
import { email } from '@warpy-auth-sdk/core';

const provider = email({
  from: 'noreply@example.com',
  service: {
    type: 'resend',
    apiKey: process.env.RESEND_API_KEY!
  }
});
```

### Example 2: Custom Branding with Default Template

```typescript
const provider = email({
  from: 'noreply@acmecorp.com',
  service: {
    type: 'resend',
    apiKey: process.env.RESEND_API_KEY!
  },
  appName: 'ACME Dashboard',
  companyName: 'ACME Corporation',
  expirationMinutes: 30
});
```

### Example 3: Gmail SMTP

```typescript
const provider = email({
  from: 'noreply@example.com',
  service: {
    type: 'nodemailer',
    server: 'smtp.gmail.com:587',
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!
    }
  },
  appName: 'My Application'
});
```

### Example 4: SendGrid SMTP

```typescript
const provider = email({
  from: 'noreply@example.com',
  service: {
    type: 'nodemailer',
    server: 'smtp.sendgrid.net:587',
    auth: {
      user: 'apikey', // SendGrid uses 'apikey' as username
      pass: process.env.SENDGRID_API_KEY!
    }
  }
});
```

### Example 5: Full Custom Template

```tsx
import * as React from 'react';
import { email } from '@warpy-auth-sdk/core';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

// Custom template component
function BrandedMagicLink({ magicLink }: { magicLink: string }) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to your account</Preview>
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container>
          <Section style={{ textAlign: 'center' }}>
            <Img
              src="https://yourdomain.com/logo.png"
              width="150"
              alt="Logo"
            />
          </Section>
          <Heading>You're almost there!</Heading>
          <Text>
            Click the button below to securely sign in to your account.
          </Text>
          <Button
            href={magicLink}
            style={{
              backgroundColor: '#5469d4',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              textDecoration: 'none',
              textAlign: 'center',
              display: 'block',
              width: '100%',
              padding: '14px 7px',
            }}
          >
            Sign In to My Account
          </Button>
          <Text style={{ color: '#666', fontSize: '12px' }}>
            This link expires in 15 minutes for security.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Provider configuration
const provider = email({
  from: 'noreply@example.com',
  service: {
    type: 'resend',
    apiKey: process.env.RESEND_API_KEY!
  },
  template: {
    component: ({ magicLink }) => <BrandedMagicLink magicLink={magicLink} />,
    subject: 'Sign in to Your Account'
  }
});
```

## Best Practices

### Email Deliverability

1. **Domain Verification**: Always verify your sending domain with your email service
2. **SPF/DKIM/DMARC**: Configure proper email authentication records
3. **From Address**: Use a real domain you own (not @gmail.com)
4. **Reply-To**: Consider adding a reply-to address for user responses

### Security

1. **Short Expiration**: Keep magic link expiration short (15-30 minutes)
2. **One-Time Use**: Links are automatically invalidated after use
3. **HTTPS Only**: Always use HTTPS URLs for magic links
4. **Rate Limiting**: Implement rate limiting on your sign-in endpoint

### User Experience

1. **Clear Subject Lines**: Use descriptive subject lines
2. **Mobile Friendly**: React Email templates are mobile-responsive by default
3. **Plain Text Alternative**: Consider adding plain text versions
4. **Clear Instructions**: Tell users what to expect and how long the link is valid

## Environment Variables

Create a `.env` file with your credentials:

```env
# Auth secret
AUTH_SECRET=your-secret-key-here

# Resend (option 1)
RESEND_API_KEY=re_xxxxxxxxxxxx

# OR Nodemailer/Gmail (option 2)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# OR SendGrid (option 3)
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
```

## Troubleshooting

### Gmail "Less Secure Apps" Error

Gmail requires app passwords for SMTP access:

1. Enable 2-factor authentication on your Google account
2. Generate an app password at https://myaccount.google.com/apppasswords
3. Use the app password instead of your regular password

### Resend Domain Not Verified

1. Go to https://resend.com/domains
2. Add your domain
3. Add the DNS records to your domain provider
4. Wait for verification (usually a few minutes)

### Emails Going to Spam

1. Verify your domain with SPF/DKIM/DMARC records
2. Use a professional "from" address
3. Avoid spam trigger words in subject lines
4. Monitor your sender reputation

## Advanced Usage

### Using with Next.js 16 Proxy

```typescript
// proxy.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authMiddleware } from '@warpy-auth-sdk/core/next';
import { email } from '@warpy-auth-sdk/core';

const handler = authMiddleware({
  secret: process.env.AUTH_SECRET!,
  provider: email({
    from: 'noreply@yourdomain.com',
    service: {
      type: 'resend',
      apiKey: process.env.RESEND_API_KEY!
    },
    appName: 'My App'
  }),
  callbacks: {
    async user(u) {
      // Your DB logic
      return { id: '1', email: u.email };
    }
  }
}, {
  basePath: '/api/auth'
});

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith('/api/auth')) return handler(request);
  return NextResponse.next();
}
```

### Testing Emails Locally

Use [MailHog](https://github.com/mailhog/MailHog) or [MailDev](https://github.com/maildev/maildev) for local development:

```typescript
const provider = email({
  from: 'test@localhost',
  service: {
    type: 'nodemailer',
    server: 'localhost:1025', // MailHog default port
    auth: undefined // No auth for local testing
  }
});
```

## Related Documentation

- [React Email Documentation](https://react.email/docs/introduction)
- [Resend Documentation](https://resend.com/docs/introduction)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Implementation Guide](./Implementation.md)
- [OAuth Providers Guide](./OAuth-Providers-Guide.md)
