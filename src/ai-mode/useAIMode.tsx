/**
 * AI Mode React Hook and Context Provider
 * @module ai-mode/useAIMode
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import type {
  AIProviderProps,
  AIModeContext,
  MCPToolInfo,
  MCPActivity,
  MCPNotification,
  MCPServerEvent,
  MCPToolsResponse,
} from "./types";

// Create context with undefined default (will throw error if used outside provider)
const AIContext = createContext<AIModeContext | undefined>(undefined);

/**
 * Generate a unique ID for activities and notifications
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * AIProvider component that wraps the application to enable AI Mode
 *
 * @example
 * ```tsx
 * import { AIProvider } from '@warpy-auth-sdk/core/ai-mode';
 *
 * function App() {
 *   return (
 *     <AIProvider enabled={true} mcpEndpoint="/api/mcp">
 *       <YourApplication />
 *     </AIProvider>
 *   );
 * }
 * ```
 */
export function AIProvider({
  children,
  mcpEndpoint = "/api/mcp",
  enabled = false,
  position = "bottom",
  theme = "auto",
  showNotifications = true,
  showRainbowBorder = true,
  maxActivities = 50,
  enableAnalytics = false,
}: AIProviderProps) {
  // State
  const [isActive, setIsActive] = useState(enabled);
  const [availableTools, setAvailableTools] = useState<MCPToolInfo[]>([]);
  const [loadingTools, setLoadingTools] = useState<boolean>(false);
  const [recentActivity, setRecentActivity] = useState<MCPActivity[]>([]);
  const [notifications, setNotifications] = useState<MCPNotification[]>([]);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const notificationTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(
    new Map()
  );

  /**
   * Fetch available MCP tools from the server
   */
  const fetchTools = useCallback(async () => {
    setLoadingTools(true);
    try {
      const response = await fetch(mcpEndpoint, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.warn(
          "[AI Mode] Failed to fetch MCP tools:",
          response.statusText
        );
        return;
      }

      const data: any = await response.json();

      // Handle two response formats:
      // 1. { success: true, tools: [...] } - direct format
      // 2. { tools: { public: [...], protected: [...] } } - MCP route format
      let toolsList: any[] = [];

      if (data.success && data.tools) {
        // Format 1: direct tools array
        toolsList = data.tools;
      } else if (data.tools && (data.tools.public || data.tools.protected)) {
        // Format 2: public/protected split
        toolsList = [
          ...(data.tools.public || []),
          ...(data.tools.protected || []),
        ];
      }

      if (toolsList.length > 0) {
        const tools: MCPToolInfo[] = toolsList.map((tool) => ({
          name: tool.name,
          description: tool.description,
          category: (tool.category as MCPToolInfo["category"]) || "custom",
          requiresAuth: tool.requiresAuth !== false, // Default to true
          scopes: tool.scopes || tool.requiredScopes || [],
        }));

        setAvailableTools(tools);
        setLoadingTools(false);
      }
    } catch (error) {
      console.error("[AI Mode] Error fetching tools:", error);
      setLoadingTools(false);
    }
  }, [mcpEndpoint]);

  /**
   * Add a notification with auto-dismiss
   */
  const addNotification = useCallback(
    (notification: Omit<MCPNotification, "id">) => {
      const id = generateId();
      const fullNotification: MCPNotification = {
        ...notification,
        id,
        autoClose: notification.autoClose !== false,
        duration: notification.duration || 5000,
      };

      setNotifications((prev) => [...prev, fullNotification]);

      // Auto-dismiss after duration
      if (fullNotification.autoClose) {
        const timeout = setTimeout(() => {
          dismissNotification(id);
        }, fullNotification.duration);

        notificationTimeoutsRef.current.set(id, timeout);
      }
    },
    []
  );

  /**
   * Dismiss a notification by ID
   */
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // Clear timeout if exists
    const timeout = notificationTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      notificationTimeoutsRef.current.delete(id);
    }
  }, []);

  /**
   * Add activity to recent activity list
   */
  const addActivity = useCallback(
    (activity: Omit<MCPActivity, "id">) => {
      const fullActivity: MCPActivity = {
        ...activity,
        id: generateId(),
      };

      setRecentActivity((prev) => {
        const updated = [fullActivity, ...prev];
        return updated.slice(0, maxActivities); // Keep only maxActivities items
      });

      // Send to analytics if enabled
      if (enableAnalytics) {
        // TODO: Implement analytics tracking
        console.log("[AI Mode] Analytics:", fullActivity);
      }
    },
    [maxActivities, enableAnalytics]
  );

  /**
   * Handle SSE events from MCP endpoint
   */
  const handleMCPEvent = useCallback(
    (event: MCPServerEvent) => {
      const { event: eventType, data } = event;

      // Add to activity
      addActivity({
        toolName: data.toolName,
        timestamp: new Date(data.timestamp),
        userId: data.userId,
        agentId: data.agentId,
        scopes: data.scopes,
        success: data.success !== false,
        duration: data.duration,
        error: data.error,
      });

      // Show notification
      if (showNotifications) {
        const notificationType =
          eventType === "error" || data.error
            ? "error"
            : data.success === false
              ? "warning"
              : "success";

        addNotification({
          type: notificationType,
          message: data.error || `AI used tool: ${data.toolName}`,
          toolName: data.toolName,
          timestamp: new Date(data.timestamp),
        });
      }
    },
    [addActivity, addNotification, showNotifications]
  );

  /**
   * Connect to SSE endpoint for real-time MCP events
   */
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    try {
      const eventSource = new EventSource(`${mcpEndpoint}/events`);

      eventSource.addEventListener("tool_execution", (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMCPEvent({ event: "tool_execution", data });
        } catch (error) {
          console.error("[AI Mode] Error parsing SSE event:", error);
        }
      });

      eventSource.addEventListener("tool_start", (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMCPEvent({ event: "tool_start", data });
        } catch (error) {
          console.error("[AI Mode] Error parsing SSE event:", error);
        }
      });

      eventSource.addEventListener("tool_end", (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMCPEvent({ event: "tool_end", data });
        } catch (error) {
          console.error("[AI Mode] Error parsing SSE event:", error);
        }
      });

      eventSource.addEventListener("error", (event) => {
        console.error("[AI Mode] SSE connection error:", event);
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          if (isActive) {
            connectSSE();
          }
        }, 5000);
      });

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("[AI Mode] Failed to connect to SSE:", error);
    }
  }, [mcpEndpoint, handleMCPEvent, isActive]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  /**
   * Toggle AI Mode on/off
   */
  const toggleAIMode = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  /**
   * Clear activity history
   */
  const clearActivity = useCallback(() => {
    setRecentActivity([]);
  }, []);

  // Effect: Fetch tools and connect SSE when AI Mode is active
  useEffect(() => {
    if (isActive) {
      fetchTools();
      connectSSE();
    } else {
      disconnectSSE();
    }

    // Cleanup on unmount
    return () => {
      disconnectSSE();
      // Clear all notification timeouts
      notificationTimeoutsRef.current.forEach((timeout) =>
        clearTimeout(timeout)
      );
      notificationTimeoutsRef.current.clear();
    };
  }, [isActive, fetchTools, connectSSE, disconnectSSE]);

  // Context value
  const contextValue = useMemo<AIModeContext>(
    () => ({
      isActive,
      availableTools,
      loadingTools,
      recentActivity,
      notifications,
      toggleAIMode,
      clearActivity,
      dismissNotification,
      theme,
      position,
      showNotifications,
      showRainbowBorder,
    }),
    [
      isActive,
      availableTools,
      loadingTools,
      recentActivity,
      notifications,
      toggleAIMode,
      clearActivity,
      dismissNotification,
      theme,
      position,
      showNotifications,
      showRainbowBorder,
    ]
  );

  return (
    <AIContext.Provider value={contextValue}>{children}</AIContext.Provider>
  );
}

/**
 * Hook to access AI Mode context
 *
 * @throws Error if used outside AIProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isActive, availableTools, toggleAIMode } = useAIMode();
 *
 *   return (
 *     <div>
 *       <button onClick={toggleAIMode}>
 *         {isActive ? 'Disable AI Mode' : 'Enable AI Mode'}
 *       </button>
 *       <p>Available tools: {availableTools.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAIMode(): AIModeContext {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error("useAIMode must be used within an AIProvider");
  }

  return context;
}
