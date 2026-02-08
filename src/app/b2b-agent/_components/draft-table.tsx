"use client";

import { Loader2, Eye, CheckCircle2, XCircle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelativeDate } from "./helpers";
import type { DraftSummary } from "@/types/agent";

/* ── Status badge ──────────────────────────────────────────── */

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

/* ── Confidence dot ────────────────────────────────────────── */

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

/* ── Draft table ───────────────────────────────────────────── */

interface DraftTableProps {
  drafts: DraftSummary[];
  loading: boolean;
  selectedId: string | null;
  onView: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function DraftTable({
  drafts,
  loading,
  selectedId,
  onView,
  onApprove,
  onReject,
}: DraftTableProps) {
  if (loading && drafts.length === 0) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading drafts...</p>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No drafts found. Upload files to create new drafts.
        </CardContent>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-center">Conf.</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Shipper</TableHead>
          <TableHead>Receiver</TableHead>
          <TableHead className="w-16 text-right">Boxes</TableHead>
          <TableHead className="w-24 text-right">Value</TableHead>
          <TableHead className="w-14 text-right">Files</TableHead>
          <TableHead className="w-24 text-right">Created</TableHead>
          <TableHead className="w-28 text-center">Status</TableHead>
          <TableHead className="w-28 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drafts.map((draft) => {
          const overall = (
            draft.confidence_scores as Record<string, number> | undefined
          )?._overall;
          const isPending = draft.status === "pending_review";

          return (
            <TableRow
              key={draft.id}
              data-state={draft.id === selectedId ? "selected" : undefined}
              className="cursor-pointer"
              onClick={() => onView(draft.id)}
            >
              {/* Confidence */}
              <TableCell className="text-center">
                {overall != null ? (
                  <ConfidenceDot value={overall} />
                ) : (
                  <Package className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                )}
              </TableCell>

              {/* Invoice */}
              <TableCell className="font-medium">
                {draft.invoice_number || "Draft"}
              </TableCell>

              {/* Shipper */}
              <TableCell className="max-w-[160px] truncate text-muted-foreground">
                {draft.shipper_name || "\u2014"}
              </TableCell>

              {/* Receiver */}
              <TableCell className="max-w-[160px] truncate text-muted-foreground">
                {draft.receiver_name || "\u2014"}
              </TableCell>

              {/* Boxes */}
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {draft.box_count ?? "\u2014"}
              </TableCell>

              {/* Value */}
              <TableCell className="text-right tabular-nums">
                {draft.total_value != null
                  ? `$${draft.total_value.toLocaleString()}`
                  : "\u2014"}
              </TableCell>

              {/* Files */}
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {draft.file_count}
              </TableCell>

              {/* Created */}
              <TableCell className="text-right text-muted-foreground">
                {formatRelativeDate(draft.created_at)}
              </TableCell>

              {/* Status */}
              <TableCell className="text-center">
                <DraftStatusBadge status={draft.status} />
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div
                  className="flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onView(draft.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {isPending && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-success hover:text-success"
                              onClick={() => onApprove(draft.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Approve</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onReject(draft.id)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reject</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
