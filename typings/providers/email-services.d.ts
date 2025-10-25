import type * as React from "react";
export interface EmailService {
    send(params: SendEmailParams): Promise<void>;
}
export interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    from: string;
}
export interface NodemailerServiceConfig {
    type: "nodemailer";
    server: string;
    auth?: {
        user: string;
        pass: string;
    };
    secure?: boolean;
}
export declare class NodemailerService implements EmailService {
    private transporter;
    constructor(config: NodemailerServiceConfig);
    send(params: SendEmailParams): Promise<void>;
}
export interface ResendServiceConfig {
    type: "resend";
    apiKey: string;
}
export declare class ResendService implements EmailService {
    private resend;
    constructor(config: ResendServiceConfig);
    send(params: SendEmailParams): Promise<void>;
}
export type EmailServiceConfig = NodemailerServiceConfig | ResendServiceConfig;
export declare function createEmailService(config: EmailServiceConfig): EmailService;
export interface EmailTemplate {
    component: React.ReactElement;
    subject: string;
}
export declare function renderEmailTemplate(template: React.ReactElement): Promise<string>;
