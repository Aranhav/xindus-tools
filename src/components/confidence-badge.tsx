import { Badge } from "@/components/ui/badge";

export function ConfidenceBadge({ value }: { value?: number }) {
  if (value == null) return <span className="text-muted-foreground">--</span>;
  const pct = Math.round(value * 100);
  let colorClass: string;
  if (pct >= 85) colorClass = "bg-success-muted text-success-foreground border-success/20";
  else if (pct >= 65) colorClass = "bg-warning-muted text-warning-foreground border-warning/20";
  else colorClass = "bg-destructive/10 text-destructive border-destructive/20";
  return (
    <Badge variant="outline" className={colorClass}>
      {pct}%
    </Badge>
  );
}
