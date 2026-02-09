"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";
import { ErrorDisplay } from "@/components/error-display";
import { useTracking } from "@/hooks/use-tracking";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { TrackingResult } from "@/types/tracking";
import { Timeline } from "./timeline";

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                     */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Detail cell                                                         */
/* ------------------------------------------------------------------ */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single track result                                                 */
/* ------------------------------------------------------------------ */

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
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {result.origin && <Detail label="Origin" value={result.origin} />}
            {result.destination && <Detail label="Destination" value={result.destination} />}
            {result.booked_on && <Detail label="Booked Date" value={result.booked_on} />}
            {result.weight && <Detail label="Weight" value={result.weight} />}
            {result.expected_delivery && <Detail label="Expected Delivery" value={result.expected_delivery} />}
          </div>

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

/* ------------------------------------------------------------------ */
/*  Single Track Tab (exported)                                         */
/* ------------------------------------------------------------------ */

export function SingleTrackTab() {
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
