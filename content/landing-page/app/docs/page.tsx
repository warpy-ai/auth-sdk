import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Code, Rocket, Settings } from "lucide-react";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://warpy-auth-sdk.vercel.app';
const ogImageUrl = `${siteUrl}/api/og?title=${encodeURIComponent('Documentation')}&description=${encodeURIComponent('Everything you need to build secure authentication')}`;

export const metadata: Metadata = {
  title: "Documentation",
  description: "Everything you need to build secure authentication with @warpy-auth-sdk/core. Complete guides, API reference, and examples.",
  openGraph: {
    title: "Documentation",
    description: "Everything you need to build secure authentication with @warpy-auth-sdk/core",
    type: "website",
    url: `${siteUrl}/docs`,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Documentation",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Documentation",
    description: "Everything you need to build secure authentication with @warpy-auth-sdk/core",
    images: [ogImageUrl],
    creator: "@warpy_ai",
  },
};

const docSections = [
  {
    icon: Rocket,
    title: "Getting Started",
    description:
      "Install @warpy-auth-sdk/core and set up your first authentication flow in minutes.",
    href: "/docs/getting-started/installation",
  },
  {
    icon: Settings,
    title: "Providers",
    description:
      "Configure OAuth providers, email magic links, and custom authentication methods.",
    href: "/docs/providers/overview",
  },
  {
    icon: Code,
    title: "API Reference",
    description:
      "Complete API documentation for all methods, types, and configuration options.",
    href: "/docs/api/core-functions",
  },
  {
    icon: BookOpen,
    title: "MCP Integration",
    description:
      "Enable AI agents to authenticate on behalf of users with the Model Context Protocol.",
    href: "/docs/mcp/introduction",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to build secure authentication with
              @warpy-auth-sdk/core
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 mb-12">
            {docSections.map((section) => (
              <Card
                key={section.title}
                className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed mb-4">
                    {section.description}
                  </CardDescription>
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <Link href={section.href}>Read more →</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Install and configure @warpy-auth-sdk/core in your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Install the package</h3>
                <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-4">
                  <code className="text-sm font-mono">
                    npm install @warpy-auth-sdk/core
                  </code>
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  2. Set up environment variables
                </h3>
                <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-4">
                  <code className="text-sm font-mono">
                    {`AUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google`}
                  </code>
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  3. Create your auth handler
                </h3>
                <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-4">
                  <code className="text-sm font-mono">
                    {`import { authMiddleware } from "@warpy-auth-sdk/core/next";
import { google } from "@warpy-auth-sdk/core";

export const handler = authMiddleware({
  secret: process.env.AUTH_SECRET!,
  provider: google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  }),
});`}
                  </code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
