import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative container flex flex-col items-center gap-8 pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="absolute inset-0 -z-10 grid-background opacity-80" />

      <div className="flex max-w-[980px] flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl text-balance">
          The Authentication Toolkit for TypeScript
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground/80 sm:text-xl text-balance leading-relaxed">
          @warpy-auth-sdk/core is a free open-source library that gives you the
          tools you need to build secure authentication with AI agent
          integration.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            <Link href="/docs">Get Started</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 font-mono text-sm border-border/50 hover:bg-accent/50 bg-transparent"
          >
            <span>$ npm i @warpy-auth-sdk/core</span>
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-border/50 hover:bg-accent/50 bg-transparent cursor-not-allowed"
            disabled
            asChild
          >
            <Link href="">Visit Playground (Coming Soon)</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground/60 mb-6">
          Trusted by builders at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 opacity-40">
          <div className="text-base font-medium tracking-wide">LERIO</div>
          <div className="text-base font-medium tracking-wide">SOURCEPILOT</div>
        </div>
      </div>
    </section>
  );
}
