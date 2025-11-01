"use client";

import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { SponsorGrid } from "./sponsor-grid";
import { SponsorCheckoutModal } from "./sponsor-checkout-modal";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Sponsor {
  id: string;
  gridPosition: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  monthlyAmount: number;
}

export function Hero() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [showSponsorGrid, setShowSponsorGrid] = useState(false);

  useEffect(() => {
    console.log("fetching sponsors");
    fetch("/api/sponsors")
      .then((res) => res.json())
      .then((data) => {
        console.log("data", data);
        setSponsors(data.sponsors || []);
      })
      .catch((error) => {
        console.error("Failed to fetch sponsors:", error);
      });
  }, []);
  const [pkgManager, setPkgManager] = useState<"pnpm" | "npm" | "yarn" | "bun">(
    "npm"
  );

  const installCommand = useMemo(() => {
    switch (pkgManager) {
      case "pnpm":
        return "pnpm add @warpy-auth-sdk/core";
      case "yarn":
        return "yarn add @warpy-auth-sdk/core";
      case "bun":
        return "bun add @warpy-auth-sdk/core";
      default:
        return "npm i @warpy-auth-sdk/core";
    }
  }, [pkgManager]);

  const [copied, setCopied] = useState<boolean>(false);
  const copyInstall = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (_) {}
  }, [installCommand]);

  return (
    <section className="relative container flex flex-col items-center gap-8 pt-32 pb-24 md:pt-40 md:pb-32 min-h-screen">
      {/* Grid - either in background or foreground based on toggle */}
      <div className={`absolute inset-0 overflow-hidden transition-all ${showSponsorGrid ? 'z-0 bg-black/20' : '-z-10'}`}>
        <SponsorGrid
          sponsors={sponsors}
          onCellClick={(position) => setSelectedPosition(position)}
        />
      </div>

      {selectedPosition !== null && (
        <SponsorCheckoutModal
          isOpen={true}
          onClose={() => setSelectedPosition(null)}
          gridPosition={selectedPosition}
        />
      )}

      {/* Toggle button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSponsorGrid(!showSponsorGrid)}
        className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
      >
        {showSponsorGrid ? "Hide" : "View"} Sponsor Grid
      </Button>

      {/* Conditional content based on toggle */}
      {!showSponsorGrid ? (
        <>
          <div className="flex max-w-[980px] flex-col items-center gap-6 text-center">
            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl text-balance">
              The Authentication Toolkit for TypeScript
            </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground/80 sm:text-xl text-balance leading-relaxed">
          @warpy-auth-sdk/core is a free open-source library that gives you the
          tools you need to build secure authentication with AI agent
          integration.
        </p>
        <Card className="mt-6 w-full max-w-2xl border-border/50 bg-card/50">
          <div className="px-4">
            <Tabs
              value={pkgManager}
              onValueChange={(v) => setPkgManager(v as any)}
            >
              <TabsList>
                <TabsTrigger value="pnpm">pnpm</TabsTrigger>
                <TabsTrigger value="npm">npm</TabsTrigger>
                <TabsTrigger value="yarn">yarn</TabsTrigger>
                <TabsTrigger value="bun">bun</TabsTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={copyInstall}
                  title={copied ? "Copied!" : "Copy command"}
                  aria-label="Copy install command"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TabsList>
              <div className="mt-3 rounded-md border border-border bg-secondary/50">
                <TabsContent value="pnpm" className="mt-0">
                  <pre className="overflow-x-auto p-4 m-0">
                    <code className="font-mono text-sm">
                      pnpm add @warpy-auth-sdk/core
                    </code>
                  </pre>
                </TabsContent>
                <TabsContent value="npm" className="mt-0">
                  <pre className="overflow-x-auto p-4 m-0">
                    <code className="font-mono text-sm">
                      npm i @warpy-auth-sdk/core
                    </code>
                  </pre>
                </TabsContent>
                <TabsContent value="yarn" className="mt-0">
                  <pre className="overflow-x-auto p-4 m-0">
                    <code className="font-mono text-sm">
                      yarn add @warpy-auth-sdk/core
                    </code>
                  </pre>
                </TabsContent>
                <TabsContent value="bun" className="mt-0">
                  <pre className="overflow-x-auto p-4 m-0">
                    <code className="font-mono text-sm">
                      bun add @warpy-auth-sdk/core
                    </code>
                  </pre>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </Card>
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
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 w-full">
          <h2 className="text-3xl font-bold mb-4">Sponsor Grid</h2>
          <p className="text-muted-foreground mb-8">
            Click on an empty cell to become a sponsor
          </p>
        </div>
      )}
    </section>
  );
}
