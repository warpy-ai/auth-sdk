import { CodeBlock } from "./code-block";

interface TypeSignatureProps {
  name: string;
  signature: string;
  description?: string;
  example?: string;
}

export function TypeSignature({
  name,
  signature,
  description,
  example,
}: TypeSignatureProps) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold mb-2">{name}</h4>
        {description && (
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
        )}
        <div className="bg-secondary/50 rounded-lg p-4">
          <code className="text-sm font-mono">{signature}</code>
        </div>
      </div>

      {example && (
        <div>
          <h5 className="font-medium mb-2">Example</h5>
          <CodeBlock language="typescript">{example}</CodeBlock>
        </div>
      )}
    </div>
  );
}
