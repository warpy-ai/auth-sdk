import * as nodemailer from "nodemailer";
import { Resend } from "resend";
import { render } from "@react-email/render";
import type * as React from "react";

/**
 * Email service interface for sending emails
 */
export interface EmailService {
  send(params: SendEmailParams): Promise<void>;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from: string;
}

/**
 * Nodemailer email service implementation
 */
export interface NodemailerServiceConfig {
  type: "nodemailer";
  server: string; // SMTP server URL (e.g., smtp.gmail.com:587)
  auth?: {
    user: string;
    pass: string;
  };
  secure?: boolean; // Use TLS (default: false)
}

export class NodemailerService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor(config: NodemailerServiceConfig) {
    const [host, portStr] = config.server.split(":");
    const port = parseInt(portStr || "587", 10);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: config.secure ?? false,
      auth: config.auth,
    });
  }

  async send(params: SendEmailParams): Promise<void> {
    await this.transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  }
}

/**
 * Resend email service implementation
 */
export interface ResendServiceConfig {
  type: "resend";
  apiKey: string;
}

export class ResendService implements EmailService {
  private resend: Resend;

  constructor(config: ResendServiceConfig) {
    this.resend = new Resend(config.apiKey);
  }

  async send(params: SendEmailParams): Promise<void> {
    await this.resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  }
}

/**
 * Email service factory
 */
export type EmailServiceConfig = NodemailerServiceConfig | ResendServiceConfig;

export function createEmailService(config: EmailServiceConfig): EmailService {
  if (config.type === "nodemailer") {
    return new NodemailerService(config);
  } else if (config.type === "resend") {
    return new ResendService(config);
  }
  throw new Error(
    `Unknown email service type: ${(config as { type: string }).type}`
  );
}

/**
 * React Email template renderer
 */
export interface EmailTemplate {
  component: React.ReactElement;
  subject: string;
}

// eslint-disable-next-line require-await
export async function renderEmailTemplate(
  template: React.ReactElement
): Promise<string> {
  return render(template);
}
