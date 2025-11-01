'use client'

// Simplified test version of SponsorGrid to debug visibility issues

export function SponsorGridTest() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 border-2 border-red-500">
      <h2 className="text-xl mb-4">Grid Test (Should be visible)</h2>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square border-2 border-white/50 bg-white/10 flex items-center justify-center text-xs"
          >
            {i}
          </div>
        ))}
      </div>
    </div>
  )
}
