import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://warpy-auth-sdk.vercel.app';
const ogImageUrl = `${siteUrl}/api/og?title=${encodeURIComponent('Cookbook')}&description=${encodeURIComponent('Step-by-step authentication recipes and patterns')}`;

export const metadata: Metadata = {
  title: "Cookbook",
  description: "Step-by-step recipes for common authentication patterns and use cases. Learn OAuth, magic links, MCP, and more.",
  openGraph: {
    title: "Cookbook",
    description: "Step-by-step recipes for common authentication patterns and use cases",
    type: "website",
    url: `${siteUrl}/cookbook`,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Cookbook",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookbook",
    description: "Step-by-step recipes for common authentication patterns and use cases",
    images: [ogImageUrl],
    creator: "@warpy_ai",
  },
}

const recipes = [
  {
    title: "Next.js App Router with Google OAuth",
    description: "Complete setup for Google OAuth authentication in Next.js 16 with App Router",
    tags: ["Next.js", "OAuth", "Google"],
    difficulty: "Beginner",
  },
  {
    title: "Email Magic Links with Resend",
    description: "Implement passwordless authentication using email magic links and Resend",
    tags: ["Email", "Passwordless", "Resend"],
    difficulty: "Beginner",
  },
  {
    title: "Multi-Provider Authentication",
    description: "Support multiple OAuth providers (Google, GitHub, Microsoft) in one app",
    tags: ["OAuth", "Multi-Provider"],
    difficulty: "Intermediate",
  },
  {
    title: "Protected API Routes",
    description: "Secure your API routes with session validation and role-based access control",
    tags: ["API", "Security", "RBAC"],
    difficulty: "Intermediate",
  },
  {
    title: "MCP Agent Authentication",
    description: "Enable AI agents to authenticate as users with scoped permissions",
    tags: ["MCP", "AI", "Agents"],
    difficulty: "Advanced",
  },
  {
    title: "Custom Database Adapter",
    description: "Create a custom database adapter for MongoDB or any other database",
    tags: ["Database", "Adapter", "Custom"],
    difficulty: "Advanced",
  },
  {
    title: "Session Management with Redis",
    description: "Store sessions in Redis for distributed applications and better performance",
    tags: ["Redis", "Sessions", "Performance"],
    difficulty: "Intermediate",
  },
  {
    title: "Social Login with Profile Sync",
    description: "Sync user profiles from OAuth providers and keep them updated",
    tags: ["OAuth", "Profile", "Sync"],
    difficulty: "Intermediate",
  },
  {
    title: "Two-Factor Authentication",
    description: "Add TOTP-based two-factor authentication for enhanced security",
    tags: ["2FA", "Security", "TOTP"],
    difficulty: "Advanced",
  },
]

const difficultyColors = {
  Beginner: "bg-green-500/10 text-green-500 border-green-500/20",
  Intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Advanced: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function CookbookPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Cookbook</h1>
            <p className="text-xl text-muted-foreground">
              Step-by-step recipes for common authentication patterns and use cases
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Link key={recipe.title} href={`/cookbook/${recipe.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <Card className="h-full border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant="outline"
                        className={difficultyColors[recipe.difficulty as keyof typeof difficultyColors]}
                      >
                        {recipe.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">{recipe.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed mb-4">{recipe.description}</CardDescription>
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
