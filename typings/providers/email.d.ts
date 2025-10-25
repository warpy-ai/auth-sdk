import type * as React from "react";
import type { EmailProviderConfig } from "./types";
import { type EmailServiceConfig } from "./email-services";
export interface CustomEmailTemplate {
    component: (props: {
        magicLink: string;
    }) => React.ReactElement;
    subject: string;
}
export interface EmailProviderOptions {
    from: string;
    service: EmailServiceConfig;
    template?: CustomEmailTemplate;
    appName?: string;
    companyName?: string;
    expirationMinutes?: number;
}
export declare function email(options: EmailProviderOptions): EmailProviderConfig;
