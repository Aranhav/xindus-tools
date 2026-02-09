"use client";

import {
  CheckCircle2,
  XCircle,
  Archive,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DraftTab } from "@/hooks/use-b2b-agent";

/* ── Types ────────────────────────────────────────────────── */

export interface BulkBarProps {
  count: number;
  activeTab: DraftTab;
  selectedStatuses: string[];
  onApprove: () => void;
  onReject: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClear: () => void;
}

/* ── Bulk action bar component ────────────────────────────── */

export function BulkActionBar({
  count,
  activeTab,
  selectedStatuses,
  onApprove,
  onReject,
  onArchive,
  onDelete,
  onClear,
}: BulkBarProps) {
  const allPending = selectedStatuses.every((s) => s === "pending_review");
  const allDeletable = selectedStatuses.every(
    (s) => s === "pending_review" || s === "rejected",
  );
  const allArchivable = selectedStatuses.every((s) => s !== "archived");

  const showApprove = allPending;
  const showReject = allPending;
  const showArchive = allArchivable && activeTab !== "archived";
  const showDelete = allDeletable;

  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-2 rounded-lg border bg-background px-4 py-2 shadow-lg">
      <span className="text-sm font-medium tabular-nums">
        {count} selected
      </span>

      <div className="mx-1 h-4 w-px bg-border" />

      {showApprove && (
        <Button variant="outline" size="sm" onClick={onApprove}>
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-success" />
          Approve
        </Button>
      )}
      {showReject && (
        <Button variant="outline" size="sm" onClick={onReject}>
          <XCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" />
          Reject
        </Button>
      )}
      {showArchive && (
        <Button variant="outline" size="sm" onClick={onArchive}>
          <Archive className="mr-1.5 h-3.5 w-3.5" />
          Archive
        </Button>
      )}
      {showDelete && (
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>
      )}

      <div className="mx-1 h-4 w-px bg-border" />

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
