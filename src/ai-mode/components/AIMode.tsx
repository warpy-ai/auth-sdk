/**
 * AIMode Component - All-in-one wrapper
 * @module ai-mode/components/AIMode
 *
 * Combines all AI Mode UI components into a single convenient component
 */

"use client";

import React from "react";
import { useAIMode } from "../useAIMode";
import { RainbowBorder } from "./RainbowBorder";
import { AIModeBar } from "./AIModeBar";
import { MCPNotification } from "./MCPNotification";

/**
 * AIMode component that renders all AI Mode UI elements
 *
 * Must be used inside an AIProvider
 *
 * @example
 * ```tsx
 * import { AIProvider, AIMode } from '@warpy-auth-sdk/core/ai-mode';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AIProvider enabled={true} mcpEndpoint="/api/mcp">
 *           <AIMode />
 *           {children}
 *         </AIProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AIMode() {
  const {
    isActive,
    availableTools,
    loadingTools,
    notifications,
    toggleAIMode,
    dismissNotification,
    theme,
    position,
    showNotifications,
    showRainbowBorder,
  } = useAIMode();

  return (
    <>
      {/* Rainbow Border */}
      {showRainbowBorder && <RainbowBorder isActive={isActive} />}

      {/* AI Mode Bar */}
      <AIModeBar
        isActive={isActive}
        availableTools={availableTools}
        loadingTools={loadingTools}
        position={position}
        theme={theme}
        onToggle={toggleAIMode}
      />

      {/* Notifications */}
      {showNotifications &&
        notifications.map((notification) => (
          <MCPNotification
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
            position={position}
            theme={theme}
          />
        ))}
    </>
  );
}
