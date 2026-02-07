import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "in transit": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "out for delivery": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  booked: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "item bagged": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  returned: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  valid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  invalid: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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
