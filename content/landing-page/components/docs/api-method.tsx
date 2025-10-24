import { CodeBlock } from "./code-block";
import { Callout } from "./callout";

interface Parameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  default?: string;
}

interface ApiMethodProps {
  name: string;
  description: string;
  signature: string;
  parameters?: Parameter[];
  returns?: string;
  example?: string;
  note?: string;
}

export function ApiMethod({
  name,
  description,
  signature,
  parameters = [],
  returns,
  example,
  note,
}: ApiMethodProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>

        <div className="bg-secondary/50 rounded-lg p-4">
          <code className="text-sm font-mono">{signature}</code>
        </div>
      </div>

      {parameters.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Parameters</h4>
          <div className="space-y-3">
            {parameters.map((param) => (
              <div
                key={param.name}
                className="border-l-2 border-primary/20 pl-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono bg-secondary/50 px-2 py-1 rounded">
                    {param.name}
                  </code>
                  <code className="text-sm text-muted-foreground">
                    {param.type}
                  </code>
                  {param.required && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                      required
                    </span>
                  )}
                  {param.default && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      default: {param.default}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {param.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {returns && (
        <div>
          <h4 className="font-semibold mb-2">Returns</h4>
          <code className="text-sm font-mono bg-secondary/50 px-2 py-1 rounded">
            {returns}
          </code>
        </div>
      )}

      {example && (
        <div>
          <h4 className="font-semibold mb-2">Example</h4>
          <CodeBlock language="typescript">{example}</CodeBlock>
        </div>
      )}

      {note && (
        <Callout type="info" title="Note">
          {note}
        </Callout>
      )}
    </div>
  );
}
