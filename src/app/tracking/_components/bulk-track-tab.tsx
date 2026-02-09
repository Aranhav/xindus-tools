"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, ChevronDown, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

import { StatusBadge } from "@/components/status-badge";
import { ErrorDisplay } from "@/components/error-display";
import { useBulkTracking } from "@/hooks/use-tracking";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import type { TrackingResult } from "@/types/tracking";
import { Timeline } from "./timeline";

/* ------------------------------------------------------------------ */
/*  Expandable row                                                      */
/* ------------------------------------------------------------------ */

function BulkExpandableRow({ result }: { result: TrackingResult }) {
  const [open, setOpen] = useState(false);
  const lastEvent = result.events[0];

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <>
        <CollapsibleTrigger asChild>
          <TableRow className="cursor-pointer">
            <TableCell>
              <div className="flex items-center gap-1">
                {open ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-mono text-sm">{result.tracking_id}</span>
              </div>
            </TableCell>
            <TableCell>
              {result.error ? (
                <StatusBadge status="Failed" />
              ) : (
                <StatusBadge status={result.status} />
              )}
            </TableCell>
            <TableCell className="text-sm">{result.origin || "-"}</TableCell>
            <TableCell className="text-sm">{result.destination || "-"}</TableCell>
            <TableCell className="text-sm max-w-[200px] truncate">
              {result.error
                ? result.error
                : lastEvent
                  ? `${lastEvent.event} (${lastEvent.date})`
                  : "-"}
            </TableCell>
          </TableRow>
        </CollapsibleTrigger>

        <CollapsibleContent asChild>
          <tr>
            <td colSpan={5} className="p-0">
              <div className="border-t bg-muted/30 px-8 py-4">
                {result.error ? (
                  <p className="text-sm text-destructive">{result.error}</p>
                ) : (
                  <Timeline events={result.events} />
                )}
              </div>
            </td>
          </tr>
        </CollapsibleContent>
      </>
    </Collapsible>
  );
}

/* ------------------------------------------------------------------ */
/*  Bulk Track Tab (exported)                                           */
/* ------------------------------------------------------------------ */

export function BulkTrackTab() {
  const [ids, setIds] = useState("");
  const { results, loading, error, trackBulk } = useBulkTracking();

  const parsedIds = ids
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const count = Math.min(parsedIds.length, 10);

  const handleTrack = () => {
    if (!parsedIds.length) return;
    trackBulk(parsedIds.slice(0, 10));
  };

  const handleExport = () => {
    if (!results.length) return;

    const rows = results.flatMap((r) => {
      if (r.error) {
        return [
          {
            "Tracking ID": r.tracking_id,
            Status: "Error",
            Origin: "",
            Destination: "",
            "Event Date": "",
            "Event Time": "",
            Event: r.error,
            Office: "",
          },
        ];
      }
      if (!r.events.length) {
        return [
          {
            "Tracking ID": r.tracking_id,
            Status: r.status,
            Origin: r.origin || "",
            Destination: r.destination || "",
            "Event Date": "",
            "Event Time": "",
            Event: "No events",
            Office: "",
          },
        ];
      }
      return r.events.map((ev, idx) => ({
        "Tracking ID": idx === 0 ? r.tracking_id : "",
        Status: idx === 0 ? r.status : "",
        Origin: idx === 0 ? r.origin || "" : "",
        Destination: idx === 0 ? r.destination || "" : "",
        "Event Date": ev.date,
        "Event Time": ev.time,
        Event: ev.event,
        Office: ev.office,
      }));
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracking Results");
    XLSX.writeFile(wb, `tracking_results_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Textarea
          placeholder={
            "Enter up to 10 tracking IDs, one per line\ne.g.\nEM123456789IN\nEM987654321IN"
          }
          value={ids}
          onChange={(e) => setIds(e.target.value)}
          rows={5}
          className="max-w-lg font-mono text-sm"
        />
        <div className="flex items-center gap-3">
          <Button
            onClick={handleTrack}
            disabled={loading || !parsedIds.length}
          >
            <Search className="mr-2 h-4 w-4" />
            Track All{count > 0 ? ` (${count})` : ""}
          </Button>
          {parsedIds.length > 10 && (
            <p className="text-xs text-warning-foreground">
              Only the first 10 IDs will be tracked.
            </p>
          )}
        </div>
      </div>

      {error && <ErrorDisplay message={error} onRetry={handleTrack} />}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {results.length > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>

          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Last Event</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <BulkExpandableRow key={r.tracking_id} result={r} />
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
