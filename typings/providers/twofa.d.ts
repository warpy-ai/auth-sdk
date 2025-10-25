import type * as React from "react";
import type { TwoFactorProviderConfig } from "./types";
import { type EmailServiceConfig } from "./email-services";
export interface CustomTwoFactorTemplate {
    component: (props: {
        code: string;
    }) => React.ReactElement;
    subject: string;
}
export interface TwoFactorProviderOptions {
    from: string;
    service: EmailServiceConfig;
    template?: CustomTwoFactorTemplate;
    appName?: string;
    companyName?: string;
    expirationMinutes?: number;
}
export declare function twofa(options: TwoFactorProviderOptions): TwoFactorProviderConfig;
