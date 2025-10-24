import Link from "next/link"
import { Shield } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12 md:py-16">
      <div className="container">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold">Auth SDK</span>
            </div>
            <p className="text-sm text-muted-foreground">Modern authentication for the AI era</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Documentation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/docs/providers" className="text-muted-foreground hover:text-foreground transition-colors">
                  Providers
                </Link>
              </li>
              <li>
                <Link href="/docs/mcp" className="text-muted-foreground hover:text-foreground transition-colors">
                  MCP Integration
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="text-muted-foreground hover:text-foreground transition-colors">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cookbook" className="text-muted-foreground hover:text-foreground transition-colors">
                  Cookbook
                </Link>
              </li>
              <li>
                <Link href="/playground" className="text-muted-foreground hover:text-foreground transition-colors">
                  Playground
                </Link>
              </li>
              <li>
                <Link href="/examples" className="text-muted-foreground hover:text-foreground transition-colors">
                  Examples
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="https://github.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href="https://discord.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Discord
                </Link>
              </li>
              <li>
                <Link
                  href="https://twitter.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Twitter
                </Link>
              </li>
              <li>
                <Link href="/contributing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contributing
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© 2025 Auth SDK. Open source under MIT License.</p>
        </div>
      </div>
    </footer>
  )
}
