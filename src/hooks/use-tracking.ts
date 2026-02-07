"use client";

import { useState, useCallback } from "react";
import type { TrackingResult } from "@/types/tracking";

export function useTracking() {
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const track = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(id.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to track");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, track };
}

export function useBulkTracking() {
  const [results, setResults] = useState<TrackingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackBulk = useCallback(async (ids: string[]) => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch("/api/tracking/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_ids: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to track");
      setResults(data.results || data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, trackBulk };
}
