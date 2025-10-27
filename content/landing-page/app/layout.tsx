import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

const siteUrl = "https://www.auth-sdk.dev";
const ogImageUrl = `${siteUrl}/api/og`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "@warpy-auth-sdk/core - Modern Authentication SDK",
    template: "%s | @warpy-auth-sdk/core",
  },
  description:
    "A Modern Authentication SDK for Node.js and React with AI Agent Integration. OAuth, Magic Links, MCP, and Two-Factor Authentication.",
  keywords: [
    "authentication",
    "oauth",
    "jwt",
    "magic links",
    "mcp",
    "two-factor authentication",
    "2fa",
    "node.js",
    "react",
    "next.js",
    "typescript",
    "ai agent",
    "warpy",
  ],
  authors: [{ name: "Warpy Team" }],
  creator: "Warpy",
  publisher: "Warpy",
  generator: "v0.app",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "@warpy-auth-sdk/core - Modern Authentication SDK",
    description:
      "A Modern Authentication SDK for Node.js and React with AI Agent Integration. OAuth, Magic Links, MCP, and Two-Factor Authentication.",
    siteName: "@warpy-auth-sdk/core",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "@warpy-auth-sdk/core - Modern Authentication SDK",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "@warpy-auth-sdk/core - Modern Authentication SDK",
    description:
      "A Modern Authentication SDK for Node.js and React with AI Agent Integration",
    images: [ogImageUrl],
    creator: "@warpy_ai",
    site: "@warpy_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  other: {
    "fb:app_id":
      process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "your-facebook-app-id",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.className} ${geistMono.className} container mx-auto font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
