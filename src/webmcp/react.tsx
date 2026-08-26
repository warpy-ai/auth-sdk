"use client";
import * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createWebMCP, type WebMCPConfig, type WebMCPHandle } from "./client";
import type { WebMCPToolDefinition } from "./types";

export interface WebMCPContextValue {
  handle: WebMCPHandle | null;
  /** True once a real WebMCP implementation accepted the tools. */
  supported: boolean;
  /** Tool names currently registered. */
  tools: string[];
  /** Scopes the person has delegated to the agent, if any. */
  grantedScopes: string[];
  refresh: () => Promise<void>;
  revokeAccess: () => void;
}

const WebMCPContext = createContext<WebMCPContextValue | null>(null);

export interface WebMCPProviderProps extends WebMCPConfig {
  children: ReactNode;
}

/**
 * Registers this app's WebMCP tools for as long as it is mounted.
 *
 * Mount it once, near the root. Components below can add their own tools with
 * `useWebMCPTool`, and they are unregistered again when those components leave.
 */
export function WebMCPProvider({ children, ...config }: WebMCPProviderProps) {
  const dynamicTools = useRef<WebMCPToolDefinition[]>([]);
  const [handle, setHandle] = useState<WebMCPHandle | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const [grantedScopes, setGrantedScopes] = useState<string[]>([]);

  // Only the values that change what gets registered should rebuild the handle.
  const { basePath, namespace, watch } = config;
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const current = configRef.current;
    const instance = createWebMCP({
      ...current,
      // Resolved on every refresh, so tools registered by child components are
      // picked up without recreating the handle — and without dropping the
      // tools passed to the provider itself.
      tools: () => {
        const own = configRef.current.tools;
        const staticTools = typeof own === "function" ? own() : (own ?? []);
        return [...staticTools, ...dynamicTools.current];
      },
      onReady: (ready) => {
        setTools(ready.tools);
        current.onReady?.(ready);
      },
    });

    setHandle(instance);
    const unsubscribe = instance.grants.subscribe((grant) =>
      setGrantedScopes(grant?.scopes ?? [])
    );

    return () => {
      unsubscribe();
      instance.dispose();
      setHandle(null);
      setTools([]);
    };
  }, [basePath, namespace, watch]);

  const refresh = useCallback(async () => {
    await handle?.refresh();
    if (handle) setTools(handle.tools);
  }, [handle]);

  const revokeAccess = useCallback(() => {
    handle?.grants.clear();
  }, [handle]);

  const value = useMemo<WebMCPContextValue>(
    () => ({
      handle,
      supported: handle?.supported ?? false,
      tools,
      grantedScopes,
      refresh,
      revokeAccess,
    }),
    [handle, tools, grantedScopes, refresh, revokeAccess]
  );

  return (
    <WebMCPContext.Provider value={value}>
      <WebMCPRegistry.Provider value={dynamicTools}>
        {children}
      </WebMCPRegistry.Provider>
    </WebMCPContext.Provider>
  );
}

const WebMCPRegistry = createContext<{
  current: WebMCPToolDefinition[];
} | null>(null);

/** Access the provider's handle: registered tools, delegated scopes, refresh. */
export function useWebMCP(): WebMCPContextValue {
  const context = useContext(WebMCPContext);
  if (!context) {
    throw new Error("useWebMCP must be used inside a <WebMCPProvider>");
  }
  return context;
}

/**
 * Exposes one tool for as long as the calling component is mounted.
 *
 * Use it to publish tools that only make sense on the current screen — the
 * agent's tool list then tracks what the person is actually looking at.
 */
export function useWebMCPTool(
  tool: WebMCPToolDefinition,
  deps: React.DependencyList = []
): void {
  const registry = useContext(WebMCPRegistry);
  const context = useContext(WebMCPContext);
  const toolRef = useRef(tool);
  toolRef.current = tool;

  useEffect(() => {
    if (!registry) {
      console.warn(
        `[webmcp] useWebMCPTool("${toolRef.current.name}") requires a <WebMCPProvider> ancestor.`
      );
      return;
    }

    // A stable wrapper keeps the latest implementation without re-registering
    // on every render.
    const entry: WebMCPToolDefinition = {
      ...toolRef.current,
      execute: (args, callContext) =>
        toolRef.current.execute(args, callContext),
    };

    registry.current.push(entry);
    void context?.handle?.refresh();

    return () => {
      const index = registry.current.indexOf(entry);
      if (index >= 0) registry.current.splice(index, 1);
      void context?.handle?.refresh();
    };
  }, [registry, context?.handle, ...deps]);
}

/**
 * Standalone hook for apps that do not want a provider. Creates and disposes a
 * WebMCP registration for the lifetime of the component.
 */
export function useWebMCPRegistration(
  config: WebMCPConfig = {}
): WebMCPHandle | null {
  const [handle, setHandle] = useState<WebMCPHandle | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const instance = createWebMCP(configRef.current);
    setHandle(instance);
    return () => {
      instance.dispose();
      setHandle(null);
    };
  }, []);

  return handle;
}
