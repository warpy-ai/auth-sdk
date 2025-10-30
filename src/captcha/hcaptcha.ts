import type {
  CaptchaProvider,
  CaptchaVerificationResult,
  HCaptchaConfig,
} from "./types";

/**
 * hCaptcha provider (privacy-focused alternative to reCAPTCHA)
 *
 * @example
 * const captcha = createHCaptcha({
 *   type: 'hcaptcha',
 *   siteKey: process.env.HCAPTCHA_SITE_KEY!,
 *   secretKey: process.env.HCAPTCHA_SECRET_KEY!
 * });
 *
 * const result = await captcha.verify(token, remoteIp);
 * if (result.success) {
 *   // CAPTCHA verified
 * }
 */
export function createHCaptcha(config: HCaptchaConfig): CaptchaProvider {
  const verifyUrl = config.verifyUrl || "https://hcaptcha.com/siteverify";

  return {
    type: "hcaptcha",
    siteKey: config.siteKey,

    async verify(
      token: string,
      remoteIp?: string
    ): Promise<CaptchaVerificationResult> {
      try {
        // Build request body
        const params = new URLSearchParams({
          secret: config.secretKey,
          response: token,
        });

        if (remoteIp) {
          params.append("remoteip", remoteIp);
        }

        // Make verification request
        const response = await fetch(verifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        if (!response.ok) {
          return {
            success: false,
            errorCodes: ["http-error"],
          };
        }

        const data = await response.json();

        return {
          success: data.success === true,
          errorCodes: data["error-codes"] || [],
          challengeTs: data.challenge_ts,
          hostname: data.hostname,
        };
      } catch (error) {
        return {
          success: false,
          errorCodes: [
            "network-error",
            error instanceof Error ? error.message : "unknown",
          ],
        };
      }
    },
  };
}
