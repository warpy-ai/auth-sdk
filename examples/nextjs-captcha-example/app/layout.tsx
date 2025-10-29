import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js CAPTCHA Example",
  description: "Authentication with CAPTCHA protection using @warpy-auth-sdk/core",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
