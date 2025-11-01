'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Sponsor {
  id: string
  gridPosition: number
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  monthlyAmount: number
}

interface SponsorGridProps {
  sponsors: Sponsor[]
  totalCells?: number
  onCellClick: (position: number) => void
}

export function SponsorGrid({ sponsors, totalCells = 70, onCellClick }: SponsorGridProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)

  // Create a map for quick sponsor lookup by position
  const sponsorMap = new Map(sponsors.map(s => [s.gridPosition, s]))

  // Generate all cells
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const sponsor = sponsorMap.get(i)
    return { position: i, sponsor }
  })

  const handleCellClick = (position: number) => {
    const sponsor = sponsorMap.get(position)
    if (!sponsor) {
      onCellClick(position)
    } else if (sponsor.websiteUrl) {
      window.open(sponsor.websiteUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden opacity-80">
      <div className="grid grid-cols-10 lg:grid-cols-14 gap-0 w-full h-full">
        {cells.map(({ position, sponsor }) => (
          <button
            key={position}
            onClick={() => handleCellClick(position)}
            onMouseEnter={() => setHoveredCell(position)}
            onMouseLeave={() => setHoveredCell(null)}
            className={cn(
              "relative aspect-square border transition-all duration-200",
              sponsor
                ? "border-border/30 bg-card/5 hover:bg-card/10 cursor-pointer"
                : "border-border/10 bg-transparent hover:bg-accent/5 hover:border-accent/30 cursor-pointer",
              hoveredCell === position && "scale-105 z-10 shadow-lg"
            )}
            aria-label={sponsor ? `Sponsor: ${sponsor.name}` : `Become a sponsor at position ${position + 1}`}
          >
            {sponsor ? (
              <div className="flex items-center justify-center w-full h-full p-2">
                {sponsor.logoUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-medium text-foreground/60 text-center break-all">
                    {sponsor.name}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                <Plus className="w-4 h-4 text-muted-foreground/40" />
              </div>
            )}

            {/* Tooltip on hover */}
            {hoveredCell === position && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border border-border whitespace-nowrap z-50 pointer-events-none">
                {sponsor ? (
                  <>
                    {sponsor.name}
                    <br />
                    <span className="text-muted-foreground">
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
  )
}
