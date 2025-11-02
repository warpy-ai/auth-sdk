"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Sponsor {
  id: string;
  gridPosition: number;
  name: string;
  slogan?: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  monthlyAmount: number;
}

interface SponsorGridProps {
  sponsors: Sponsor[];
  totalCells?: number;
  onCellClick: (position: number) => void;
  showGrayscale?: boolean;
}

export function SponsorGrid({
  sponsors,
  totalCells = 315,
  onCellClick,
  showGrayscale = false,
}: SponsorGridProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  // Create a map for quick sponsor lookup by position
  const sponsorMap = new Map(sponsors.map((s) => [s.gridPosition, s]));

  // Generate all cells
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const sponsor = sponsorMap.get(i);
    return { position: i, sponsor };
  });

  const handleCellClick = (position: number) => {
    const sponsor = sponsorMap.get(position);
    if (!sponsor) {
      onCellClick(position);
    } else if (sponsor.websiteUrl) {
      window.open(sponsor.websiteUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="w-full min-h-full grid pointer-events-auto"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
          gridAutoRows: "60px",
          gridAutoFlow: "dense",
        }}
      >
        {cells.map(({ position, sponsor }) => (
          <button
            key={position}
            onClick={() => handleCellClick(position)}
            onMouseEnter={() => setHoveredCell(position)}
            onMouseLeave={() => setHoveredCell(null)}
            className={cn(
              "relative w-full h-full border transition-all duration-200",
              sponsor
                ? "border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer"
                : "border-white/10 bg-transparent hover:bg-white/5 hover:border-white/20 cursor-pointer",
              hoveredCell === position &&
                "scale-105 z-10 shadow-lg border-white/40 bg-white/10"
            )}
            aria-label={
              sponsor
                ? `Sponsor: ${sponsor.name}`
                : `Become a sponsor at position ${position + 1}`
            }
          >
            {sponsor ? (
              <div className="flex flex-col items-center justify-center w-full h-full p-1 gap-0.5">
                {sponsor.logoUrl ? (
                  <div className={cn("relative w-full h-8 shrink-0", showGrayscale && "grayscale")}>
                    <Image
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      fill
                      className="object-contain"
                      sizes="60px"
                    />
                  </div>
                ) : null}
                <span className="text-[8px] font-semibold text-white/80 text-center line-clamp-1 w-full px-0.5">
                  {sponsor.name}
                </span>
                {sponsor.slogan && (
                  <span className="text-[7px] text-white/50 text-center line-clamp-1 w-full px-0.5">
                    {sponsor.slogan}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full opacity-0 hover:opacity-50 transition-opacity">
                <Plus className="w-4 h-4 text-white/40" />
              </div>
            )}

            {/* Tooltip on hover */}
            {hoveredCell === position && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 text-white text-xs rounded-md shadow-lg border border-white/20 whitespace-nowrap z-50 pointer-events-none">
                {sponsor ? (
                  <>
                    {sponsor.name}
                    <br />
                    <span className="text-white/60">
                      ${(sponsor.monthlyAmount / 100).toFixed(2)}/mo
                    </span>
                  </>
                ) : (
                  "Click to sponsor this spot"
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
