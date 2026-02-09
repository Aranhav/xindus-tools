"use client";

import { Badge } from "@/components/ui/badge";

/* ── Status styles ────────────────────────────────────────── */

export const STATUS_STYLES: Record<string, string> = {
  pending_review: "bg-warning-muted text-warning-foreground",
  approved: "bg-success-muted text-success-foreground",
  rejected: "bg-destructive/10 text-destructive",
  pushed: "bg-info-muted text-info-foreground",
  archived: "bg-muted text-muted-foreground",
};

/* ── Status badge component ───────────────────────────────── */

export function DraftStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={`border-0 text-[10px] leading-tight ${STATUS_STYLES[status] || "bg-muted text-muted-foreground"}`}
    >
      {status.replace("_", " ")}
    </Badge>
  );
}
