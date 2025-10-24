import type { EmailProviderConfig } from './types';
export interface EmailProviderOptions {
    server: string;
    from: string;
    auth?: {
        user: string;
        pass: string;
    };
}
export declare function email(options: EmailProviderOptions): EmailProviderConfig;
