"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Github, Search, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 md:px-8">
        <div className="mr-4 md:mr-8 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-foreground" />
            <span className="font-semibold text-foreground hidden sm:inline">Auth SDK</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 gap-1 text-sm text-muted-foreground hover:text-foreground hidden md:flex"
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
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
          {/* Desktop Search & Actions */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex gap-2 text-muted-foreground hover:text-foreground cursor-not-allowed"
            disabled
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 xl:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex text-sm text-muted-foreground hover:text-foreground cursor-not-allowed"
            disabled
          >
            Feedback
          </Button>
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
            <Link href="https://github.com/warpy-ai/auth-sdk" target="_blank">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <nav className="container flex flex-col gap-4 px-4 py-4">
            <Link
              href="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <Link
              href="/cookbook"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cookbook
            </Link>
            <Link
              href="/providers"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Providers
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50"
            >
              Playground (Coming Soon)
            </Link>
            <div className="pt-4 border-t border-border/40 flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="flex-1">
                <Link href="https://github.com/warpy-ai/auth-sdk" target="_blank">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
