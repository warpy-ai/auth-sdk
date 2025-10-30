export interface CaptchaVerificationResult {
    success: boolean;
    errorCodes?: string[];
    score?: number;
    challengeTs?: string;
    hostname?: string;
}
export interface CaptchaProvider {
    type: "recaptcha-v2" | "recaptcha-v3" | "hcaptcha" | "turnstile";
    siteKey: string;
    verify(token: string, remoteIp?: string): Promise<CaptchaVerificationResult>;
}
export interface RecaptchaV2Config {
    type: "recaptcha-v2";
    siteKey: string;
    secretKey: string;
    verifyUrl?: string;
}
export interface RecaptchaV3Config {
    type: "recaptcha-v3";
    siteKey: string;
    secretKey: string;
    scoreThreshold?: number;
    verifyUrl?: string;
}
export interface HCaptchaConfig {
    type: "hcaptcha";
    siteKey: string;
    secretKey: string;
    verifyUrl?: string;
}
export interface TurnstileConfig {
    type: "turnstile";
    siteKey: string;
    secretKey: string;
    verifyUrl?: string;
}
export type CaptchaConfig = RecaptchaV2Config | RecaptchaV3Config | HCaptchaConfig | TurnstileConfig;
export interface CaptchaEnforcement {
    provider: CaptchaConfig;
    enforceOnEmail?: boolean;
    enforceOnTwoFactor?: boolean;
    enforceOnOAuth?: boolean;
}
