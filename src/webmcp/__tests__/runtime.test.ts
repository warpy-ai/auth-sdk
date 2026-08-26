// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  BRIDGE_KEY,
  getModelContext,
  isWebMCPSupported,
  registerTools,
  toToolResponse,
} from "../runtime";
import { createWebMCP, resolveEndpoints } from "../client";
import type {
  ModelContextToolDescriptor,
  RegisterToolOptions,
  ToolResponse,
} from "../types";

interface FakeContext {
  registered: Map<string, ModelContextToolDescriptor>;
  registerTool: (
    tool: ModelContextToolDescriptor,
    options?: RegisterToolOptions
  ) => Promise<void>;
}

function installFakeModelContext(on: "document" | "navigator"): FakeContext {
  const registered = new Map<string, ModelContextToolDescriptor>();

  const context: FakeContext = {
    registered,
    registerTool: async (tool, options) => {
      registered.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () =>
        registered.delete(tool.name)
      );
    },
  };

  Object.defineProperty(
    on === "document" ? document : navigator,
    "modelContext",
    {
      value: context,
      configurable: true,
      writable: true,
    }
  );

  return context;
}

function removeModelContext() {
  for (const host of [document, navigator] as unknown as Array<
    Record<string, unknown>
  >) {
    delete host.modelContext;
  }
  delete (globalThis as Record<string, unknown>)[BRIDGE_KEY];
}

beforeEach(() => {
  document.body.innerHTML = "<main><h1>Hi</h1></main>";
});

afterEach(() => {
  removeModelContext();
  vi.restoreAllMocks();
});

describe("feature detection", () => {
  it("reports no support when the browser has no modelContext", () => {
    expect(isWebMCPSupported()).toBe(false);
    expect(getModelContext().host).toBe("none");
  });

  it("prefers document.modelContext over the deprecated navigator one", () => {
    installFakeModelContext("navigator");
    expect(getModelContext().host).toBe("navigator");

    installFakeModelContext("document");
    expect(getModelContext().host).toBe("document");
    expect(isWebMCPSupported()).toBe(true);
  });
});

describe("registerTools", () => {
  const descriptor: ModelContextToolDescriptor = {
    name: "demo",
    description: "demo tool",
    execute: () => "ok",
  };

  it("registers with the browser and unregisters via the abort signal", async () => {
    const context = installFakeModelContext("document");

    const handle = await registerTools([descriptor]);
    expect(context.registered.has("demo")).toBe(true);
    expect(handle.host).toBe("document");

    handle.dispose();
    expect(context.registered.has("demo")).toBe(false);
  });

  it("falls back to the legacy provideContext API", async () => {
    const provideContext = vi.fn();
    Object.defineProperty(navigator, "modelContext", {
      value: { provideContext },
      configurable: true,
      writable: true,
    });

    const handle = await registerTools([descriptor]);

    expect(provideContext).toHaveBeenCalledWith({ tools: [descriptor] });
    expect(handle.registered).toEqual(["demo"]);
  });

  it("publishes a bridge when the browser has no WebMCP at all", async () => {
    const bridge = {
      version: 1 as const,
      provider: "test",
      tools: [descriptor],
      call: async () => toToolResponse("ok"),
    };

    const handle = await registerTools([descriptor], { bridge });

    expect((globalThis as Record<string, unknown>)[BRIDGE_KEY]).toBe(bridge);
    expect(handle.host).toBe("bridge");

    handle.dispose();
    expect((globalThis as Record<string, unknown>)[BRIDGE_KEY]).toBeUndefined();
  });
});

describe("toToolResponse", () => {
  it("wraps a plain value as text plus structured content", () => {
    const response = toToolResponse({ count: 2 });

    expect(response.content[0]?.type).toBe("text");
    expect(response.structuredContent).toEqual({ count: 2 });
  });

  it("passes an already-shaped response through", () => {
    const original: ToolResponse = { content: [{ type: "text", text: "hi" }] };
    expect(toToolResponse(original)).toBe(original);
  });

  it("truncates oversized output", () => {
    const response = toToolResponse("x".repeat(500), { maxChars: 100 });
    expect(response.content[0]?.text).toContain("truncated 400 characters");
  });

  it("marks errors", () => {
    expect(toToolResponse("nope", { isError: true }).isError).toBe(true);
  });
});

describe("resolveEndpoints", () => {
  it("derives every route from the base path", () => {
    expect(resolveEndpoints("/api/auth/")).toEqual({
      session: "/api/auth/session",
      signIn: "/api/auth/signin/email",
      signOut: "/api/auth/signout",
      twoFactor: "/api/auth/twofa/verify",
      action: "/api/auth/webmcp/action",
      grant: "/api/auth/webmcp/grant",
      revoke: "/api/auth/webmcp/revoke",
    });
  });

  it("respects overrides", () => {
    expect(resolveEndpoints("/auth", { session: "/me" }).session).toBe("/me");
  });
});

describe("createWebMCP", () => {
  const noSession = (async () => null) as () => Promise<null>;

  it("registers auth and page tools with the browser", async () => {
    const context = installFakeModelContext("document");

    const handle = createWebMCP({ getSession: noSession, watch: false });
    await handle.refresh();

    const names = Array.from(context.registered.keys());
    expect(names).toEqual(
      expect.arrayContaining(["auth_get_session", "page_snapshot"])
    );

    handle.dispose();
    expect(context.registered.size).toBe(0);
  });

  it("namespaces tool names when asked", async () => {
    installFakeModelContext("document");

    const handle = createWebMCP({
      getSession: noSession,
      watch: false,
      namespace: "acme",
      page: false,
    });
    await handle.refresh();

    expect(handle.tools).toContain("acme_auth_get_session");
    handle.dispose();
  });

  it("lets an app tool override a built-in of the same name", async () => {
    installFakeModelContext("document");

    const handle = createWebMCP({
      getSession: noSession,
      watch: false,
      page: false,
      tools: [
        {
          name: "auth_get_session",
          description: "custom",
          annotations: { readOnlyHint: true },
          execute: () => ({ custom: true }),
        },
      ],
    });
    await handle.refresh();

    const response = await handle.execute("auth_get_session");
    expect(response.structuredContent).toEqual({ custom: true });
    handle.dispose();
  });

  it("re-resolves a tools function on every refresh", async () => {
    installFakeModelContext("document");
    let extra: string[] = [];

    const handle = createWebMCP({
      getSession: noSession,
      watch: false,
      auth: false,
      page: false,
      tools: () =>
        extra.map((name) => ({
          name,
          description: name,
          annotations: { readOnlyHint: true },
          execute: () => name,
        })),
    });
    await handle.refresh();
    expect(handle.tools).toEqual([]);

    extra = ["one", "two"];
    await handle.refresh();
    expect(handle.tools).toEqual(["one", "two"]);

    handle.dispose();
  });

  it("reports unknown tools instead of throwing", async () => {
    const handle = createWebMCP({ getSession: noSession, watch: false });
    await handle.refresh();

    const response = await handle.execute("nope");
    expect(response.isError).toBe(true);
    expect((response.structuredContent as { error: string }).error).toBe(
      "unknown_tool"
    );

    handle.dispose();
  });

  it("still exposes tools through the bridge without WebMCP support", async () => {
    const handle = createWebMCP({ getSession: noSession, watch: false });
    await handle.refresh();

    const bridge = (globalThis as Record<string, unknown>)[BRIDGE_KEY] as {
      call: (
        name: string,
        args?: Record<string, unknown>
      ) => Promise<ToolResponse>;
    };

    const response = await bridge.call("page_snapshot", { includeText: false });
    expect(response.structuredContent as { title: string }).toHaveProperty(
      "headings"
    );

    handle.dispose();
  });
});
