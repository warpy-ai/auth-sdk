// src/providers/email.ts
export function email(options: { server: string; from: string }) {
  return {
    type: "email",
    async sendMagicLink(email: string) {
      // Use nodemailer or similar to send link
    },
    async verify(token: string) {
      // Validate token
    },
    ...options,
  };
}
