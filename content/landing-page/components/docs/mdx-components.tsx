import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "./code-block";
import { Callout } from "./callout";
import { ApiMethod } from "./api-method";
import { TypeSignature } from "./type-signature";
import { PropsTable } from "./props-table";
import { Example } from "./example";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Override the default <a> element
    a: ({ children, ...props }) => (
      <a className="text-primary hover:underline" {...props}>
        {children}
      </a>
    ),
    // Override the default <h1> element
    h1: ({ children, ...props }) => (
      <h1 className="text-3xl font-bold tracking-tight mb-6" {...props}>
        {children}
      </h1>
    ),
    // Override the default <h2> element
    h2: ({ children, ...props }) => (
      <h2
        className="text-2xl font-semibold tracking-tight mt-8 mb-4"
        {...props}
      >
        {children}
      </h2>
    ),
    // Override the default <h3> element
    h3: ({ children, ...props }) => (
      <h3 className="text-xl font-semibold tracking-tight mt-6 mb-3" {...props}>
        {children}
      </h3>
    ),
    // Override the default <p> element
    p: ({ children, ...props }) => (
      <p className="mb-4 text-muted-foreground" {...props}>
        {children}
      </p>
    ),
    // Override the default <ul> element
    ul: ({ children, ...props }) => (
      <ul className="mb-4 ml-6 list-disc space-y-2" {...props}>
        {children}
      </ul>
    ),
    // Override the default <ol> element
    ol: ({ children, ...props }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-2" {...props}>
        {children}
      </ol>
    ),
    // Override the default <li> element
    li: ({ children, ...props }) => (
      <li className="text-muted-foreground" {...props}>
        {children}
      </li>
    ),
    // Override the default <code> element
    code: ({ children, ...props }) => (
      <code
        className="bg-secondary/50 px-2 py-1 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    ),
    // Override the default <pre> element
    pre: ({ children, ...props }) => (
      <pre
        className="overflow-x-auto rounded-lg bg-secondary/50 p-4 text-sm mb-4"
        {...props}
      >
        {children}
      </pre>
    ),
    // Custom components
    CodeBlock,
    Callout,
    ApiMethod,
    TypeSignature,
    PropsTable,
    Example,
    // Pass through any other components
    ...components,
  };
}
