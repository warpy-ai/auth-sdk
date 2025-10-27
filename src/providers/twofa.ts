import type * as React from "react";
import type { TwoFactorProviderConfig } from "./types";
import { createTwoFactorCode, verifyTwoFactorCode } from "../utils/tokens";
import {
  createEmailService,
  renderEmailTemplate,
  type EmailServiceConfig,
} from "./email-services";
import TwoFactorEmail from "./email-templates/TwoFactorEmail";

/**
 * Custom 2FA email template configuration
 */
export interface CustomTwoFactorTemplate {
  /**
   * React Email component to render
   * Receives { code: string } as props
   */
  component: (props: { code: string }) => React.ReactElement;
  /**
   * Email subject line
   */
  subject: string;
}

/**
 * Two-Factor authentication provider configuration options
 */
export interface TwoFactorProviderOptions {
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
  template?: CustomTwoFactorTemplate;

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
   * Code expiration time in minutes
   * @default 5
   */
  expirationMinutes?: number;
}

/**
 * Two-Factor authentication provider for email-based verification codes
 *
 * Sends a 6-digit numeric code to the user's email for login verification.
 * Codes are short-lived (default 5 minutes) and single-use.
 *
 * Supports:
 * - Nodemailer (SMTP)
 * - Resend
 * - React Email templates
 * - Custom templates
 *
 * @example
 * // With Nodemailer
 * twofa({
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
 * twofa({
 *   from: 'noreply@example.com',
 *   service: {
 *     type: 'resend',
 *     apiKey: process.env.RESEND_API_KEY!
 *   }
 * })
 *
 * @example
 * // With custom expiration
 * twofa({
 *   from: 'noreply@example.com',
 *   service: { type: 'resend', apiKey: process.env.RESEND_API_KEY! },
 *   expirationMinutes: 10,
 *   appName: 'My Secure App'
 * })
 */
export function twofa(
  options: TwoFactorProviderOptions
): TwoFactorProviderConfig {
  const emailService = createEmailService(options.service);
  const expirationMinutes = options.expirationMinutes ?? 5;

  return {
    type: "twofa",
    from: options.from,

    async sendCode(
      email: string
    ): Promise<{ identifier: string; expiresIn: number }> {
      // Generate 2FA code (convert minutes to milliseconds)
      const expiresInMs = expirationMinutes * 60 * 1000;
      const { identifier, code } = createTwoFactorCode(
        email,
        undefined,
        expiresInMs
      );

      // Log code in development mode for testing
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `🔐 2FA Code for ${email}: ${code} (expires in ${expirationMinutes} min)`
        );
      }

      // Render email HTML
      let html: string;
      let subject: string;

      if (options.template) {
        // Use custom template
        const templateElement = options.template.component({ code });
        html = await renderEmailTemplate(templateElement);
        subject = options.template.subject;
      } else {
        // Use default template
        const defaultTemplate = TwoFactorEmail({
          code,
          appName: options.appName,
          companyName: options.companyName,
          expirationMinutes,
        });
        html = await renderEmailTemplate(defaultTemplate);
        subject = `Your verification code for ${options.appName || "Your App"}`;
      }

      // Send email
      await emailService.send({
        to: email,
        subject,
        html,
        from: options.from,
      });

      return {
        identifier,
        expiresIn: expiresInMs,
      };
    },

    // eslint-disable-next-line require-await
    async verifyCode(
      identifier: string,
      code: string
    ): Promise<{ email: string; userId?: string } | null> {
      return verifyTwoFactorCode(identifier, code);
    },
  };
}
