"use client";

import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fadeIn } from "./helpers";
import type { DraftSummary } from "@/types/agent";

/* ── Status badge (shared) ──────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  pending_review: "bg-warning-muted text-warning-foreground",
  approved: "bg-success-muted text-success-foreground",
  rejected: "bg-destructive/10 text-destructive",
  pushed: "bg-info-muted text-info-foreground",
};

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

/* ── Confidence dot ──────────────────────────────────────── */

function ConfidenceDot({ value }: { value: number }) {
  const color =
    value >= 85 ? "bg-success" : value >= 65 ? "bg-warning" : "bg-destructive";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
        </TooltipTrigger>
        <TooltipContent side="top">{Math.round(value)}% confidence</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ── Draft row ───────────────────────────────────────────── */

interface DraftRowProps {
  draft: DraftSummary;
  selected: boolean;
  onClick: () => void;
}

export function DraftRow({ draft, selected, onClick }: DraftRowProps) {
  const overall = (draft.confidence_scores as Record<string, number> | undefined)?._overall;

  return (
    <motion.button
      variants={fadeIn}
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-accent/50 ${
        selected ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      {/* Confidence dot */}
      {overall != null ? (
        <ConfidenceDot value={overall} />
      ) : (
        <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}

      {/* Invoice / title */}
      <span className="w-24 shrink-0 truncate font-medium">
        {draft.invoice_number || "Draft"}
      </span>

      {/* Shipper -> Receiver */}
      <span className="min-w-0 flex-1 truncate text-muted-foreground">
        {draft.shipper_name || "\u2014"}
        <span className="mx-1.5">&rarr;</span>
        {draft.receiver_name || "\u2014"}
      </span>

      {/* Box count */}
      <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
        {draft.box_count ?? "\u2014"} box{draft.box_count !== 1 ? "es" : ""}
      </span>

      {/* Total value */}
      <span className="w-20 shrink-0 text-right tabular-nums">
        {draft.total_value != null ? `$${draft.total_value.toLocaleString()}` : "\u2014"}
      </span>

      {/* Status */}
      <DraftStatusBadge status={draft.status} />
    </motion.button>
  );
}
