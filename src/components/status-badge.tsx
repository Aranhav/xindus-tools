import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  delivered: "bg-success-muted text-success-foreground",
  "in transit": "bg-info-muted text-info-foreground",
  "out for delivery": "bg-warning-muted text-warning-foreground",
  booked: "bg-warning-muted text-warning-foreground",
  "item bagged": "bg-info-muted text-info-foreground",
  returned: "bg-destructive/10 text-destructive",
  valid: "bg-success-muted text-success-foreground",
  invalid: "bg-destructive/10 text-destructive",
  completed: "bg-success-muted text-success-foreground",
  processing: "bg-info-muted text-info-foreground",
  failed: "bg-destructive/10 text-destructive",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const style = statusStyles[key] || "bg-muted text-muted-foreground";

  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", style, className)}>
      {status}
    </Badge>
  );
}
