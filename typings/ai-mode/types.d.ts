import type { ReactNode } from 'react';
export interface MCPToolInfo {
    name: string;
    description: string;
    category: 'auth' | 'flight' | 'user' | 'payment' | 'custom';
    requiresAuth: boolean;
    scopes?: string[];
}
export interface MCPActivity {
    id: string;
    toolName: string;
    timestamp: Date;
    userId?: string;
    agentId?: string;
    scopes?: string[];
    success: boolean;
    duration?: number;
    error?: string;
}
export interface MCPNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    toolName: string;
    timestamp: Date;
    autoClose?: boolean;
    duration?: number;
}
export type AIModeTheme = 'auto' | 'light' | 'dark';
export type AIModePosition = 'top' | 'bottom';
export interface AIProviderProps {
    children: ReactNode;
    mcpEndpoint?: string;
    enabled?: boolean;
    position?: AIModePosition;
    theme?: AIModeTheme;
    showNotifications?: boolean;
    showRainbowBorder?: boolean;
    maxActivities?: number;
    enableAnalytics?: boolean;
}
export interface AIModeContext {
    isActive: boolean;
    availableTools: MCPToolInfo[];
    recentActivity: MCPActivity[];
    notifications: MCPNotification[];
    toggleAIMode: () => void;
    clearActivity: () => void;
    dismissNotification: (id: string) => void;
    theme: AIModeTheme;
    position: AIModePosition;
    showNotifications: boolean;
    showRainbowBorder: boolean;
}
export interface MCPServerEvent {
    event: 'tool_execution' | 'tool_start' | 'tool_end' | 'error';
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
export interface RainbowBorderProps {
    isActive: boolean;
    borderWidth?: number;
    animationSpeed?: number;
    zIndex?: number;
}
export interface AIModeBarProps {
    isActive: boolean;
    availableTools: MCPToolInfo[];
    position: AIModePosition;
    theme: AIModeTheme;
    onToggle: () => void;
    onViewActivity?: () => void;
}
export interface MCPNotificationProps {
    notification: MCPNotification;
    onDismiss: (id: string) => void;
    position: AIModePosition;
    theme: AIModeTheme;
}
export interface MCPToolCardProps {
    tool: MCPToolInfo;
    isActive?: boolean;
    theme: AIModeTheme;
    onClick?: (tool: MCPToolInfo) => void;
}
