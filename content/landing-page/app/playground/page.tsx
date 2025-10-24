"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Copy, Check } from "lucide-react"

const playgroundExamples = {
  oauth: `import { authenticate } from "@auth-sdk/core";
import { google } from "@auth-sdk/core";

const provider = google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: "http://localhost:3000/callback",
});

// Start OAuth flow
const result = await authenticate({
  provider,
  secret: process.env.AUTH_SECRET!,
  request: req,
});

console.log(result.user);`,
  email: `import { authenticate } from "@auth-sdk/core";
import { email } from "@auth-sdk/core";

const provider = email({
  from: "noreply@example.com",
  transport: {
    host: "smtp.example.com",
    port: 587,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  },
});

// Send magic link
await authenticate({
  provider,
  secret: process.env.AUTH_SECRET!,
  email: "user@example.com",
});`,
  session: `import { getSession } from "@auth-sdk/core";

// Get current session
const session = await getSession({
  secret: process.env.AUTH_SECRET!,
  request: req,
});

if (session) {
  console.log("User:", session.user);
  console.log("Expires:", session.expires);
} else {
  console.log("No active session");
}`,
}

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState("oauth")
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(playgroundExamples[activeTab as keyof typeof playgroundExamples])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Playground</h1>
            <p className="text-xl text-muted-foreground">Try out @auth-sdk/core with interactive examples</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Code Editor</CardTitle>
                <CardDescription>Select an example and run it to see the results</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="oauth">OAuth</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="session">Session</TabsTrigger>
                  </TabsList>
                  <div className="mt-4 relative">
                    <Button size="sm" variant="ghost" className="absolute top-2 right-2 z-10" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <TabsContent value="oauth" className="mt-0">
                      <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-4 max-h-[400px]">
                        <code className="text-sm text-foreground font-mono leading-relaxed">
                          {playgroundExamples.oauth}
                        </code>
                      </pre>
                    </TabsContent>
                    <TabsContent value="email" className="mt-0">
                      <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-4 max-h-[400px]">
                        <code className="text-sm text-foreground font-mono leading-relaxed">
                          {playgroundExamples.email}
                        </code>
                      </pre>
                    </TabsContent>
                    <TabsContent value="session" className="mt-0">
                      <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-4 max-h-[400px]">
                        <code className="text-sm text-foreground font-mono leading-relaxed">
                          {playgroundExamples.session}
                        </code>
                      </pre>
                    </TabsContent>
                  </div>
                </Tabs>
                <Button className="w-full mt-4 gap-2">
                  <Play className="h-4 w-4" />
                  Run Example
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Output</CardTitle>
                <CardDescription>See the results of your code execution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-secondary/50 p-4 min-h-[400px] font-mono text-sm">
                  <div className="text-muted-foreground">
                    <p>{">"} Click "Run Example" to execute the code</p>
                    <p className="mt-2">{">"} Results will appear here...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Try These Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="justify-start h-auto py-3 px-4 bg-transparent">
                  <div className="text-left">
                    <div className="font-semibold">OAuth Login</div>
                    <div className="text-xs text-muted-foreground">Google authentication flow</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4 bg-transparent">
                  <div className="text-left">
                    <div className="font-semibold">Magic Link</div>
                    <div className="text-xs text-muted-foreground">Passwordless email auth</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4 bg-transparent">
                  <div className="text-left">
                    <div className="font-semibold">MCP Agent</div>
                    <div className="text-xs text-muted-foreground">AI agent authentication</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
