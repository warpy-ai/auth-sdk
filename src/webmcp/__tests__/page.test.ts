// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createFormTools,
  createPageTools,
  describePage,
  resetRefs,
  resolveRef,
} from "../page";
import type { WebMCPToolContext, WebMCPToolDefinition } from "../types";

const MARKUP = `
  <header><nav aria-label="Main"><a href="/pricing">Pricing</a></nav></header>
  <main>
    <h1>Dashboard</h1>
    <h2>Your orders</h2>
    <p>You have 3 open orders.</p>

    <form id="search" data-agent-tool="search_orders"
          data-agent-description="Search the order history">
      <label for="q">Query</label>
      <input id="q" name="q" type="text" />
      <select name="status">
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>
      <button type="submit">Search</button>
    </form>

    <form id="login">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" />
      <input type="hidden" name="csrf" value="secret-csrf" />
      <button type="submit">Sign in</button>
    </form>

    <button id="refresh" data-agent-safe>Refresh</button>
    <button id="danger">Delete everything</button>

    <div data-agent-ignore>
      <a href="/internal-admin">Admin</a>
      <button>Internal</button>
    </div>

    <div data-agent-sensitive id="secrets">API key: sk-live-123</div>
  </main>
`;

function tools(options = {}): Map<string, WebMCPToolDefinition> {
  return new Map(createPageTools(options).map((tool) => [tool.name, tool]));
}

/**
 * Tools may throw synchronously; in production the guard wraps them in a
 * promise. Do the same here so rejection assertions work either way.
 */
async function call(
  name: string,
  args: Record<string, unknown>,
  options = {}
): Promise<unknown> {
  const tool = tools(options).get(name);
  if (!tool) throw new Error(`No tool named ${name}`);
  return tool.execute(args, context);
}

const context = {
  toolName: "test",
  session: null,
  scopes: [],
  fetch: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
} as unknown as WebMCPToolContext;

beforeEach(() => {
  document.body.innerHTML = MARKUP;
  resetRefs();
});

describe("describePage", () => {
  it("maps headings, links, forms and actions", () => {
    const snapshot = describePage();

    expect(snapshot.title).toBe(document.title);
    expect(snapshot.headings.map((h) => h.text)).toContain("Dashboard");
    expect(snapshot.links.map((l) => l.href)).toContain("/pricing");
    expect(snapshot.forms).toHaveLength(2);
    expect(snapshot.actions.map((a) => a.label)).toEqual(
      expect.arrayContaining(["Refresh", "Delete everything"])
    );
    expect(snapshot.text).toContain("3 open orders");
  });

  it("excludes anything under data-agent-ignore", () => {
    const snapshot = describePage();

    expect(snapshot.links.map((l) => l.href)).not.toContain("/internal-admin");
    expect(snapshot.actions.map((a) => a.label)).not.toContain("Internal");
  });

  it("labels fields with their visible label and marks sensitive ones", () => {
    const login = describePage().forms.find((form) =>
      form.fields.some((field) => field.name === "email")
    );

    const email = login?.fields.find((field) => field.name === "email");
    const password = login?.fields.find((field) => field.name === "password");
    const csrf = login?.fields.find((field) => field.name === "csrf");

    expect(email?.label).toBe("Email");
    expect(email?.required).toBe(true);
    expect(email?.sensitive).toBe(false);

    expect(password?.sensitive).toBe(true);
    expect(password?.value).toBeUndefined();

    // Hidden fields are sensitive and never carry their value off the page.
    expect(csrf?.sensitive).toBe(true);
    expect(csrf?.value).toBeUndefined();
  });

  it("lists select options so an agent can pick a valid one", () => {
    const search = describePage().forms.find(
      (form) => form.tool === "search_orders"
    );
    const status = search?.fields.find((field) => field.name === "status");

    expect(status?.options).toEqual(["open", "closed"]);
  });

  it("marks data-agent-safe actions as safe", () => {
    const refresh = describePage().actions.find((a) => a.label === "Refresh");
    expect(refresh?.safe).toBe(true);
  });
});

describe("refs", () => {
  it("rejects references it never issued", () => {
    expect(() => resolveRef("e9999")).toThrow(/Unknown element reference/);
  });

  it("rejects references to elements that left the page", () => {
    const ref = describePage().actions.find((a) => a.label === "Refresh")?.ref;
    document.getElementById("refresh")?.remove();

    expect(() => resolveRef(ref as string)).toThrow(/no longer on the page/);
  });

  it("keeps a ref stable across snapshots", () => {
    const first = describePage().forms[0]?.ref;
    const second = describePage().forms[0]?.ref;
    expect(first).toBe(second);
  });
});

describe("page tools", () => {
  it("page_find matches visible text", async () => {
    const result = (await tools()
      .get("page_find")
      ?.execute({ query: "pricing" }, context)) as {
      matches: Array<{ text: string }>;
    };

    expect(result.matches.map((m) => m.text)).toContain("Pricing");
  });

  it("page_read refuses regions marked sensitive", async () => {
    const secrets = document.getElementById("secrets") as Element;
    const { refFor } = await import("../page");
    const ref = refFor(secrets);

    await expect(call("page_read", { ref })).rejects.toThrow(/sensitive/);
  });

  it("page_fill_form fills ordinary fields", async () => {
    const search = describePage().forms.find((f) => f.tool === "search_orders");

    const result = (await tools()
      .get("page_fill_form")
      ?.execute({ ref: search?.ref, values: { q: "invoice" } }, context)) as {
      filled: string[];
    };

    expect(result.filled).toEqual(["q"]);
    expect((document.getElementById("q") as HTMLInputElement).value).toBe(
      "invoice"
    );
  });

  it("page_fill_form refuses to type into a password field", async () => {
    const login = describePage().forms.find((f) =>
      f.fields.some((field) => field.name === "password")
    );

    await expect(
      call("page_fill_form", {
        ref: login?.ref,
        values: { password: "hunter2" },
      })
    ).rejects.toThrow(/sensitive data/);

    expect(
      (document.getElementById("password") as HTMLInputElement).value
    ).toBe("");
  });

  it("page_fill_form validates select options", async () => {
    const search = describePage().forms.find((f) => f.tool === "search_orders");

    await expect(
      call("page_fill_form", { ref: search?.ref, values: { status: "nope" } })
    ).rejects.toThrow(/not one of the options/);
  });

  it("page_submit_form is marked destructive and always confirms", () => {
    const submit = tools().get("page_submit_form");
    expect(submit?.annotations?.destructiveHint).toBe(true);
    expect(submit?.confirm).toBe("always");
  });

  it("page_click activates the element", async () => {
    const clicked = vi.fn();
    document.getElementById("refresh")?.addEventListener("click", clicked);
    const refresh = describePage().actions.find((a) => a.label === "Refresh");

    await tools().get("page_click")?.execute({ ref: refresh?.ref }, context);

    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it("page_click refuses disabled elements", async () => {
    const danger = document.getElementById("danger") as HTMLButtonElement;
    danger.disabled = true;
    const ref = describePage().actions.find(
      (a) => a.label === "Delete everything"
    )?.ref;

    await expect(call("page_click", { ref })).rejects.toThrow(/disabled/);
  });

  it("page_navigate blocks other origins by default", async () => {
    await expect(
      call("page_navigate", { url: "https://evil.example/" })
    ).rejects.toThrow(/same-origin/);
  });

  it("page_navigate refuses javascript: URLs", async () => {
    await expect(
      call("page_navigate", { url: "javascript:alert(1)" })
    ).rejects.toThrow(/Refusing to navigate/);
  });

  it("readOnly mode exposes no interaction tools", () => {
    const names = Array.from(tools({ readOnly: true }).keys());
    expect(names).toEqual(["page_snapshot", "page_find", "page_read"]);
  });

  it("annotatedOnly mode only surfaces annotated elements", () => {
    const snapshot = describePage({ annotatedOnly: true });
    expect(snapshot.actions.map((a) => a.label)).toEqual(["Refresh"]);
  });
});

describe("declarative form tools", () => {
  /**
   * ChatGPT's browser and Chrome both synthesize tools from `toolname` forms.
   * Registering our own would publish two tools under one name.
   */
  it("leaves toolname forms to a browser that implements WebMCP", () => {
    document.body.innerHTML = `
      <form toolname="spec_form" tooldescription="Handled by the browser">
        <input name="a" />
      </form>
      <form data-agent-tool="sdk_form"><input name="b" /></form>`;
    resetRefs();

    Object.defineProperty(document, "modelContext", {
      value: { registerTool: () => undefined },
      configurable: true,
      writable: true,
    });

    try {
      expect(createFormTools().map((tool) => tool.name)).toEqual(["sdk_form"]);
    } finally {
      delete (document as unknown as Record<string, unknown>).modelContext;
    }
  });

  it("claims toolname forms when the browser has no WebMCP", () => {
    document.body.innerHTML = `
      <form toolname="spec_form" tooldescription="Nobody else will">
        <input name="a" />
      </form>`;
    resetRefs();

    expect(createFormTools().map((tool) => tool.name)).toEqual(["spec_form"]);
  });

  it("can be forced either way", () => {
    document.body.innerHTML = `
      <form toolname="spec_form"><input name="a" /></form>`;
    resetRefs();

    expect(createFormTools({ declarativeForms: "browser" })).toEqual([]);
    expect(
      createFormTools({ declarativeForms: "sdk" }).map((tool) => tool.name)
    ).toEqual(["spec_form"]);
  });

  it("promotes an annotated form into its own tool", () => {
    const [tool] = createFormTools();

    expect(tool?.name).toBe("search_orders");
    expect(tool?.description).toBe("Search the order history");
    expect(tool?.confirm).toBe("always");
    expect(Object.keys(tool?.inputSchema?.properties ?? {})).toEqual([
      "q",
      "status",
    ]);
  });

  it("keeps sensitive fields out of the generated schema", () => {
    document.body.innerHTML = `
      <form data-agent-tool="sign_in">
        <input name="email" />
        <input name="password" type="password" />
      </form>`;
    resetRefs();

    const [tool] = createFormTools();
    expect(Object.keys(tool?.inputSchema?.properties ?? {})).toEqual(["email"]);
  });

  it("submits the form when called", async () => {
    const submitted = vi.fn((event: Event) => event.preventDefault());
    document.getElementById("search")?.addEventListener("submit", submitted);

    const [tool] = createFormTools();
    await tool?.execute({ q: "invoice" }, context);

    expect((document.getElementById("q") as HTMLInputElement).value).toBe(
      "invoice"
    );
    expect(submitted).toHaveBeenCalled();
  });
});
