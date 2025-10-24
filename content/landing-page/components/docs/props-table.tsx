interface Prop {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  default?: string;
}

interface PropsTableProps {
  props: Prop[];
}

export function PropsTable({ props }: PropsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-semibold">Prop</th>
            <th className="text-left py-2 px-3 font-semibold">Type</th>
            <th className="text-left py-2 px-3 font-semibold">Description</th>
            <th className="text-left py-2 px-3 font-semibold">Default</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-border/50">
              <td className="py-2 px-3">
                <code className="text-sm font-mono bg-secondary/50 px-2 py-1 rounded">
                  {prop.name}
                </code>
                {prop.required && (
                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    required
                  </span>
                )}
              </td>
              <td className="py-2 px-3">
                <code className="text-sm font-mono text-muted-foreground">
                  {prop.type}
                </code>
              </td>
              <td className="py-2 px-3 text-sm">{prop.description}</td>
              <td className="py-2 px-3">
                {prop.default ? (
                  <code className="text-sm font-mono text-muted-foreground">
                    {prop.default}
                  </code>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
