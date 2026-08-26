import type { ModelContext, ModelContextHost, ModelContextToolDescriptor, RegisterToolOptions, ToolResponse } from "./types";
export declare const BRIDGE_KEY = "__webmcp__";
export interface WebMCPBridge {
    version: 1;
    provider: string;
    tools: ModelContextToolDescriptor[];
    call: (name: string, args?: Record<string, unknown>) => Promise<ToolResponse>;
}
export declare function getModelContext(): {
    context: ModelContext | null;
    host: ModelContextHost;
};
export declare function isWebMCPSupported(): boolean;
export declare function isSecureContext(): boolean;
export interface RegistrationHandle {
    host: ModelContextHost;
    registered: string[];
    dispose: () => void;
}
export declare function registerTools(descriptors: ModelContextToolDescriptor[], options?: RegisterToolOptions & {
    bridge?: WebMCPBridge;
}): Promise<RegistrationHandle>;
export declare function toToolResponse(value: unknown, options?: {
    isError?: boolean;
    maxChars?: number;
}): ToolResponse;
