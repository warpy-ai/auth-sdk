import type { CaptchaConfig, CaptchaProvider } from "./types";
import { createRecaptchaV2 } from "./recaptcha-v2";
import { createRecaptchaV3 } from "./recaptcha-v3";
import { createHCaptcha } from "./hcaptcha";
import { createTurnstile } from "./turnstile";

/**
 * Create a CAPTCHA provider from configuration
 *
 * @example
 * // reCAPTCHA v2
 * const captcha = createCaptchaProvider({
 *   type: 'recaptcha-v2',
 *   siteKey: process.env.RECAPTCHA_SITE_KEY!,
 *   secretKey: process.env.RECAPTCHA_SECRET_KEY!
 * });
 *
 * @example
 * // reCAPTCHA v3 with custom threshold
 * const captcha = createCaptchaProvider({
 *   type: 'recaptcha-v3',
 *   siteKey: process.env.RECAPTCHA_V3_SITE_KEY!,
 *   secretKey: process.env.RECAPTCHA_V3_SECRET_KEY!,
 *   scoreThreshold: 0.7
 * });
 *
 * @example
 * // hCaptcha
 * const captcha = createCaptchaProvider({
 *   type: 'hcaptcha',
 *   siteKey: process.env.HCAPTCHA_SITE_KEY!,
 *   secretKey: process.env.HCAPTCHA_SECRET_KEY!
 * });
 *
 * @example
 * // Cloudflare Turnstile
 * const captcha = createCaptchaProvider({
 *   type: 'turnstile',
 *   siteKey: process.env.TURNSTILE_SITE_KEY!,
 *   secretKey: process.env.TURNSTILE_SECRET_KEY!
 * });
 */
export function createCaptchaProvider(config: CaptchaConfig): CaptchaProvider {
  switch (config.type) {
    case "recaptcha-v2":
      return createRecaptchaV2(config);
    case "recaptcha-v3":
      return createRecaptchaV3(config);
    case "hcaptcha":
      return createHCaptcha(config);
    case "turnstile":
      return createTurnstile(config);
    default: {
      const exhaustiveCheck: never = config;
      throw new Error(
        `Unsupported CAPTCHA provider type: ${(exhaustiveCheck as CaptchaConfig).type}`
      );
    }
  }
}

// Re-export types and individual providers
export type {
  CaptchaConfig,
  CaptchaProvider,
  CaptchaVerificationResult,
  CaptchaEnforcement,
  RecaptchaV2Config,
  RecaptchaV3Config,
  HCaptchaConfig,
  TurnstileConfig,
} from "./types";

export { createRecaptchaV2 } from "./recaptcha-v2";
export { createRecaptchaV3 } from "./recaptcha-v3";
export { createHCaptcha } from "./hcaptcha";
export { createTurnstile } from "./turnstile";
