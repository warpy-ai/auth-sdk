import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Github, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-150 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 max-w-screen-2xl items-center px-8">
        <div className="mr-8 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-foreground" />
            <span className="font-semibold text-foreground">Auth SDK</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                v0
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>v0 (beta)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/docs"
            className="transition-colors hover:text-foreground text-muted-foreground font-medium"
          >
            Docs
          </Link>
          <Link
            href="/cookbook"
            className="transition-colors hover:text-foreground text-muted-foreground font-medium"
          >
            Cookbook
          </Link>
          <Link
            href="/providers"
            className="transition-colors hover:text-foreground text-muted-foreground font-medium"
          >
            Providers
          </Link>
          <Link
            href="#"
            className="transition-colors hover:text-foreground text-muted-foreground font-medium cursor-not-allowed"
          >
            Playground (Coming Soon)
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground cursor-not-allowed"
            disabled
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm text-muted-foreground hover:text-foreground cursor-not-allowed"
            disabled
          >
            Feedback
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="https://github.com/warpy-ai/auth-sdk" target="_blank">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>
          {/*<Button size="sm" className="gap-2" asChild>
            <Link href="/docs">
              <Shield className="h-4 w-4" />
              Sign in with Vercel
            </Link>
          </Button>*/}
        </div>
      </div>
    </header>
  );
}
