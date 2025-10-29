import type {
  CaptchaProvider,
  CaptchaVerificationResult,
  RecaptchaV2Config,
} from "./types";

/**
 * Google reCAPTCHA v2 provider (checkbox-based)
 *
 * @example
 * const captcha = createRecaptchaV2({
 *   type: 'recaptcha-v2',
 *   siteKey: process.env.RECAPTCHA_SITE_KEY!,
 *   secretKey: process.env.RECAPTCHA_SECRET_KEY!
 * });
 *
 * const result = await captcha.verify(token, remoteIp);
 * if (result.success) {
 *   // CAPTCHA verified
 * }
 */
export function createRecaptchaV2(config: RecaptchaV2Config): CaptchaProvider {
  const verifyUrl =
    config.verifyUrl || "https://www.google.com/recaptcha/api/siteverify";

  return {
    type: "recaptcha-v2",
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
