import type {
  CaptchaProvider,
  CaptchaVerificationResult,
  RecaptchaV3Config,
} from "./types";

/**
 * Google reCAPTCHA v3 provider (invisible, score-based)
 *
 * reCAPTCHA v3 returns a score (0.0 - 1.0) indicating the likelihood that
 * the interaction is legitimate. Higher scores indicate higher confidence
 * that the user is human.
 *
 * Recommended score thresholds:
 * - 0.9+: Very likely human
 * - 0.7-0.9: Likely human
 * - 0.5-0.7: Neutral
 * - 0.3-0.5: Suspicious
 * - <0.3: Very likely bot
 *
 * @example
 * const captcha = createRecaptchaV3({
 *   type: 'recaptcha-v3',
 *   siteKey: process.env.RECAPTCHA_V3_SITE_KEY!,
 *   secretKey: process.env.RECAPTCHA_V3_SECRET_KEY!,
 *   scoreThreshold: 0.5
 * });
 *
 * const result = await captcha.verify(token, remoteIp);
 * if (result.success && result.score >= 0.5) {
 *   // CAPTCHA verified and score meets threshold
 * }
 */
export function createRecaptchaV3(config: RecaptchaV3Config): CaptchaProvider {
  const verifyUrl =
    config.verifyUrl || "https://www.google.com/recaptcha/api/siteverify";
  const scoreThreshold = config.scoreThreshold ?? 0.5;

  return {
    type: "recaptcha-v3",
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

        // reCAPTCHA v3 returns a score (0.0 - 1.0)
        const score = typeof data.score === "number" ? data.score : 0;

        // Verify both the response success and score threshold
        const success = data.success === true && score >= scoreThreshold;

        return {
          success,
          errorCodes:
            data["error-codes"] ||
            (!success && score < scoreThreshold ? ["score-too-low"] : []),
          score,
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
