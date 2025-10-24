import * as nodemailer from "nodemailer";
import type { EmailProviderConfig } from "./types";
import { createMagicToken, verifyMagicToken } from "../utils/tokens";

export interface EmailProviderOptions {
  server: string; // SMTP server URL (e.g., smtp.gmail.com:587)
  from: string; // From email address
  auth?: {
    user: string;
    pass: string;
  };
}

export function email(options: EmailProviderOptions): EmailProviderConfig {
  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: options.server.split(":")[0],
    port: parseInt(options.server.split(":")[1] || "587"),
    secure: false, // Use TLS
    auth: options.auth,
  });

  return {
    type: "email",
    server: options.server,
    from: options.from,

    async sendMagicLink(email: string, url: string): Promise<void> {
      // Generate magic link token (valid for 15 minutes)
      const token = createMagicToken(email);
      const magicLink = `${url}?token=${token}`;

      // Send email
      await transporter.sendMail({
        from: options.from,
        to: email,
        subject: "Sign in to your account",
        html: `
          <div>
            <h2>Sign in to your account</h2>
            <p>Click the link below to sign in. This link will expire in 15 minutes.</p>
            <a href="${magicLink}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
              Sign In
            </a>
            <p style="color: #666; margin-top: 20px;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        `,
      });
    },

    verify(token: string): Promise<{ email: string; userId?: string } | null> {
      return verifyMagicToken(token);
    },
  };
}
