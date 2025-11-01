/**
 * AI Mode - Client-Side MCP Visualization
 * @module ai-mode
 *
 * Provides real-time visibility into AI browser interactions with MCP servers
 *
 * @example
 * ```tsx
 * // Next.js App Router (app/layout.tsx)
 * import { AIProvider, AIMode } from '@warpy-auth-sdk/core/ai-mode';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AIProvider
 *           enabled={true}
 *           mcpEndpoint="/api/mcp"
 *           position="bottom"
 *           theme="auto"
 *         >
 *           <AIMode />
 *           {children}
 *         </AIProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using individual components
 * import { useAIMode, RainbowBorder, AIModeBar } from '@warpy-auth-sdk/core/ai-mode';
 *
 * function MyCustomAIMode() {
 *   const { isActive, availableTools, toggleAIMode, theme, position } = useAIMode();
 *
 *   return (
 *     <>
 *       <RainbowBorder isActive={isActive} />
 *       <AIModeBar
 *         isActive={isActive}
 *         availableTools={availableTools}
 *         position={position}
 *         theme={theme}
 *         onToggle={toggleAIMode}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

// Context and Hook
export { AIProvider, useAIMode } from './useAIMode';

// Components
export {
  AIMode,
  RainbowBorder,
  AIModeBar,
  MCPNotification,
  MCPToolCard,
} from './components';

// Types
export type {
  AIProviderProps,
  AIModeContext,
  MCPToolInfo,
  MCPActivity,
  MCPNotification as MCPNotificationType,
  AIModeTheme,
  AIModePosition,
  RainbowBorderProps,
  AIModeBarProps,
  MCPNotificationProps,
  MCPToolCardProps,
  MCPServerEvent,
  MCPToolsResponse,
} from './types';
