import type { WebMCPToolDefinition } from "./types";
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
    value?: string;
    options?: string[];
    placeholder?: string;
    sensitive: boolean;
    description?: string;
}
export interface PageForm {
    ref: string;
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
    text?: string;
    truncated?: boolean;
}
export interface PageToolsOptions {
    root?: string;
    includeText?: boolean;
    maxElements?: number;
    allowExternalNavigation?: boolean;
    scopes?: string[];
    annotatedOnly?: boolean;
    readOnly?: boolean;
    formTools?: boolean;
}
export declare function refFor(element: Element): string;
export declare function resolveRef(ref: string): Element;
export declare function resetRefs(): void;
export declare function accessibleName(element: Element): string;
export declare function describeField(field: Element): PageField;
export declare function describeForm(form: Element): PageForm;
export declare function describePage(options?: PageToolsOptions): PageSnapshot;
export declare function createPageTools(options?: PageToolsOptions): WebMCPToolDefinition[];
export declare function createFormTools(options?: PageToolsOptions): WebMCPToolDefinition[];
