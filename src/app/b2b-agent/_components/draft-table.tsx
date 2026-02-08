"use client";

import { useState, useMemo } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Archive,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeDate } from "./helpers";
import type { DraftSummary } from "@/types/agent";

/* ── Status badge ──────────────────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  pending_review: "bg-warning-muted text-warning-foreground",
  approved: "bg-success-muted text-success-foreground",
  rejected: "bg-destructive/10 text-destructive",
  pushed: "bg-info-muted text-info-foreground",
  archived: "bg-muted text-muted-foreground",
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

/* ── Column sorting ────────────────────────────────────────── */

type SortKey =
  | "shipper_name"
  | "invoice_number"
  | "receiver_name"
  | "box_count"
  | "total_value"
  | "created_at"
  | "status";
type SortDir = "asc" | "desc";

function SortableHead({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey | null;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = activeSortKey === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => onSort(sortKey)}
      >
        {label}
        {isActive ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </TableHead>
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
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DraftTable({
  drafts,
  loading,
  selectedId,
  onView,
  onApprove,
  onReject,
  onArchive,
  onDelete,
}: DraftTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // Reset to first page when drafts change (filters, search, tab switch)
  useMemo(() => { setPage(0); }, [drafts]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedDrafts = useMemo(() => {
    if (!sortKey) return drafts;

    return [...drafts].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;

      const valA = a[sortKey];
      const valB = b[sortKey];

      // Nulls to bottom
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      // Date column
      if (sortKey === "created_at") {
        return (new Date(valA as string).getTime() - new Date(valB as string).getTime()) * dir;
      }

      // Numeric columns
      if (sortKey === "box_count" || sortKey === "total_value") {
        return ((valA as number) - (valB as number)) * dir;
      }

      // String columns
      return String(valA).localeCompare(String(valB)) * dir;
    });
  }, [drafts, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedDrafts.length / pageSize);
  const pagedDrafts = sortedDrafts.slice(page * pageSize, (page + 1) * pageSize);

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

  const canDelete = (status: string) =>
    status === "pending_review" || status === "rejected";
  const canArchive = (status: string) => status !== "archived";

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead label="Shipper" sortKey="shipper_name" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableHead label="Invoice" sortKey="invoice_number" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableHead label="Receiver" sortKey="receiver_name" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableHead label="Boxes" sortKey="box_count" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-16 text-right" />
            <SortableHead label="Value" sortKey="total_value" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-24 text-right" />
            <TableHead className="w-14 text-right">Files</TableHead>
            <SortableHead label="Created" sortKey="created_at" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-24 text-right" />
            <SortableHead label="Status" sortKey="status" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-28 text-center" />
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedDrafts.map((draft) => {
            const isPending = draft.status === "pending_review";

            return (
              <TableRow
                key={draft.id}
                data-state={draft.id === selectedId ? "selected" : undefined}
                className="cursor-pointer"
                onClick={() => onView(draft.id)}
              >
                {/* Shipper */}
                <TableCell className="max-w-[160px] truncate font-medium">
                  {draft.shipper_name || "\u2014"}
                </TableCell>

                {/* Invoice */}
                <TableCell className="text-muted-foreground">
                  {draft.invoice_number || "Draft"}
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

                    {/* Overflow menu for Archive / Delete */}
                    {(canArchive(draft.status) || canDelete(draft.status)) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canArchive(draft.status) && (
                            <DropdownMenuItem onClick={() => onArchive(draft.id)}>
                              <Archive className="mr-2 h-3.5 w-3.5" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {canDelete(draft.status) && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(draft.id)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {sortedDrafts.length > 0 && (
        <div className="flex items-center justify-between border-t px-2 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(0);
              }}
            >
              <SelectTrigger className="h-7 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedDrafts.length)} of{" "}
              {sortedDrafts.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The draft and all associated data will
              be permanently removed from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
