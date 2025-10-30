import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Import all MDX files from the local docs directory (copied during build)
import Installation from "../../../docs/01-getting-started/01-installation.mdx";
import Quickstart from "../../../docs/01-getting-started/02-quickstart.mdx";
import EnvironmentSetup from "../../../docs/01-getting-started/03-environment-setup.mdx";
import FirstAuthFlow from "../../../docs/01-getting-started/04-first-auth-flow.mdx";

import ProvidersOverview from "../../../docs/02-providers/01-overview.mdx";
import GoogleOAuth from "../../../docs/02-providers/02-google-oauth.mdx";
import EmailMagicLinks from "../../../docs/02-providers/03-email-magic-links.mdx";
import CustomProviders from "../../../docs/02-providers/04-custom-providers.mdx";
import TwoFactorEmail from "../../../docs/02-providers/05-two-factor-email.mdx";
import GitHubOAuth from "../../../docs/02-providers/06-github-oauth.mdx";
import GitLabOAuth from "../../../docs/02-providers/07-gitlab-oauth.mdx";
import LinkedInOAuth from "../../../docs/02-providers/08-linkedin-oauth.mdx";
import MicrosoftOAuth from "../../../docs/02-providers/09-microsoft-oauth.mdx";
import SpotifyOAuth from "../../../docs/02-providers/10-spotify-oauth.mdx";
import DiscordOAuth from "../../../docs/02-providers/11-discord-oauth.mdx";
import TwitchOAuth from "../../../docs/02-providers/12-twitch-oauth.mdx";
import EpicGamesOAuth from "../../../docs/02-providers/13-epic-games-oauth.mdx";

import ExpressAdapter from "../../../docs/03-guides/01-express-adapter.mdx";
import HonoAdapter from "../../../docs/03-guides/02-hono-adapter.mdx";
import NodejsAdapter from "../../../docs/03-guides/03-nodejs-adapter.mdx";
import TwoFactorAuthentication from "../../../docs/03-guides/04-two-factor-authentication.mdx";
import CaptchaIntegration from "../../../docs/03-guides/05-captcha-integration.mdx";

import MCPIntroduction from "../../../docs/04-mcp/01-introduction.mdx";
import CoreFunctions from "../../../docs/05-api-reference/01-core-functions.mdx";
import NextJSAppRouter from "../../../docs/06-examples/01-nextjs-app-router.mdx";

// Route mapping
const routes: Record<string, React.ComponentType> = {
  "getting-started/installation": Installation,
  "getting-started/quickstart": Quickstart,
  "getting-started/environment-setup": EnvironmentSetup,
  "getting-started/first-auth-flow": FirstAuthFlow,
  "providers/overview": ProvidersOverview,
  "providers/google-oauth": GoogleOAuth,
  "providers/email-magic-links": EmailMagicLinks,
  "providers/custom-providers": CustomProviders,
  "providers/two-factor-email": TwoFactorEmail,
  "providers/github-oauth": GitHubOAuth,
  "providers/gitlab-oauth": GitLabOAuth,
  "providers/linkedin-oauth": LinkedInOAuth,
  "providers/microsoft-oauth": MicrosoftOAuth,
  "providers/spotify-oauth": SpotifyOAuth,
  "providers/discord-oauth": DiscordOAuth,
  "providers/twitch-oauth": TwitchOAuth,
  "providers/epic-games-oauth": EpicGamesOAuth,
  "guides/express-adapter": ExpressAdapter,
  "guides/hono-adapter": HonoAdapter,
  "guides/nodejs-adapter": NodejsAdapter,
  "guides/two-factor-authentication": TwoFactorAuthentication,
  "guides/captcha-integration": CaptchaIntegration,
  "mcp/introduction": MCPIntroduction,
  "api/core-functions": CoreFunctions,
  "examples/nextjs-app-router": NextJSAppRouter,
};

// Navigation structure
const navigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Installation", href: "/docs/getting-started/installation" },
      { title: "Quickstart", href: "/docs/getting-started/quickstart" },
      {
        title: "Environment Setup",
        href: "/docs/getting-started/environment-setup",
      },
      {
        title: "First Auth Flow",
        href: "/docs/getting-started/first-auth-flow",
      },
    ],
  },
  {
    title: "Providers",
    items: [
      { title: "Overview", href: "/docs/providers/overview" },
      { title: "Google OAuth", href: "/docs/providers/google-oauth" },
      { title: "Email Magic Links", href: "/docs/providers/email-magic-links" },
      { title: "Custom Providers", href: "/docs/providers/custom-providers" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Express Adapter", href: "/docs/guides/express-adapter" },
      { title: "Hono Adapter", href: "/docs/guides/hono-adapter" },
      { title: "Node.js Adapter", href: "/docs/guides/nodejs-adapter" },
      {
        title: "Two-Factor Authentication",
        href: "/docs/guides/two-factor-authentication",
      },
      {
        title: "CAPTCHA Integration",
        href: "/docs/guides/captcha-integration",
      },
    ],
  },
  {
    title: "MCP",
    items: [
      { title: "Introduction", href: "/docs/mcp/introduction" },
      { title: "Agent Authentication", href: "/docs/mcp/agent-authentication" },
      { title: "Tools Reference", href: "/docs/mcp/tools-reference" },
      { title: "AI SDK Integration", href: "/docs/mcp/ai-sdk-integration" },
      { title: "Security Model", href: "/docs/mcp/security-model" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "Core Functions", href: "/docs/api/core-functions" },
      { title: "Provider API", href: "/docs/api/provider-api" },
      { title: "Adapter API", href: "/docs/api/adapter-api" },
      { title: "React Hooks", href: "/docs/api/react-hooks" },
      { title: "Next Integration", href: "/docs/api/next-integration" },
      { title: "TypeScript Types", href: "/docs/api/typescript-types" },
    ],
  },
  {
    title: "Examples",
    items: [
      { title: "Next.js App Router", href: "/docs/examples/nextjs-app-router" },
      { title: "Google OAuth Flow", href: "/docs/examples/google-oauth-flow" },
      {
        title: "Email Passwordless",
        href: "/docs/examples/email-passwordless",
      },
      { title: "Protected Routes", href: "/docs/examples/protected-routes" },
      { title: "MCP Agent Login", href: "/docs/examples/mcp-agent-login" },
    ],
  },
  {
    title: "Advanced",
    items: [
      { title: "Callbacks", href: "/docs/advanced/callbacks" },
      { title: "Token Management", href: "/docs/advanced/token-management" },
      { title: "Error Handling", href: "/docs/advanced/error-handling" },
      { title: "Testing", href: "/docs/advanced/testing" },
    ],
  },
];

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// Get page metadata helper
const getPageMetadata = (slug: string) => {
  const metadata: Record<string, { title: string; description: string }> = {
    "getting-started/installation": {
      title: "Installation",
      description:
        "Install @warpy-auth-sdk/core and set up your first authentication flow in minutes.",
    },
    "getting-started/quickstart": {
      title: "Quickstart",
      description: "Get up and running with @warpy-auth-sdk/core in 5 minutes.",
    },
    "getting-started/environment-setup": {
      title: "Environment Setup",
      description: "Configure environment variables for @warpy-auth-sdk/core.",
    },
    "getting-started/first-auth-flow": {
      title: "First Auth Flow",
      description:
        "Complete walkthrough of implementing Google OAuth authentication.",
    },
    "providers/overview": {
      title: "Providers Overview",
      description:
        "Understanding the provider architecture in @warpy-auth-sdk/core.",
    },
    "providers/google-oauth": {
      title: "Google OAuth",
      description: "Complete setup guide for Google OAuth authentication.",
    },
    "providers/email-magic-links": {
      title: "Email Magic Links",
      description: "Passwordless authentication with email magic links.",
    },
    "providers/custom-providers": {
      title: "Custom Providers",
      description:
        "Building custom authentication providers for @warpy-auth-sdk/core.",
    },
    "providers/two-factor-email": {
      title: "Two-Factor Email",
      description: "Email-based two-factor authentication with verification codes.",
    },
    "providers/github-oauth": {
      title: "GitHub OAuth",
      description: "Complete setup guide for GitHub OAuth authentication.",
    },
    "providers/gitlab-oauth": {
      title: "GitLab OAuth",
      description: "Complete setup guide for GitLab OAuth authentication.",
    },
    "providers/linkedin-oauth": {
      title: "LinkedIn OAuth",
      description: "Complete setup guide for LinkedIn OAuth authentication.",
    },
    "providers/microsoft-oauth": {
      title: "Microsoft OAuth",
      description: "Complete setup guide for Microsoft/Azure AD OAuth authentication.",
    },
    "providers/spotify-oauth": {
      title: "Spotify OAuth",
      description: "Complete setup guide for Spotify OAuth authentication.",
    },
    "providers/discord-oauth": {
      title: "Discord OAuth",
      description: "Complete setup guide for Discord OAuth authentication.",
    },
    "providers/twitch-oauth": {
      title: "Twitch OAuth",
      description: "Complete setup guide for Twitch OAuth authentication.",
    },
    "providers/epic-games-oauth": {
      title: "Epic Games OAuth",
      description: "Complete setup guide for Epic Games OAuth authentication.",
    },
    "guides/express-adapter": {
      title: "Express Adapter",
      description: "Using @warpy-auth-sdk/core with Express applications.",
    },
    "guides/hono-adapter": {
      title: "Hono Adapter",
      description: "Using @warpy-auth-sdk/core with Hono applications.",
    },
    "guides/nodejs-adapter": {
      title: "Node.js Adapter",
      description: "Using @warpy-auth-sdk/core with pure Node.js HTTP.",
    },
    "guides/two-factor-authentication": {
      title: "Two-Factor Authentication",
      description: "Implementing 2FA using email verification codes.",
    },
    "guides/captcha-integration": {
      title: "CAPTCHA Integration",
      description:
        "Add bot protection to your authentication flows with reCAPTCHA, hCaptcha, and Cloudflare Turnstile.",
    },
    "mcp/introduction": {
      title: "MCP Introduction",
      description:
        "Introduction to Model Context Protocol (MCP) for AI agent authentication.",
    },
    "api/core-functions": {
      title: "Core Functions",
      description: "Core authentication functions in @warpy-auth-sdk/core.",
    },
    "examples/nextjs-app-router": {
      title: "Next.js App Router Example",
      description:
        "Complete Next.js App Router example with @warpy-auth-sdk/core.",
    },
  };
  return (
    metadata[slug] || {
      title: "Documentation",
      description: "Documentation for @warpy-auth-sdk/core",
    }
  );
};

// Generate dynamic metadata for each docs page
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: slugArray } = await params;
  const slug = slugArray.join("/");
  const pageMetadata = getPageMetadata(slug);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://warpy-auth-sdk.vercel.app";
  const ogImageUrl = `${siteUrl}/api/og?title=${encodeURIComponent(pageMetadata.title)}&description=${encodeURIComponent(pageMetadata.description)}`;

  return {
    title: pageMetadata.title,
    description: pageMetadata.description,
    openGraph: {
      title: pageMetadata.title,
      description: pageMetadata.description,
      type: "article",
      url: `${siteUrl}/docs/${slug}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: pageMetadata.title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageMetadata.title,
      description: pageMetadata.description,
      images: [ogImageUrl],
      creator: "@warpy_ai",
    },
  };
}

export default async function DocsPage({ params }: PageProps) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join("/");
  const Component = routes[slug];

  if (!Component) {
    notFound();
  }

  return <Component />;
}

export async function generateStaticParams() {
  return Object.keys(routes).map((slug) => ({
    slug: slug.split("/"),
  }));
}
