/**
 * CAPTCHA verification result
 */
export interface CaptchaVerificationResult {
  /**
   * Whether the CAPTCHA verification was successful
   */
  success: boolean;

  /**
   * Error codes from the CAPTCHA provider (if verification failed)
   */
  errorCodes?: string[];

  /**
   * Score for risk-based CAPTCHAs (e.g., reCAPTCHA v3)
   * Range: 0.0 (likely bot) to 1.0 (likely human)
   */
  score?: number;

  /**
   * Challenge timestamp from the CAPTCHA provider
   */
  challengeTs?: string;

  /**
   * Hostname where the CAPTCHA was solved
   */
  hostname?: string;
}

/**
 * Base CAPTCHA provider interface
 */
export interface CaptchaProvider {
  /**
   * Provider type identifier
   */
  type: "recaptcha-v2" | "recaptcha-v3" | "hcaptcha" | "turnstile";

  /**
   * Site key for client-side rendering
   */
  siteKey: string;

  /**
   * Verify a CAPTCHA token from the client
   *
   * @param token - The CAPTCHA token to verify
   * @param remoteIp - Optional remote IP address for additional verification
   * @returns Verification result with success status and optional metadata
   */
  verify(token: string, remoteIp?: string): Promise<CaptchaVerificationResult>;
}

/**
 * reCAPTCHA v2 provider configuration
 * Uses checkbox-based challenge
 */
export interface RecaptchaV2Config {
  type: "recaptcha-v2";
  siteKey: string;
  secretKey: string;
  /**
   * Optional custom verification endpoint (default: https://www.google.com/recaptcha/api/siteverify)
   */
  verifyUrl?: string;
}

/**
 * reCAPTCHA v3 provider configuration
 * Uses invisible, score-based risk analysis
 */
export interface RecaptchaV3Config {
  type: "recaptcha-v3";
  siteKey: string;
  secretKey: string;
  /**
   * Minimum score threshold (0.0 - 1.0)
   * @default 0.5
   */
  scoreThreshold?: number;
  /**
   * Optional custom verification endpoint (default: https://www.google.com/recaptcha/api/siteverify)
   */
  verifyUrl?: string;
}

/**
 * hCaptcha provider configuration
 */
export interface HCaptchaConfig {
  type: "hcaptcha";
  siteKey: string;
  secretKey: string;
  /**
   * Optional custom verification endpoint (default: https://hcaptcha.com/siteverify)
   */
  verifyUrl?: string;
}

/**
 * Cloudflare Turnstile provider configuration
 */
export interface TurnstileConfig {
  type: "turnstile";
  siteKey: string;
  secretKey: string;
  /**
   * Optional custom verification endpoint (default: https://challenges.cloudflare.com/turnstile/v0/siteverify)
   */
  verifyUrl?: string;
}

/**
 * Union type of all CAPTCHA provider configurations
 */
export type CaptchaConfig =
  | RecaptchaV2Config
  | RecaptchaV3Config
  | HCaptchaConfig
  | TurnstileConfig;

/**
 * CAPTCHA enforcement configuration
 * Allows selective enforcement for different authentication methods
 */
export interface CaptchaEnforcement {
  /**
   * The CAPTCHA provider configuration
   */
  provider: CaptchaConfig;

  /**
   * Enforce CAPTCHA for email magic link authentication
   * @default true
   */
  enforceOnEmail?: boolean;

  /**
   * Enforce CAPTCHA for two-factor authentication
   * @default true
   */
  enforceOnTwoFactor?: boolean;

  /**
   * Enforce CAPTCHA for OAuth authentication
   * @default false
   */
  enforceOnOAuth?: boolean;
}
