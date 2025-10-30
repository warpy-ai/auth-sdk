/**
 * AI Mode Types and Interfaces
 * @module ai-mode/types
 */

import type { ReactNode } from "react";

/**
 * Information about an available MCP tool
 */
export interface MCPToolInfo {
  name: string;
  description: string;
  category: "auth" | "flight" | "user" | "payment" | "custom";
  requiresAuth: boolean;
  scopes?: string[];
}

/**
 * Represents a single MCP tool execution event
 */
export interface MCPActivity {
  id: string;
  toolName: string;
  timestamp: Date;
  userId?: string;
  agentId?: string;
  scopes?: string[];
  success: boolean;
  duration?: number; // milliseconds
  error?: string;
}

/**
 * Real-time notification for MCP tool usage
 */
export interface MCPNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  toolName: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number; // milliseconds (default 5000)
}

/**
 * Theme options for AI Mode UI
 */
export type AIModeTheme = "auto" | "light" | "dark";

/**
 * Position options for AI Mode Bar
 */
export type AIModePosition = "top" | "bottom";

/**
 * Configuration options for AIProvider
 */
export interface AIProviderProps {
  children: ReactNode;
  /**
   * MCP endpoint to fetch tools and subscribe to events
   * @default "/api/mcp"
   */
  mcpEndpoint?: string;
  /**
   * Whether AI Mode is enabled by default
   * @default false (opt-in)
   */
  enabled?: boolean;
  /**
   * Position of the AI Mode bar
   * @default "bottom"
   */
  position?: AIModePosition;
  /**
   * Theme for AI Mode UI
   * @default "auto"
   */
  theme?: AIModeTheme;
  /**
   * Whether to show notifications for MCP tool usage
   * @default true
   */
  showNotifications?: boolean;
  /**
   * Whether to show the rainbow border when AI mode is active
   * @default true
   */
  showRainbowBorder?: boolean;
  /**
   * Maximum number of activities to keep in history
   * @default 50
   */
  maxActivities?: number;
  /**
   * Whether to enable analytics/telemetry
   * @default false
   */
  enableAnalytics?: boolean;
}

/**
 * Context value provided by AIProvider
 */
export interface AIModeContext {
  /**
   * Whether AI Mode is currently active
   */
  isActive: boolean;
  /**
   * List of available MCP tools
   */
  availableTools: MCPToolInfo[];
  /**
   * Whether tools are currently loading
   */
  loadingTools: boolean;
  /**
   * Recent MCP activity (tool executions)
   */
  recentActivity: MCPActivity[];
  /**
   * Active notifications
   */
  notifications: MCPNotification[];
  /**
   * Toggle AI Mode on/off
   */
  toggleAIMode: () => void;
  /**
   * Clear activity history
   */
  clearActivity: () => void;
  /**
   * Dismiss a notification by ID
   */
  dismissNotification: (id: string) => void;
  /**
   * Current theme
   */
  theme: AIModeTheme;
  /**
   * Current position
   */
  position: AIModePosition;
  /**
   * Whether notifications are shown
   */
  showNotifications: boolean;
  /**
   * Whether rainbow border is shown
   */
  showRainbowBorder: boolean;
}

/**
 * Server-Sent Event from MCP endpoint
 */
export interface MCPServerEvent {
  event: "tool_execution" | "tool_start" | "tool_end" | "error";
  data: {
    toolName: string;
    timestamp: string;
    userId?: string;
    agentId?: string;
    scopes?: string[];
    success?: boolean;
    duration?: number;
    error?: string;
  };
}

/**
 * Response from GET /api/mcp endpoint
 */
export interface MCPToolsResponse {
  success: boolean;
  tools: Array<{
    name: string;
    description: string;
    category?: string;
    requiresAuth?: boolean;
    scopes?: string[];
  }>;
}

/**
 * Props for RainbowBorder component
 */
export interface RainbowBorderProps {
  /**
   * Whether the rainbow border is active
   */
  isActive: boolean;
  /**
   * Border width in pixels
   * @default 4
   */
  borderWidth?: number;
  /**
   * Animation speed (lower = faster)
   * @default 3
   */
  animationSpeed?: number;
  /**
   * Z-index for the border
   * @default 9999
   */
  zIndex?: number;
}

/**
 * Props for AIModeBar component
 */
export interface AIModeBarProps {
  /**
   * Whether AI Mode is active
   */
  isActive: boolean;
  /**
   * List of available MCP tools
   */
  availableTools: MCPToolInfo[];
  /**
   * Whether tools are currently loading
   */
  loadingTools: boolean;
  /**
   * Position of the bar
   */
  position: AIModePosition;
  /**
   * Theme
   */
  theme: AIModeTheme;
  /**
   * Callback to toggle AI Mode
   */
  onToggle: () => void;
  /**
   * Callback to view activity history
   */
  onViewActivity?: () => void;
}

/**
 * Props for MCPNotification component
 */
export interface MCPNotificationProps {
  /**
   * The notification to display
   */
  notification: MCPNotification;
  /**
   * Callback when notification is dismissed
   */
  onDismiss: (id: string) => void;
  /**
   * Position of the notification
   */
  position: AIModePosition;
  /**
   * Theme
   */
  theme: AIModeTheme;
}

/**
 * Props for MCPToolCard component
 */
export interface MCPToolCardProps {
  /**
   * The tool information
   */
  tool: MCPToolInfo;
  /**
   * Whether the tool is currently being used
   */
  isActive?: boolean;
  /**
   * Theme
   */
  theme: AIModeTheme;
  /**
   * Callback when tool card is clicked
   */
  onClick?: (tool: MCPToolInfo) => void;
}
