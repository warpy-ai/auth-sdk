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
  slogan?: string | null;
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
    <section className="relative container flex flex-col items-center gap-6 md:gap-8 pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-40 md:pb-32 min-h-screen px-4 sm:px-6 md:px-8">
      {/* Grid - either in background or foreground based on toggle */}
      <div className={`absolute inset-0 overflow-hidden transition-all ${showSponsorGrid ? 'z-0 bg-black/20' : '-z-10'}`}>
        <SponsorGrid
          sponsors={sponsors}
          onCellClick={(position) => setSelectedPosition(position)}
          showGrayscale={!showSponsorGrid}
        />
      </div>

      {selectedPosition !== null && (
        <SponsorCheckoutModal
          isOpen={true}
          onClose={() => setSelectedPosition(null)}
          gridPosition={selectedPosition}
        />
      )}

      {/* Toggle button - mobile optimized */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSponsorGrid(!showSponsorGrid)}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-background/80 backdrop-blur-sm text-xs sm:text-sm"
      >
        {showSponsorGrid ? "Hide" : "View"} Sponsor Grid
      </Button>

      {/* Conditional content based on toggle */}
      {!showSponsorGrid ? (
        <>
          <div className="flex max-w-[980px] flex-col items-center gap-4 md:gap-6 text-center w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight sm:leading-tight md:leading-tight tracking-tight text-balance px-2">
              The Authentication Toolkit for TypeScript
            </h1>
            <p className="max-w-[750px] text-base sm:text-lg md:text-xl text-muted-foreground/80 text-balance leading-relaxed px-4 sm:px-0">
              @warpy-auth-sdk/core is a free open-source library that gives you the
              tools you need to build secure authentication with AI agent
              integration.
            </p>
            <Card className="mt-4 md:mt-6 w-full max-w-2xl border-border/50 bg-card/50">
              <div className="px-2 sm:px-4">
                <Tabs
                  value={pkgManager}
                  onValueChange={(v) => setPkgManager(v as any)}
                >
                  <TabsList className="grid grid-cols-5 w-full h-auto gap-1 p-1">
                    <TabsTrigger value="pnpm" className="text-xs sm:text-sm px-2 py-1.5">pnpm</TabsTrigger>
                    <TabsTrigger value="npm" className="text-xs sm:text-sm px-2 py-1.5">npm</TabsTrigger>
                    <TabsTrigger value="yarn" className="text-xs sm:text-sm px-2 py-1.5">yarn</TabsTrigger>
                    <TabsTrigger value="bun" className="text-xs sm:text-sm px-2 py-1.5">bun</TabsTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      onClick={copyInstall}
                      title={copied ? "Copied!" : "Copy command"}
                      aria-label="Copy install command"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </TabsList>
                  <div className="mt-2 sm:mt-3 rounded-md border border-border bg-secondary/50">
                    <TabsContent value="pnpm" className="mt-0">
                      <pre className="overflow-x-auto p-3 sm:p-4 m-0">
                        <code className="font-mono text-xs sm:text-sm">
                          pnpm add @warpy-auth-sdk/core
                        </code>
                      </pre>
                    </TabsContent>
                    <TabsContent value="npm" className="mt-0">
                      <pre className="overflow-x-auto p-3 sm:p-4 m-0">
                        <code className="font-mono text-xs sm:text-sm">
                          npm i @warpy-auth-sdk/core
                        </code>
                      </pre>
                    </TabsContent>
                    <TabsContent value="yarn" className="mt-0">
                      <pre className="overflow-x-auto p-3 sm:p-4 m-0">
                        <code className="font-mono text-xs sm:text-sm">
                          yarn add @warpy-auth-sdk/core
                        </code>
                      </pre>
                    </TabsContent>
                    <TabsContent value="bun" className="mt-0">
                      <pre className="overflow-x-auto p-3 sm:p-4 m-0">
                        <code className="font-mono text-xs sm:text-sm">
                          bun add @warpy-auth-sdk/core
                        </code>
                      </pre>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </Card>
          </div>

          <div className="mt-10 sm:mt-12 md:mt-16 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground/60 mb-4 sm:mb-6">
              Trusted by builders at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-40">
              <div className="text-sm sm:text-base font-medium tracking-wide">LERIO</div>
              <div className="text-sm sm:text-base font-medium tracking-wide">SOURCEPILOT</div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 w-full px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Sponsor Grid</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 text-center">
            Click on an empty cell to become a sponsor
          </p>
        </div>
      )}
    </section>
  );
}
