import * as React from "react";
export interface TwoFactorEmailProps {
    code: string;
    appName?: string;
    companyName?: string;
    expirationMinutes?: number;
}
export declare function TwoFactorEmail({ code, appName, companyName: _companyName, expirationMinutes, }: TwoFactorEmailProps): React.JSX.Element;
export default TwoFactorEmail;
