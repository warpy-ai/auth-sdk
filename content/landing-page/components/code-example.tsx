"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const examples = {
  setup: `// proxy.ts
import { authMiddleware } from "@warpy-auth-sdk/core/next";
import { google } from "@warpy-auth-sdk/core";

const handler = authMiddleware({
  secret: process.env.AUTH_SECRET!,
  provider: google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  }),
  callbacks: {
    async user(u) {
      // Resolve/upsert your user
      return { id: u.id, email: u.email, name: u.name };
    }
  }
});

export function proxy(request: NextRequest) {
  const p = request.nextUrl.pathname;
  if (p.startsWith("/api/auth")) return handler(request);
  return NextResponse.next();
}`,
  react: `// App.tsx
import { AuthProvider, useAuth } from "@warpy-auth-sdk/core/hooks";

function App() {
  return (
    <AuthProvider secret={process.env.AUTH_SECRET!}>
      <Dashboard />
    </AuthProvider>
  );
}

function Dashboard() {
  const { session, signIn, signOut } = useAuth();
  
  if (!session) {
    return (
      <button onClick={() => signIn("user@example.com")}>
        Sign In
      </button>
    );
  }
  
  return (
    <div>
      <h1>Welcome {session.user.name}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}`,
  mcp: `// MCP Agent Integration
import { createMCPTools } from "@warpy-auth-sdk/core/mcp";

const mcpTools = createMCPTools({ 
  secret: process.env.AUTH_SECRET 
});

// AI agents can authenticate as users
const result = await mcpTools.agent_login.execute({
  userId: "user-123",
  scopes: ["debug", "read"],
  agentId: "debug-agent",
  expiresIn: "15m"
});

// Agent gets a short-lived token
console.log(result.token); // JWT token for agent`,
}

export function CodeExample() {
  const [activeTab, setActiveTab] = useState("setup")

  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">Get started in minutes</h2>
          <p className="text-lg text-muted-foreground">
            Simple, powerful authentication that scales with your application
          </p>
        </div>

        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border/50 bg-muted/30 px-4">
              <TabsList className="h-12 bg-transparent">
                <TabsTrigger value="setup" className="data-[state=active]:bg-background">
                  Next.js Setup
                </TabsTrigger>
                <TabsTrigger value="react" className="data-[state=active]:bg-background">
                  React Client
                </TabsTrigger>
                <TabsTrigger value="mcp" className="data-[state=active]:bg-background">
                  AI Agent (MCP)
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="p-6">
              <TabsContent value="setup" className="mt-0">
                <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-4">
                  <code className="text-sm text-foreground font-mono leading-relaxed">{examples.setup}</code>
                </pre>
              </TabsContent>
              <TabsContent value="react" className="mt-0">
                <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-4">
                  <code className="text-sm text-foreground font-mono leading-relaxed">{examples.react}</code>
                </pre>
              </TabsContent>
              <TabsContent value="mcp" className="mt-0">
                <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-4">
                  <code className="text-sm text-foreground font-mono leading-relaxed">{examples.mcp}</code>
                </pre>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </section>
  )
}
