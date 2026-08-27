import type { JSONSchema, WebMCPToolDefinition } from "./types";
import { ToolDenied } from "./policy";
import { isWebMCPSupported } from "./runtime";

/**
 * Page translation: turns the DOM a human sees into a structured, referenceable
 * map an agent can navigate, plus the tools to act on it.
 *
 * The agent never receives CSS selectors. It receives opaque refs (`e12`) that
 * this module resolves back to elements, so a compromised or prompt-injected
 * agent cannot address arbitrary parts of the page or smuggle selectors that
 * escape the scanned root.
 */

/* -------------------------------------------------------------------------- */
/*                                 Annotations                                */
/* -------------------------------------------------------------------------- */

/** Excludes an element and its subtree from everything an agent can see. */
const ATTR_IGNORE = "data-agent-ignore";
/** Marks content that must never leave the page (values are redacted). */
const ATTR_SENSITIVE = "data-agent-sensitive";
/** Marks an action as safe to run without a confirmation prompt. */
const ATTR_SAFE = "data-agent-safe";
/** Human description of an element or form, surfaced to the agent. */
const ATTR_DESCRIPTION = "data-agent-description";
/** Promotes a form to a first-class named tool. */
const ATTR_TOOL = "data-agent-tool";

/** WebMCP's declarative form attributes, honoured as aliases. */
const ATTR_SPEC_TOOL = "toolname";
const ATTR_SPEC_DESCRIPTION = "tooldescription";

const SENSITIVE_INPUT_TYPES = new Set(["password", "hidden", "file"]);
const SENSITIVE_AUTOCOMPLETE =
  /^(cc-|current-password|new-password|one-time-code)/i;
const SENSITIVE_NAME =
  /pass(word)?|secret|token|otp|cvv|cvc|card|ssn|social|pin\b/i;

/* -------------------------------------------------------------------------- */
/*                                Snapshot types                              */
/* -------------------------------------------------------------------------- */

export interface PageLink {
  ref: string;
  text: string;
  href: string;
  external: boolean;
}

export interface PageField {
  ref: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  /** Absent for sensitive fields; those are never read back. */
  value?: string;
  options?: string[];
  placeholder?: string;
  sensitive: boolean;
  description?: string;
}

export interface PageForm {
  ref: string;
  /** Tool name when the form is annotated with `data-agent-tool`/`toolname`. */
  tool?: string;
  name: string;
  description?: string;
  action: string;
  method: string;
  submitLabel: string;
  fields: PageField[];
}

export interface PageAction {
  ref: string;
  label: string;
  kind: "button" | "link" | "menuitem" | "tab";
  description?: string;
  /** Marked with `data-agent-safe`: runnable without a confirmation prompt. */
  safe: boolean;
  disabled: boolean;
}

export interface PageHeading {
  ref: string;
  level: number;
  text: string;
}

export interface PageRegion {
  ref: string;
  role: string;
  label?: string;
}

export interface PageSnapshot {
  url: string;
  path: string;
  title: string;
  description?: string;
  regions: PageRegion[];
  headings: PageHeading[];
  links: PageLink[];
  forms: PageForm[];
  actions: PageAction[];
  /** Visible text of the main region, when requested. */
  text?: string;
  /** Set when the scan hit `maxElements` and stopped early. */
  truncated?: boolean;
}

export interface PageToolsOptions {
  /** CSS selector limiting the scanned subtree. Default: the whole document. */
  root?: string;
  /** Include the main region's visible text in snapshots. Default: true. */
  includeText?: boolean;
  /** Cap on elements collected per category. Default: 100. */
  maxElements?: number;
  /** Allow `page_navigate` to leave the current origin. Default: false. */
  allowExternalNavigation?: boolean;
  /** Scopes required by the tools that change page state. */
  scopes?: string[];
  /** Only surface elements explicitly annotated with `data-agent-*`. */
  annotatedOnly?: boolean;
  /** Expose read-only tools but no interaction tools. Default: false. */
  readOnly?: boolean;
  /** Generate one dedicated tool per annotated form. Default: true. */
  formTools?: boolean;
  /**
   * Who turns `toolname`-annotated forms into tools.
   *
   * Browsers that implement WebMCP synthesize those themselves — ChatGPT's
   * built-in browser and Chrome both do — so generating our own would publish
   * two tools with the same name. `auto` (the default) leaves them to the
   * browser where WebMCP is present and generates them where it is not, so the
   * same markup works either way. Forms using `data-agent-tool` are always
   * ours: that attribute means nothing to the browser.
   */
  declarativeForms?: "auto" | "browser" | "sdk";
}

/* -------------------------------------------------------------------------- */
/*                                Ref registry                                */
/* -------------------------------------------------------------------------- */

const refsByElement = new WeakMap<Element, string>();
let refRegistry = new Map<string, Element>();
let refCounter = 0;

/** Assigns (or reuses) the opaque handle an agent uses to address an element. */
export function refFor(element: Element): string {
  const existing = refsByElement.get(element);
  if (existing && refRegistry.get(existing) === element) return existing;

  refCounter += 1;
  const ref = `e${refCounter}`;
  refsByElement.set(element, ref);
  refRegistry.set(ref, element);
  return ref;
}

/** Resolves a ref, rejecting handles that are stale or were never issued. */
export function resolveRef(ref: string): Element {
  const element = refRegistry.get(ref);
  if (!element) {
    throw new ToolDenied(
      "invalid_arguments",
      `Unknown element reference "${ref}". Call page_snapshot to get current references.`
    );
  }
  const doc = getDocument();
  if (doc && !doc.contains(element)) {
    refRegistry.delete(ref);
    throw new ToolDenied(
      "invalid_arguments",
      `Element "${ref}" is no longer on the page. Call page_snapshot again.`
    );
  }
  if (isIgnored(element)) {
    throw new ToolDenied(
      "policy",
      `Element "${ref}" is marked as off-limits to agents.`
    );
  }
  return element;
}

/** Drops every issued ref. Called on navigation so refs cannot cross pages. */
export function resetRefs(): void {
  refRegistry = new Map();
}

/* -------------------------------------------------------------------------- */
/*                                DOM utilities                               */
/* -------------------------------------------------------------------------- */

function getDocument(): Document | null {
  const scope = globalThis as unknown as { document?: Document };
  return scope.document ?? null;
}

function getWindow(): (Window & typeof globalThis) | null {
  const scope = globalThis as unknown as {
    window?: Window & typeof globalThis;
  };
  return scope.window ?? null;
}

/** True when the element, or any ancestor, opts out of agent visibility. */
function isIgnored(element: Element): boolean {
  return element.closest(`[${ATTR_IGNORE}]`) !== null;
}

function isSensitive(element: Element): boolean {
  return element.closest(`[${ATTR_SENSITIVE}]`) !== null;
}

function isVisible(element: Element): boolean {
  if (element.hasAttribute("hidden")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;

  // checkVisibility resolves inherited display:none, content-visibility and
  // visibility in one call. It is the accurate answer where it exists.
  const checkVisibility = (
    element as Element & {
      checkVisibility?: (options?: Record<string, boolean>) => boolean;
    }
  ).checkVisibility;

  if (typeof checkVisibility === "function") {
    return checkVisibility.call(element, {
      checkOpacity: true,
      checkVisibilityCSS: true,
    });
  }

  const win = getWindow();
  if (!win || typeof win.getComputedStyle !== "function") return true;

  const style = win.getComputedStyle(element);
  return !(
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  );
}

function textOf(element: Element | null, limit = 200): string {
  if (!element) return "";
  const raw = (element as HTMLElement).innerText ?? element.textContent ?? "";
  const collapsed = raw.replace(/\s+/g, " ").trim();
  return collapsed.length > limit ? `${collapsed.slice(0, limit)}…` : collapsed;
}

function describedBy(element: Element): string | undefined {
  return (
    element.getAttribute(ATTR_DESCRIPTION) ??
    element.getAttribute(ATTR_SPEC_DESCRIPTION) ??
    undefined
  );
}

/** Accessible name, resolved the way assistive tech would resolve it. */
export function accessibleName(element: Element): string {
  const doc = getDocument();

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel.trim();

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy && doc) {
    const labels = labelledBy
      .split(/\s+/)
      .map((id) => textOf(doc.getElementById(id), 80))
      .filter(Boolean);
    if (labels.length) return labels.join(" ");
  }

  const id = element.getAttribute("id");
  if (id && doc) {
    const label = doc.querySelector(`label[for="${cssEscape(id)}"]`);
    if (label) return textOf(label, 80);
  }

  const wrappingLabel = element.closest("label");
  if (wrappingLabel) {
    const text = textOf(wrappingLabel, 80);
    if (text) return text;
  }

  const placeholder = element.getAttribute("placeholder");
  if (placeholder) return placeholder.trim();

  const title = element.getAttribute("title");
  if (title) return title.trim();

  const name = element.getAttribute("name");
  if (name) return name;

  return textOf(element, 80);
}

function cssEscape(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}

function fieldIsSensitive(field: Element): boolean {
  const type = (field.getAttribute("type") || "").toLowerCase();
  if (SENSITIVE_INPUT_TYPES.has(type)) return true;

  const autocomplete = field.getAttribute("autocomplete") || "";
  if (SENSITIVE_AUTOCOMPLETE.test(autocomplete)) return true;

  const identity = `${field.getAttribute("name") || ""} ${field.getAttribute("id") || ""}`;
  if (SENSITIVE_NAME.test(identity)) return true;

  return isSensitive(field);
}

/* -------------------------------------------------------------------------- */
/*                              Page description                              */
/* -------------------------------------------------------------------------- */

function scanRoot(options: PageToolsOptions): Element | null {
  const doc = getDocument();
  if (!doc) return null;
  if (options.root) return doc.querySelector(options.root);
  return doc.body ?? doc.documentElement ?? null;
}

function collect(
  root: Element,
  selector: string,
  max: number,
  options: PageToolsOptions
): Element[] {
  const found: Element[] = [];
  const nodes = root.querySelectorAll(selector);

  for (const node of Array.from(nodes)) {
    if (found.length >= max) break;
    if (isIgnored(node)) continue;
    if (options.annotatedOnly && !isAnnotated(node)) continue;
    if (!isVisible(node)) continue;
    found.push(node);
  }

  return found;
}

function isAnnotated(element: Element): boolean {
  return (
    element.hasAttribute(ATTR_TOOL) ||
    element.hasAttribute(ATTR_SPEC_TOOL) ||
    element.hasAttribute(ATTR_DESCRIPTION) ||
    element.hasAttribute(ATTR_SPEC_DESCRIPTION) ||
    element.hasAttribute(ATTR_SAFE) ||
    element.closest(`[${ATTR_TOOL}], [${ATTR_SPEC_TOOL}]`) !== null
  );
}

export function describeField(field: Element): PageField {
  const sensitive = fieldIsSensitive(field);
  const tag = field.tagName.toLowerCase();
  const type =
    tag === "select"
      ? "select"
      : tag === "textarea"
        ? "textarea"
        : (field.getAttribute("type") || "text").toLowerCase();

  const options =
    tag === "select"
      ? Array.from((field as HTMLSelectElement).options)
          .slice(0, 50)
          .map((option) => option.value)
      : undefined;

  const value = sensitive
    ? undefined
    : ((field as HTMLInputElement).value ?? undefined);

  return {
    ref: refFor(field),
    name: field.getAttribute("name") || field.getAttribute("id") || "",
    label: accessibleName(field),
    type,
    required: field.hasAttribute("required"),
    ...(value !== undefined && value !== "" ? { value } : {}),
    ...(options ? { options } : {}),
    ...(field.getAttribute("placeholder")
      ? { placeholder: field.getAttribute("placeholder") as string }
      : {}),
    sensitive,
    ...(describedBy(field) ? { description: describedBy(field) } : {}),
  };
}

export function describeForm(form: Element): PageForm {
  const fields = Array.from(
    form.querySelectorAll("input, select, textarea")
  ).filter((field) => !isIgnored(field) && isVisible(field));

  const submit = form.querySelector(
    'button[type="submit"], input[type="submit"], button:not([type])'
  );

  const toolName =
    form.getAttribute(ATTR_TOOL) ||
    form.getAttribute(ATTR_SPEC_TOOL) ||
    undefined;

  return {
    ref: refFor(form),
    ...(toolName ? { tool: toolName } : {}),
    name:
      accessibleName(form) ||
      form.getAttribute("name") ||
      form.getAttribute("id") ||
      "form",
    ...(describedBy(form) ? { description: describedBy(form) } : {}),
    action: form.getAttribute("action") || "",
    method: (form.getAttribute("method") || "get").toUpperCase(),
    submitLabel: submit ? accessibleName(submit) || "Submit" : "Submit",
    fields: fields.map(describeField),
  };
}

/** Builds the structured map of the current page. */
export function describePage(options: PageToolsOptions = {}): PageSnapshot {
  const doc = getDocument();
  const root = scanRoot(options);

  if (!doc || !root) {
    throw new ToolDenied(
      "policy",
      "No document is available; page tools only run in a browser."
    );
  }

  const max = options.maxElements ?? 100;
  const location = (globalThis as unknown as { location?: Location }).location;

  const headings = collect(root, "h1, h2, h3, h4", max, options).map(
    (heading) => ({
      ref: refFor(heading),
      level: Number(heading.tagName.slice(1)),
      text: textOf(heading, 120),
    })
  );

  const regions = collect(
    root,
    "main, nav, header, footer, aside, section[aria-label], [role]",
    max,
    options
  )
    .map((region) => ({
      ref: refFor(region),
      role: region.getAttribute("role") || region.tagName.toLowerCase(),
      ...(accessibleName(region) ? { label: accessibleName(region) } : {}),
    }))
    .filter((region) => region.role !== "presentation");

  const links = collect(root, "a[href]", max, options)
    .map((link) => {
      const href = link.getAttribute("href") || "";
      return {
        ref: refFor(link),
        text: accessibleName(link),
        href,
        external: isExternal(href),
      };
    })
    .filter(
      (link) => link.text.length > 0 && !link.href.startsWith("javascript:")
    );

  const forms = collect(root, "form", max, options).map(describeForm);

  const actions = collect(
    root,
    'button, [role="button"], [role="menuitem"], [role="tab"], input[type="button"]',
    max,
    options
  )
    .filter((element) => element.closest("form") === null)
    .map((element) => ({
      ref: refFor(element),
      label: accessibleName(element),
      kind: actionKind(element),
      ...(describedBy(element) ? { description: describedBy(element) } : {}),
      safe: element.hasAttribute(ATTR_SAFE),
      disabled:
        element.hasAttribute("disabled") ||
        element.getAttribute("aria-disabled") === "true",
    }))
    .filter((action) => action.label.length > 0);

  const includeText = options.includeText ?? true;
  const main = root.querySelector("main") ?? root;

  const metaDescription = doc
    .querySelector('meta[name="description"]')
    ?.getAttribute("content");

  return {
    url: location?.href ?? "",
    path: location?.pathname ?? "",
    title: doc.title ?? "",
    ...(metaDescription ? { description: metaDescription } : {}),
    regions,
    headings,
    links,
    forms,
    actions,
    ...(includeText ? { text: textOf(main, 4000) } : {}),
    ...(headings.length >= max || links.length >= max
      ? { truncated: true }
      : {}),
  };
}

function actionKind(element: Element): PageAction["kind"] {
  const role = element.getAttribute("role");
  if (role === "menuitem" || role === "tab") return role;
  return element.tagName.toLowerCase() === "a" ? "link" : "button";
}

function isExternal(href: string): boolean {
  const origin = (globalThis as unknown as { location?: Location }).location
    ?.origin;
  if (!origin) return /^https?:\/\//i.test(href);
  try {
    return new URL(href, origin).origin !== origin;
  } catch (_error) {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Interaction                                */
/* -------------------------------------------------------------------------- */

function setFieldValue(field: Element, value: string): void {
  const win = getWindow();
  const tag = field.tagName.toLowerCase();

  if (fieldIsSensitive(field)) {
    throw new ToolDenied(
      "policy",
      `Field "${accessibleName(field)}" holds sensitive data and cannot be filled by an agent. Ask the person to type it.`
    );
  }

  if (tag === "select") {
    const select = field as HTMLSelectElement;
    const match = Array.from(select.options).find(
      (option) => option.value === value || option.text === value
    );
    if (!match) {
      throw new ToolDenied(
        "invalid_arguments",
        `"${value}" is not one of the options for "${accessibleName(field)}".`
      );
    }
    select.value = match.value;
  } else if ((field as HTMLInputElement).type === "checkbox") {
    (field as HTMLInputElement).checked =
      value === "true" || value === "on" || value === "1";
  } else {
    (field as HTMLInputElement).value = value;
  }

  // Frameworks listen for these, so a programmatic fill has to look like typing.
  if (win) {
    field.dispatchEvent(new win.Event("input", { bubbles: true }));
    field.dispatchEvent(new win.Event("change", { bubbles: true }));
  }
}

/**
 * Submits a form the way a person would.
 *
 * Clicking the real submit button matters: sites hang validation, analytics and
 * disabled-state logic off that click, and neither requestSubmit nor submit()
 * fires it.
 */
function submitForm(form: HTMLFormElement): void {
  const submitter = form.querySelector(
    'button[type="submit"], input[type="submit"]'
  ) as HTMLElement | null;

  if (submitter) submitter.click();
  else if (typeof form.requestSubmit === "function") form.requestSubmit();
  else form.submit();
}

function fillForm(
  form: Element,
  values: Record<string, string>
): { filled: string[]; skipped: string[] } {
  const filled: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(values)) {
    const field =
      form.querySelector(`[name="${cssEscape(key)}"]`) ??
      form.querySelector(`#${cssEscape(key)}`) ??
      Array.from(form.querySelectorAll("input, select, textarea")).find(
        (candidate) =>
          accessibleName(candidate).toLowerCase() === key.toLowerCase()
      );

    if (!field || isIgnored(field)) {
      skipped.push(key);
      continue;
    }

    setFieldValue(field, String(value));
    filled.push(key);
  }

  return { filled, skipped };
}

/* -------------------------------------------------------------------------- */
/*                                   Tools                                    */
/* -------------------------------------------------------------------------- */

const REF_SCHEMA: JSONSchema = {
  type: "string",
  description: 'Element reference from page_snapshot, e.g. "e12".',
};

/**
 * Builds the tool set that makes an arbitrary page navigable: read the
 * structure, search it, follow links, fill and submit forms, trigger actions.
 */
export function createPageTools(
  options: PageToolsOptions = {}
): WebMCPToolDefinition[] {
  const scopes = options.scopes ?? [];
  const tools: WebMCPToolDefinition[] = [];

  tools.push({
    name: "page_snapshot",
    description:
      "Describe the current page as structured data: title, regions, headings, links, forms and actions, each with a reference the other page_* tools accept. Call this first, and again after anything changes the page.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    inputSchema: {
      type: "object",
      properties: {
        includeText: {
          type: "boolean",
          description: "Include the visible text of the main region.",
        },
      },
    },
    execute: (args: Record<string, unknown>) =>
      describePage({
        ...options,
        ...(typeof args.includeText === "boolean"
          ? { includeText: args.includeText }
          : {}),
      }),
  });

  tools.push({
    name: "page_find",
    description:
      "Find elements on the current page whose visible text matches a query. Returns references usable with page_read, page_click and page_navigate.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Text to search for." },
        limit: { type: "number", description: "Maximum matches (default 10)." },
      },
      required: ["query"],
    },
    execute: (args: Record<string, unknown>) => {
      const query = String(args.query ?? "").toLowerCase();
      const limit = Number(args.limit ?? 10);
      if (!query) {
        throw new ToolDenied("invalid_arguments", "A query is required.");
      }

      const snapshot = describePage({ ...options, includeText: false });
      const pool = [
        ...snapshot.links.map((link) => ({
          ref: link.ref,
          kind: "link" as const,
          text: link.text,
          href: link.href,
        })),
        ...snapshot.actions.map((action) => ({
          ref: action.ref,
          kind: "action" as const,
          text: action.label,
        })),
        ...snapshot.headings.map((heading) => ({
          ref: heading.ref,
          kind: "heading" as const,
          text: heading.text,
        })),
        ...snapshot.forms.map((form) => ({
          ref: form.ref,
          kind: "form" as const,
          text: form.name,
        })),
      ];

      return {
        query: args.query,
        matches: pool
          .filter((entry) => entry.text.toLowerCase().includes(query))
          .slice(0, limit),
      };
    },
  });

  tools.push({
    name: "page_read",
    description:
      "Read the visible text of one region or element of the current page, by reference.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    inputSchema: {
      type: "object",
      properties: { ref: REF_SCHEMA, maxChars: { type: "number" } },
      required: ["ref"],
    },
    execute: (args: Record<string, unknown>) => {
      const element = resolveRef(String(args.ref));
      if (isSensitive(element)) {
        throw new ToolDenied(
          "policy",
          "That region is marked sensitive and cannot be read by an agent."
        );
      }
      return {
        ref: args.ref,
        text: textOf(element, Number(args.maxChars ?? 4000)),
      };
    },
  });

  if (options.readOnly) return tools;

  tools.push({
    name: "page_navigate",
    description:
      "Navigate the browser to another page of this site, by URL or by the reference of a link on the current page.",
    annotations: { destructiveHint: false, idempotentHint: true },
    scopes,
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Path or URL to open." },
        ref: REF_SCHEMA,
      },
    },
    execute: (args: Record<string, unknown>) => {
      const win = getWindow();
      if (!win) {
        throw new ToolDenied("policy", "Navigation requires a browser window.");
      }

      let target = args.url ? String(args.url) : "";
      if (!target && args.ref) {
        const element = resolveRef(String(args.ref));
        target = element.getAttribute("href") || "";
      }
      if (!target) {
        throw new ToolDenied(
          "invalid_arguments",
          "Provide either a url or the ref of a link."
        );
      }

      const destination = new URL(target, win.location.href);

      // Protocol first: javascript:, data: and blob: URLs have an opaque origin,
      // so the same-origin check alone would reject them for the wrong reason.
      if (!/^https?:$/.test(destination.protocol)) {
        throw new ToolDenied(
          "policy",
          `Refusing to navigate to a ${destination.protocol} URL.`
        );
      }
      if (
        destination.origin !== win.location.origin &&
        !options.allowExternalNavigation
      ) {
        throw new ToolDenied(
          "policy",
          `Navigation to ${destination.origin} is blocked; this page only allows same-origin navigation.`
        );
      }

      resetRefs();
      win.location.assign(destination.href);
      return { navigatedTo: destination.href };
    },
  });

  tools.push({
    name: "page_fill_form",
    description:
      "Fill fields of a form on the current page without submitting it. Sensitive fields (passwords, card numbers, one-time codes) are refused.",
    annotations: { destructiveHint: false },
    scopes,
    inputSchema: {
      type: "object",
      properties: {
        ref: REF_SCHEMA,
        values: {
          type: "object",
          description:
            'Field name (or visible label) to value. Values are strings; use "true"/"false" for checkboxes.',
        },
      },
      required: ["ref", "values"],
    },
    execute: (args: Record<string, unknown>) => {
      const form = resolveRef(String(args.ref));
      const values = (args.values ?? {}) as Record<string, string>;
      const result = fillForm(form, values);
      return {
        ...result,
        form: describeForm(form),
      };
    },
  });

  tools.push({
    name: "page_submit_form",
    description:
      "Submit a form on the current page, optionally filling fields first. Asks the person to confirm before submitting.",
    annotations: { destructiveHint: true },
    scopes,
    confirm: "always",
    confirmMessage: (args) =>
      `An AI agent wants to submit a form on this page${
        args.values ? ` with: ${JSON.stringify(args.values).slice(0, 200)}` : ""
      }.\n\nAllow it?`,
    inputSchema: {
      type: "object",
      properties: {
        ref: REF_SCHEMA,
        values: {
          type: "object",
          description: "Optional field values to fill before submitting.",
        },
      },
      required: ["ref"],
    },
    execute: (args: Record<string, unknown>) => {
      const form = resolveRef(String(args.ref)) as HTMLFormElement;
      const values = (args.values ?? {}) as Record<string, string>;
      const filled = Object.keys(values).length
        ? fillForm(form, values)
        : { filled: [], skipped: [] };

      submitForm(form);

      return { submitted: true, ...filled };
    },
  });

  tools.push({
    name: "page_click",
    description:
      "Activate a button or link on the current page by reference. Asks the person to confirm unless the element is marked data-agent-safe.",
    annotations: { destructiveHint: true },
    scopes,
    confirmMessage: (args) =>
      `An AI agent wants to activate "${describeRefSafely(String(args.ref))}" on this page.\n\nAllow it?`,
    inputSchema: {
      type: "object",
      properties: { ref: REF_SCHEMA },
      required: ["ref"],
    },
    execute: (args: Record<string, unknown>, context) => {
      const element = resolveRef(String(args.ref)) as HTMLElement;

      if (
        element.hasAttribute("disabled") ||
        element.getAttribute("aria-disabled") === "true"
      ) {
        throw new ToolDenied(
          "invalid_arguments",
          `"${accessibleName(element)}" is disabled.`
        );
      }

      void context;
      element.click();
      return { clicked: accessibleName(element), ref: args.ref };
    },
  });

  if (options.formTools !== false) {
    tools.push(...createFormTools(options));
  }

  return tools;
}

function describeRefSafely(ref: string): string {
  try {
    return accessibleName(resolveRef(ref)) || ref;
  } catch (_error) {
    return ref;
  }
}

/**
 * Promotes every form annotated with `data-agent-tool` (or the spec's
 * `toolname`) into a dedicated, self-describing tool, so a site can become
 * agent-navigable through markup alone.
 */
/** Finds a live form by its `data-agent-tool`/`toolname` annotation. */
function findAnnotatedForm(
  name: string,
  options: PageToolsOptions
): Element | null {
  const root = scanRoot(options);
  if (!root) return null;
  const escaped = cssEscape(name);
  return root.querySelector(
    `form[${ATTR_TOOL}="${escaped}"], form[${ATTR_SPEC_TOOL}="${escaped}"]`
  );
}

export function createFormTools(
  options: PageToolsOptions = {}
): WebMCPToolDefinition[] {
  const root = scanRoot(options);
  if (!root) return [];

  // Where the browser speaks WebMCP it already synthesizes tools from
  // `toolname` forms. Generating them again would register two tools under one
  // name, so by default we only claim the forms the browser ignores.
  const mode = options.declarativeForms ?? "auto";
  const claimSpecForms =
    mode === "sdk" || (mode === "auto" && !isWebMCPSupported());

  const selector = claimSpecForms
    ? `form[${ATTR_TOOL}], form[${ATTR_SPEC_TOOL}]`
    : `form[${ATTR_TOOL}]`;

  const forms = Array.from(root.querySelectorAll(selector)).filter(
    (form) => !isIgnored(form)
  );

  return forms.map((form) => {
    const described = describeForm(form);
    const name = described.tool as string;
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];

    for (const field of described.fields) {
      if (field.sensitive || !field.name) continue;
      properties[field.name] = {
        type: field.type === "number" ? "number" : "string",
        description: field.description || field.label,
        ...(field.options ? { enum: field.options } : {}),
      };
      if (field.required) required.push(field.name);
    }

    return {
      name,
      description:
        described.description ||
        `Submit the "${described.name}" form on this page.`,
      annotations: { destructiveHint: true },
      scopes: options.scopes ?? [],
      confirm: "always",
      inputSchema: { type: "object", properties, required },
      execute: (args: Record<string, unknown>) => {
        // Re-resolve by annotation rather than trusting the ref captured at
        // build time: a re-render replaces the node but keeps the attribute.
        const live = (findAnnotatedForm(name, options) ??
          resolveRef(described.ref)) as HTMLFormElement;

        const values: Record<string, string> = {};
        for (const [key, value] of Object.entries(args)) {
          values[key] = String(value);
        }
        const filled = fillForm(live, values);
        submitForm(live);

        return { submitted: name, ...filled };
      },
    } satisfies WebMCPToolDefinition;
  });
}
