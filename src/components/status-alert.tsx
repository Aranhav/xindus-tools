import { cn } from "@/lib/utils";

const variantStyles = {
  success: "border-success/20 bg-success-muted text-success-foreground",
  warning: "border-warning/20 bg-warning-muted text-warning-foreground",
  error: "border-destructive/20 bg-destructive/10 text-destructive",
  info: "border-info/20 bg-info-muted text-info-foreground",
};

interface StatusAlertProps {
  variant: "success" | "warning" | "error" | "info";
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function StatusAlert({ variant, icon, title, description, className, children }: StatusAlertProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border px-4 py-3", variantStyles[variant], className)}>
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-xs opacity-80">{description}</p>}
      </div>
      {children}
    </div>
  );
}
