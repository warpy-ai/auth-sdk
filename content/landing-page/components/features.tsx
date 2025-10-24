import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Zap, Code2, Bot, Lock, Puzzle } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Multiple Auth Methods",
    description:
      "OAuth 2.0, email magic links, and custom providers. Switch between providers with a single line of code.",
  },
  {
    icon: Bot,
    title: "AI Agent Authentication",
    description: "Revolutionary MCP support for AI agents to authenticate on behalf of users with scoped access.",
  },
  {
    icon: Zap,
    title: "Framework-agnostic",
    description: "Build with React, Next, Vue, Nuxt, SvelteKit, and more. Works with any Node.js framework.",
  },
  {
    icon: Code2,
    title: "TypeScript First",
    description: "Full type safety throughout with intelligent autocomplete and compile-time error checking.",
  },
  {
    icon: Lock,
    title: "Security Built-in",
    description: "CSRF protection, JWT sessions, token revocation, and scope-based access control out of the box.",
  },
  {
    icon: Puzzle,
    title: "Database Adapters",
    description: "Prisma adapter included. Extensible adapter system for any database or ORM.",
  },
]

export function Features() {
  return (
    <section className="container py-16 md:py-24">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="relative overflow-hidden border-border/40 bg-card/30 backdrop-blur hover:bg-card/50 transition-colors"
          >
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-foreground/5">
                <feature.icon className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed text-muted-foreground/80">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
