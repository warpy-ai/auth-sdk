import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://warpy-auth-sdk.vercel.app';
const ogImageUrl = `${siteUrl}/api/og?title=${encodeURIComponent('Playground')}&description=${encodeURIComponent('Interactive authentication examples')}`;

export const metadata: Metadata = {
  title: "Playground",
  description: "Try out @warpy-auth-sdk/core with interactive examples. Test OAuth, magic links, and session management.",
  openGraph: {
    title: "Playground",
    description: "Try out @warpy-auth-sdk/core with interactive examples",
    type: "website",
    url: `${siteUrl}/playground`,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Playground",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Playground",
    description: "Try out @warpy-auth-sdk/core with interactive examples",
    images: [ogImageUrl],
    creator: "@warpy_ai",
  },
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
