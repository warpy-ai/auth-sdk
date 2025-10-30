import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Import all MDX files from the local docs directory (copied during build)
import Installation from "@/docs/01-getting-started/01-installation.mdx";
import Quickstart from "@/docs/01-getting-started/02-quickstart.mdx";
import EnvironmentSetup from "@/docs/01-getting-started/03-environment-setup.mdx";
import FirstAuthFlow from "@/docs/01-getting-started/04-first-auth-flow.mdx";

import ProvidersOverview from "@/docs/02-providers/01-overview.mdx";
import GoogleOAuth from "@/docs/02-providers/02-google-oauth.mdx";
import EmailMagicLinks from "@/docs/02-providers/03-email-magic-links.mdx";
import CustomProviders from "@/docs/02-providers/04-custom-providers.mdx";

// import MCPIntroduction from "@/docs/04-mcp/01-introduction.mdx";
import CoreFunctions from "@/docs/05-api-reference/01-core-functions.mdx";
import NextJSAppRouter from "@/docs/06-examples/01-nextjs-app-router.mdx";

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
  // "mcp/introduction": MCPIntroduction,
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
      { title: "Next.js Integration", href: "/docs/guides/nextjs-integration" },
      { title: "Next.js Proxy", href: "/docs/guides/nextjs-proxy" },
      { title: "React Hooks", href: "/docs/guides/react-hooks" },
      { title: "Session Management", href: "/docs/guides/session-management" },
      { title: "Database Adapters", href: "/docs/guides/database-adapters" },
      {
        title: "Security Best Practices",
        href: "/docs/guides/security-best-practices",
      },
      { title: "Deployment", href: "/docs/guides/deployment" },
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
