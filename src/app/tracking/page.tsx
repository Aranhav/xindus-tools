"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Search, Download, ChevronDown, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";
import { ErrorDisplay } from "@/components/error-display";
import { useTracking, useBulkTracking } from "@/hooks/use-tracking";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import type { TrackingEvent, TrackingResult } from "@/types/tracking";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEventColor(event: string): "success" | "info" | "muted" {
  const lower = event.toLowerCase();
  if (lower.includes("delivered")) return "success";
  if (
    lower.includes("transit") ||
    lower.includes("dispatched") ||
    lower.includes("dispatch") ||
    lower.includes("out for delivery") ||
    lower.includes("arrived") ||
    lower.includes("received")
  )
    return "info";
  return "muted";
}

const dotColor: Record<string, string> = {
  success: "bg-success",
  info: "bg-info",
  muted: "bg-muted-foreground",
};

const lineColor: Record<string, string> = {
  success: "border-success/40",
  info: "border-info/40",
  muted: "border-border",
};

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

function Timeline({ events }: { events: TrackingEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No tracking events available.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {events.map((ev, idx) => {
        const color = getEventColor(ev.event);
        const isLast = idx === events.length - 1;

        return (
          <div key={idx} className="relative flex gap-4">
            {/* Left column: date/time */}
            <div className="w-28 shrink-0 pt-0.5 text-right">
              <p className="text-xs font-medium text-foreground">{ev.date}</p>
              <p className="text-xs text-muted-foreground">{ev.time}</p>
            </div>

            {/* Dot + line */}
            <div className="relative flex flex-col items-center">
              <div
                className={`z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full ring-2 ring-background ${dotColor[color]}`}
              />
              {!isLast && (
                <div
                  className={`w-px flex-1 border-l-2 ${lineColor[color]}`}
                />
              )}
            </div>

            {/* Right column: event + office */}
            <div className={`pb-6 pt-0.5 ${isLast ? "pb-0" : ""}`}>
              <p className="text-sm font-medium text-foreground">{ev.event}</p>
              <p className="text-xs text-muted-foreground">{ev.office}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader for single track
// ---------------------------------------------------------------------------

function TrackingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-3 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Single Track Result
// ---------------------------------------------------------------------------

function SingleTrackResult({ result }: { result: TrackingResult }) {
  if (result.error) {
    return <ErrorDisplay message={result.error} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold font-mono">
                {result.tracking_id}
              </CardTitle>
              <CopyButton text={result.tracking_id} />
            </div>
            <StatusBadge status={result.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {result.origin && (
              <Detail label="Origin" value={result.origin} />
            )}
            {result.destination && (
              <Detail label="Destination" value={result.destination} />
            )}
            {result.booked_on && (
              <Detail label="Booked Date" value={result.booked_on} />
            )}
            {result.weight && (
              <Detail label="Weight" value={result.weight} />
            )}
            {result.expected_delivery && (
              <Detail label="Expected Delivery" value={result.expected_delivery} />
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Tracking Events
            </h3>
            <Timeline events={result.events} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Track Tab
// ---------------------------------------------------------------------------

function SingleTrackTab() {
  const [trackingId, setTrackingId] = useState("");
  const { result, loading, error, track } = useTracking();

  const handleTrack = () => {
    const id = trackingId.trim();
    if (!id) return;
    track(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTrack();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Input
          placeholder="Enter tracking ID (e.g. EM123456789IN)"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-md font-mono"
        />
        <Button onClick={handleTrack} disabled={loading || !trackingId.trim()}>
          <Search className="mr-2 h-4 w-4" />
          Track
        </Button>
      </div>

      {error && <ErrorDisplay message={error} onRetry={handleTrack} />}
      {loading && <TrackingSkeleton />}
      {result && !loading && <SingleTrackResult result={result} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bulk Track Tab
// ---------------------------------------------------------------------------

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

function BulkTrackTab() {
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TrackingPage() {
  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="IndiaPost Tracker"
          description="Track your India Post shipments in real-time. Single or bulk tracking with export support."
          icon={<Package className="h-5 w-5" />}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Tabs defaultValue="single">
            <TabsList>
              <TabsTrigger value="single">Single Track</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Track</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="mt-6">
              <SingleTrackTab />
            </TabsContent>

            <TabsContent value="bulk" className="mt-6">
              <BulkTrackTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
