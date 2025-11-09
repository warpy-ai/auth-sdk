import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Force Node.js runtime for docs pages (MDX components need React Context)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
import NextJSIntegration from "../../../docs/03-guides/04-nextjs-integration.mdx";
import TwoFactorAuthentication from "../../../docs/03-guides/04-two-factor-authentication.mdx";
import CaptchaIntegration from "../../../docs/03-guides/05-captcha-integration.mdx";
import NextJSProxy from "../../../docs/03-guides/06-nextjs-proxy.mdx";
import ReactHooks from "../../../docs/03-guides/07-react-hooks.mdx";
import SessionManagement from "../../../docs/03-guides/08-session-management.mdx";
import DatabaseAdapters from "../../../docs/03-guides/09-database-adapters.mdx";
import SecurityBestPractices from "../../../docs/03-guides/10-security-best-practices.mdx";
import Deployment from "../../../docs/03-guides/11-deployment.mdx";

import MCPIntroduction from "../../../docs/04-mcp/01-introduction.mdx";
import EfficientMCPAuth from "../../../docs/04-mcp/01-efficient-ai-agent-authentication.mdx";
import CloudShieldIntegration from "../../../docs/04-mcp/02-cloud-shield-integration.mdx";
import MCPToolsReference from "../../../docs/04-mcp/03-tools-reference.mdx";
import CoreFunctions from "../../../docs/05-api-reference/01-core-functions.mdx";
import ProviderAPI from "../../../docs/05-api-reference/02-provider-api.mdx";
import AdapterAPI from "../../../docs/05-api-reference/03-adapter-api.mdx";
import ReactHooksAPI from "../../../docs/05-api-reference/04-react-hooks.mdx";
import NextIntegrationAPI from "../../../docs/05-api-reference/05-next-integration.mdx";
import TypeScriptTypes from "../../../docs/05-api-reference/06-typescript-types.mdx";
import NextJSAppRouter from "../../../docs/06-examples/01-nextjs-app-router.mdx";
import GoogleOAuthFlow from "../../../docs/06-examples/02-google-oauth-flow.mdx";
import EmailPasswordless from "../../../docs/06-examples/03-email-passwordless.mdx";
import MCPAgentLogin from "../../../docs/06-examples/03-mcp-agent-login.mdx";
import ProtectedRoutes from "../../../docs/06-examples/04-protected-routes.mdx";
import Callbacks from "../../../docs/07-advanced/01-callbacks.mdx";
import TokenManagement from "../../../docs/07-advanced/02-token-management.mdx";
import ErrorHandling from "../../../docs/07-advanced/03-error-handling.mdx";
import Testing from "../../../docs/07-advanced/04-testing.mdx";

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
  "guides/nextjs-integration": NextJSIntegration,
  "guides/two-factor-authentication": TwoFactorAuthentication,
  "guides/captcha-integration": CaptchaIntegration,
  "guides/nextjs-proxy": NextJSProxy,
  "guides/react-hooks": ReactHooks,
  "guides/session-management": SessionManagement,
  "guides/database-adapters": DatabaseAdapters,
  "guides/security-best-practices": SecurityBestPractices,
  "guides/deployment": Deployment,
  "mcp/introduction": MCPIntroduction,
  "mcp/efficient-ai-agent-authentication": EfficientMCPAuth,
  "mcp/cloud-shield-integration": CloudShieldIntegration,
  "mcp/tools-reference": MCPToolsReference,
  "api/core-functions": CoreFunctions,
  "api/provider-api": ProviderAPI,
  "api/adapter-api": AdapterAPI,
  "api/react-hooks": ReactHooksAPI,
  "api/next-integration": NextIntegrationAPI,
  "api/typescript-types": TypeScriptTypes,
  "examples/nextjs-app-router": NextJSAppRouter,
  "examples/google-oauth-flow": GoogleOAuthFlow,
  "examples/email-passwordless": EmailPasswordless,
  "examples/protected-routes": ProtectedRoutes,
  "examples/mcp-agent-login": MCPAgentLogin,
  "advanced/callbacks": Callbacks,
  "advanced/token-management": TokenManagement,
  "advanced/error-handling": ErrorHandling,
  "advanced/testing": Testing,
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
      { title: "Next.js Integration", href: "/docs/guides/nextjs-integration" },
      { title: "Next.js Proxy", href: "/docs/guides/nextjs-proxy" },
      { title: "React Hooks", href: "/docs/guides/react-hooks" },
      { title: "Session Management", href: "/docs/guides/session-management" },
      { title: "Database Adapters", href: "/docs/guides/database-adapters" },
      {
        title: "Two-Factor Authentication",
        href: "/docs/guides/two-factor-authentication",
      },
      {
        title: "CAPTCHA Integration",
        href: "/docs/guides/captcha-integration",
      },
      {
        title: "Security Best Practices",
        href: "/docs/guides/security-best-practices",
      },
      { title: "Deployment", href: "/docs/guides/deployment" },
    ],
  },
  {
    title: "MCP (Model Context Protocol)",
    items: [
      {
        title: "Efficient AI Agent Authentication",
        href: "/docs/mcp/efficient-ai-agent-authentication",
      },
      {
        title: "Cloud Shield Integration",
        href: "/docs/mcp/cloud-shield-integration",
      },
      { title: "Tools Reference", href: "/docs/mcp/tools-reference" },
      {
        title: "Vercel AI SDK Integration",
        href: "/docs/mcp/vercel-ai-sdk-integration",
      },
      {
        title: "Security Best Practices",
        href: "/docs/mcp/security-best-practices",
      },
      { title: "Examples & Patterns", href: "/docs/mcp/examples-and-patterns" },
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
      description:
        "Email-based two-factor authentication with verification codes.",
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
      description:
        "Complete setup guide for Microsoft/Azure AD OAuth authentication.",
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
    "guides/nextjs-integration": {
      title: "Next.js Integration",
      description:
        "Integrate @warpy-auth-sdk/core with Next.js App Router and Pages Router.",
    },
    "guides/nextjs-proxy": {
      title: "Next.js Proxy",
      description:
        "Using Next.js 16 Proxy (formerly Middleware) for zero-config authentication.",
    },
    "guides/react-hooks": {
      title: "React Hooks",
      description:
        "Using React hooks for client-side authentication state management.",
    },
    "guides/session-management": {
      title: "Session Management",
      description: "Managing user sessions, tokens, and authentication state.",
    },
    "guides/database-adapters": {
      title: "Database Adapters",
      description:
        "Using database adapters for session persistence and user management.",
    },
    "guides/security-best-practices": {
      title: "Security Best Practices",
      description:
        "Security guidelines and best practices for production authentication.",
    },
    "guides/deployment": {
      title: "Deployment",
      description:
        "Deploying applications with @warpy-auth-sdk/core to production environments.",
    },
    "mcp/introduction": {
      title: "MCP Introduction",
      description:
        "Introduction to Model Context Protocol (MCP) for AI agent authentication.",
    },
    "mcp/efficient-ai-agent-authentication": {
      title: "Efficient AI Agent Authentication with MCP",
      description:
        "Deep dive into using Model Context Protocol (MCP) with code execution for efficient, secure AI agent authentication that reduces token consumption by 90-95%.",
    },
    "mcp/cloud-shield-integration": {
      title: "Warpy Cloud Shield Integration",
      description:
        "Production-grade MCP authentication with managed security, monitoring, and compliance via Warpy Cloud Shield.",
    },
    "mcp/tools-reference": {
      title: "MCP Tools Reference",
      description:
        "Complete API reference for Model Context Protocol (MCP) authentication tools including agent_login, get_session, and revoke_token.",
    },
    "mcp/vercel-ai-sdk-integration": {
      title: "Vercel AI SDK Integration",
      description:
        "Using MCP authentication tools with Vercel AI SDK and popular AI frameworks for efficient agent workflows.",
    },
    "mcp/security-best-practices": {
      title: "MCP Security Best Practices",
      description:
        "Security patterns, scope design, token management, and compliance guidelines for production MCP implementations.",
    },
    "mcp/examples-and-patterns": {
      title: "MCP Examples and Patterns",
      description:
        "Real-world implementation examples and patterns for debugging, automation, data analysis, and customer support agents.",
    },
    "api/core-functions": {
      title: "Core Functions",
      description: "Core authentication functions in @warpy-auth-sdk/core.",
    },
    "api/provider-api": {
      title: "Provider API",
      description: "Complete API reference for authentication providers.",
    },
    "api/adapter-api": {
      title: "Adapter API",
      description: "API reference for framework and database adapters.",
    },
    "api/react-hooks": {
      title: "React Hooks API",
      description: "API reference for React hooks and client-side utilities.",
    },
    "api/next-integration": {
      title: "Next.js Integration API",
      description:
        "API reference for Next.js integration functions and middleware.",
    },
    "api/typescript-types": {
      title: "TypeScript Types",
      description: "Complete TypeScript type definitions and interfaces.",
    },
    "examples/nextjs-app-router": {
      title: "Next.js App Router Example",
      description:
        "Complete Next.js App Router example with @warpy-auth-sdk/core.",
    },
    "examples/google-oauth-flow": {
      title: "Google OAuth Flow Example",
      description:
        "Complete example of implementing Google OAuth authentication flow.",
    },
    "examples/email-passwordless": {
      title: "Email Passwordless Example",
      description:
        "Complete example of passwordless authentication with email magic links.",
    },
    "examples/protected-routes": {
      title: "Protected Routes Example",
      description:
        "Example of protecting routes and pages with authentication.",
    },
    "examples/mcp-agent-login": {
      title: "MCP Agent Login Example",
      description:
        "Complete example of implementing AI agent authentication using Model Context Protocol (MCP) for delegated user access.",
    },
    "advanced/callbacks": {
      title: "Callbacks",
      description:
        "Using callbacks to customize authentication behavior and user data.",
    },
    "advanced/token-management": {
      title: "Token Management",
      description:
        "Advanced token management, refresh, and revocation strategies.",
    },
    "advanced/error-handling": {
      title: "Error Handling",
      description:
        "Handling authentication errors and edge cases in production.",
    },
    "advanced/testing": {
      title: "Testing",
      description:
        "Testing authentication flows, mocking providers, and test utilities.",
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

// Temporarily disabled to fix build - docs will be dynamically rendered
// export async function generateStaticParams() {
//   return Object.keys(routes).map((slug) => ({
//     slug: slug.split("/"),
//   }));
// }
