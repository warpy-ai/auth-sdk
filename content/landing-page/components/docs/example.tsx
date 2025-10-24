import { CodeBlock } from "./code-block";
import { Callout } from "./callout";

interface ExampleProps {
  title?: string;
  description?: string;
  code: string;
  language?: string;
  note?: string;
  children?: React.ReactNode;
}

export function Example({
  title,
  description,
  code,
  language = "typescript",
  note,
  children,
}: ExampleProps) {
  return (
    <div className="space-y-4">
      {title && (
        <div>
          <h4 className="font-semibold mb-2">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
          )}
        </div>
      )}

      {children && (
        <div className="border border-border rounded-lg p-4 bg-card/50">
          {children}
        </div>
      )}

      <CodeBlock language={language}>{code}</CodeBlock>

      {note && <Callout type="info">{note}</Callout>}
    </div>
  );
}
