"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Menu, Search } from "lucide-react";
import Link from "next/link";

interface DocsLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  prevPage?: { title: string; href: string };
  nextPage?: { title: string; href: string };
}

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

export function DocsLayout({
  children,
  title,
  description,
  prevPage,
  nextPage,
}: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Documentation</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-6">
                {navigation.map((section) => (
                  <div key={section.title}>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">
                      {section.title}
                    </h3>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="block px-3 py-2 text-sm rounded-md hover:bg-secondary/50 transition-colors"
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-64">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Mobile menu button */}
            <div className="lg:hidden mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-4 w-4 mr-2" />
                Menu
              </Button>
            </div>

            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                {title}
              </h1>
              {description && (
                <p className="text-xl text-muted-foreground">{description}</p>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {children}
            </div>

            {/* Navigation */}
            {(prevPage || nextPage) && (
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex justify-between">
                  {prevPage ? (
                    <Link
                      href={prevPage.href}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {prevPage.title}
                    </Link>
                  ) : (
                    <div />
                  )}
                  {nextPage && (
                    <Link
                      href={nextPage.href}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      {nextPage.title}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
