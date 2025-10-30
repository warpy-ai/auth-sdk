import type { CaptchaConfig, CaptchaProvider } from "./types";
export declare function createCaptchaProvider(config: CaptchaConfig): CaptchaProvider;
export type { CaptchaConfig, CaptchaProvider, CaptchaVerificationResult, CaptchaEnforcement, RecaptchaV2Config, RecaptchaV3Config, HCaptchaConfig, TurnstileConfig, } from "./types";
export { createRecaptchaV2 } from "./recaptcha-v2";
export { createRecaptchaV3 } from "./recaptcha-v3";
export { createHCaptcha } from "./hcaptcha";
export { createTurnstile } from "./turnstile";
