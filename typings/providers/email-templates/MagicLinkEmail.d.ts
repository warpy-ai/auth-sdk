import * as React from "react";
export interface MagicLinkEmailProps {
    magicLink: string;
    appName?: string;
    expirationMinutes?: number;
    companyName?: string;
    companyLogo?: string;
}
export declare function MagicLinkEmail({ magicLink, appName, expirationMinutes, companyName, companyLogo, }: MagicLinkEmailProps): React.JSX.Element;
export default MagicLinkEmail;
