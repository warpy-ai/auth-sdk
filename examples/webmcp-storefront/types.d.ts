import "react";

declare module "react" {
  /**
   * WebMCP's declarative form attributes. React passes unknown lowercase
   * attributes straight through to the DOM, but TypeScript needs telling.
   */
  interface HTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
  }
}
