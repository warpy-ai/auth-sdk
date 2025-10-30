import type {
  CaptchaProvider,
  CaptchaVerificationResult,
  TurnstileConfig,
} from "./types";

/**
 * Cloudflare Turnstile provider (lightweight, privacy-focused)
 *
 * @example
 * const captcha = createTurnstile({
 *   type: 'turnstile',
 *   siteKey: process.env.TURNSTILE_SITE_KEY!,
 *   secretKey: process.env.TURNSTILE_SECRET_KEY!
 * });
 *
 * const result = await captcha.verify(token, remoteIp);
 * if (result.success) {
 *   // CAPTCHA verified
 * }
 */
export function createTurnstile(config: TurnstileConfig): CaptchaProvider {
  const verifyUrl =
    config.verifyUrl ||
    "https://challenges.cloudflare.com/turnstile/v0/siteverify";

  return {
    type: "turnstile",
    siteKey: config.siteKey,

    async verify(
      token: string,
      remoteIp?: string
    ): Promise<CaptchaVerificationResult> {
      try {
        // Build request body
        const body: Record<string, string> = {
          secret: config.secretKey,
          response: token,
        };

        if (remoteIp) {
          body.remoteip = remoteIp;
        }

        // Make verification request
        const response = await fetch(verifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
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
