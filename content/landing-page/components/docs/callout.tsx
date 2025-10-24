import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalloutProps {
  type?: "info" | "warning" | "success" | "error";
  title?: string;
  children: React.ReactNode;
}

const icons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const styles = {
  info: "border-blue-500/30 bg-blue-500/10 [&_svg]:text-blue-500",
  warning: "border-yellow-500/30 bg-yellow-500/10 [&_svg]:text-yellow-500",
  success: "border-green-500/30 bg-green-500/10 [&_svg]:text-green-500",
  error: "border-red-500/30 bg-red-500/10 [&_svg]:text-red-500",
};

export function Callout({ type = "info", title, children }: CalloutProps) {
  const Icon = icons[type];

  return (
    <div className={cn("rounded-lg border p-4 my-6 not-prose", styles[type])}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-2 text-foreground">{title}</h4>
          )}
          <div className="text-sm text-muted-foreground leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
