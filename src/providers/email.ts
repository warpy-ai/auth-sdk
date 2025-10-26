import type * as React from "react";
import type { EmailProviderConfig } from "./types";
import { createMagicToken, verifyMagicToken } from "../utils/tokens";
import {
  createEmailService,
  renderEmailTemplate,
  type EmailServiceConfig,
} from "./email-services";
import MagicLinkEmail from "./email-templates/MagicLinkEmail";

/**
 * Custom email template configuration
 */
export interface CustomEmailTemplate {
  /**
   * React Email component to render
   * Receives { magicLink: string } as props
   */
  component: (props: { magicLink: string }) => React.ReactElement;
  /**
   * Email subject line
   */
  subject: string;
}

/**
 * Email provider configuration options
 */
export interface EmailProviderOptions {
  /**
   * From email address
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
  template?: CustomEmailTemplate;

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

/**
 * Email provider for magic link authentication
 *
 * Supports:
 * - Nodemailer (SMTP)
 * - Resend
 * - React Email templates
 * - Custom templates
 *
 * @example
 * // With Nodemailer
 * email({
 *   from: 'noreply@example.com',
 *   service: {
 *     type: 'nodemailer',
 *     server: 'smtp.gmail.com:587',
 *     auth: {
 *       user: 'user@gmail.com',
 *       pass: 'app-password'
 *     }
 *   }
 * })
 *
 * @example
 * // With Resend
 * email({
 *   from: 'noreply@example.com',
 *   service: {
 *     type: 'resend',
 *     apiKey: process.env.RESEND_API_KEY!
 *   }
 * })
 *
 * @example
 * // With custom template
 * email({
 *   from: 'noreply@example.com',
 *   service: { type: 'resend', apiKey: process.env.RESEND_API_KEY! },
 *   template: {
 *     component: ({ magicLink }) => (
 *       <MyCustomEmail magicLink={magicLink} />
 *     ),
 *     subject: 'Custom Sign In'
 *   }
 * })
 */
export function email(options: EmailProviderOptions): EmailProviderConfig {
  const emailService = createEmailService(options.service);
  const expirationMinutes = options.expirationMinutes ?? 15;

  return {
    type: "email",
    server: "service" in options.service ? options.service.type : "unknown",
    from: options.from,

    async sendMagicLink(email: string, url: string): Promise<void> {
      // Generate magic link token (convert minutes to milliseconds)
      const token = createMagicToken(
        email,
        undefined,
        expirationMinutes * 60 * 1000
      );
      const magicLink = `${url}?token=${token}`;

      // Render email HTML
      let html: string;
      let subject: string;

      if (options.template) {
        // Use custom template
        const templateElement = options.template.component({ magicLink });
        html = await renderEmailTemplate(templateElement);
        subject = options.template.subject;
      } else {
        // Use default template
        const defaultTemplate = MagicLinkEmail({
          magicLink,
          appName: options.appName,
          companyName: options.companyName,
          expirationMinutes,
        });
        html = await renderEmailTemplate(defaultTemplate);
        subject = `Sign in to ${options.appName || "Your App"}`;
      }

      // Send email
      await emailService.send({
        to: email,
        subject,
        html,
        from: options.from,
      });
    },

    // eslint-disable-next-line require-await
    async verify(
      token: string
    ): Promise<{ email: string; userId?: string } | null> {
      return verifyMagicToken(token);
    },
  };
}
