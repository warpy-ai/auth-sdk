import * as React from "react";
export interface MagicLinkEmailProps {
    magicLink: string;
    appName?: string;
    companyName?: string;
    expirationMinutes?: number;
}
export declare function MagicLinkEmail({ magicLink, appName, companyName, expirationMinutes, }: MagicLinkEmailProps): React.JSX.Element;
export default MagicLinkEmail;
