import React from "react";
import type { AIProviderProps, AIModeContext } from "./types";
export declare function AIProvider({ children, mcpEndpoint, enabled, position, theme, showNotifications, showRainbowBorder, maxActivities, enableAnalytics, }: AIProviderProps): React.JSX.Element;
export declare function useAIMode(): AIModeContext;
