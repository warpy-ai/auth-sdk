import * as React from "react";
import { type ReactNode } from "react";
import { type WebMCPConfig, type WebMCPHandle } from "./client";
import type { WebMCPToolDefinition } from "./types";
import type { PaymentReceipt } from "./paywall/types";
export interface WebMCPContextValue {
    handle: WebMCPHandle | null;
    supported: boolean;
    tools: string[];
    grantedScopes: string[];
    receipts: PaymentReceipt[];
    refresh: () => Promise<void>;
    revokeAccess: () => void;
}
export interface WebMCPProviderProps extends WebMCPConfig {
    children: ReactNode;
}
export declare function WebMCPProvider({ children, ...config }: WebMCPProviderProps): React.JSX.Element;
export declare function useWebMCP(): WebMCPContextValue;
export declare function useWebMCPTool(tool: WebMCPToolDefinition, deps?: React.DependencyList): void;
export declare function useWebMCPRegistration(config?: WebMCPConfig): WebMCPHandle | null;
