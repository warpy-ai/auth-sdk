/**
 * RainbowBorder Component
 * @module ai-mode/components/RainbowBorder
 *
 * Displays an animated rainbow border around the viewport when AI Mode is active
 */

"use client";

import React, { useEffect, useState } from "react";
import type { RainbowBorderProps } from "../types";

/**
 * RainbowBorder component that shows an animated rainbow border when AI mode is active
 *
 * @example
 * ```tsx
 * import { RainbowBorder } from '@warpy-auth-sdk/core/ai-mode';
 *
 * function MyApp() {
 *   const [aiActive, setAiActive] = useState(false);
 *
 *   return (
 *     <>
 *       <RainbowBorder isActive={aiActive} borderWidth={4} />
 *       <YourContent />
 *     </>
 *   );
 * }
 * ```
 */
export function RainbowBorder({
  isActive,
  borderWidth = 4,
  animationSpeed = 3,
  zIndex = 99999,
}: RainbowBorderProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering to prevent SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isActive) {
    return null;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes rainbow-border-animation {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
          }
        `,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex,
          border: `${borderWidth}px solid transparent`,
          borderImage:
            "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet, red) 1",
          borderImageSlice: 1,
          animation: `rainbow-border-animation ${animationSpeed}s linear infinite`,
        }}
        aria-hidden="true"
        data-testid="rainbow-border"
      />
    </>
  );
}
