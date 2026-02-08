"use client";

import { useState, useCallback, useRef } from "react";
import type {
  SSEProgress,
  UploadResponse,
  DraftsListResponse,
  DraftSummary,
  DraftDetail,
  CorrectionItem,
  ApprovalResponse,
  SellerProfile,
  ActiveBatchesResponse,
} from "@/types/agent";

export type DraftTab = "all" | "pending_review" | "approved" | "rejected";

const STEP_LABELS: Record<SSEProgress["step"], string> = {
  classifying: "Classifying documents",
  extracting: "Extracting data with AI",
  grouping: "Grouping into shipments",
  building_drafts: "Building draft shipments",
  complete: "Processing complete",
  error: "Error",
};

export function useB2BAgent() {
  // Draft list state
  const [activeTab, setActiveTab] = useState<DraftTab>("all");
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [draftsTotal, setDraftsTotal] = useState(0);
  const [activeDraft, setActiveDraft] = useState<DraftDetail | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

  // Upload / processing state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<SSEProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | undefined>(undefined);
  const pollingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // ── Stop any active polling ─────────────────────────────────

  const _stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = undefined;
    }
  }, []);

  // ── Fetch drafts list (for tabs) ────────────────────────────

  const fetchDrafts = useCallback(
    async (status?: DraftTab, offset = 0) => {
      const tab = status ?? activeTab;
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          limit: "50",
          offset: String(offset),
        });
        if (tab !== "all") {
          qs.set("status", tab);
        }
        const res = await fetch(`/api/b2b-agent/drafts?${qs.toString()}`);
        if (!res.ok) throw new Error("Failed to load drafts");
        const data: DraftsListResponse = await res.json();
        setDrafts(data.drafts);
        setDraftsTotal(data.total);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [activeTab],
  );

  const switchTab = useCallback(
    (tab: DraftTab) => {
      setActiveTab(tab);
      setActiveDraft(null);
      fetchDrafts(tab);
    },
    [fetchDrafts],
  );

  // ── Upload files (non-blocking) ─────────────────────────────

  const upload = useCallback(
    async (files: File[]) => {
      setError(null);
      setProcessing(true);
      setProgress(null);

      try {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));

        const res = await fetch("/api/b2b-agent/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(data.error || "Upload failed");
        }

        const data: UploadResponse = await res.json();

        // Start SSE stream in background — user can continue browsing
        _startSSE(data.batch_id);
      } catch (err) {
        setError((err as Error).message);
        setProcessing(false);
      }
    },
    [],
  );

  // ── Polling fallback (when SSE queue is gone) ────────────────

  const _startPolling = useCallback(
    (batchId: string) => {
      _stopPolling();

      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/b2b-agent/jobs/active");
          if (!res.ok) return;
          const data: ActiveBatchesResponse = await res.json();
          const batch = data.batches.find((b) => b.id === batchId);

          if (!batch) {
            // Batch no longer processing — it finished
            _stopPolling();
            setProcessing(false);
            setProgress(null);
            fetchDrafts();
            return;
          }

          // Update progress from DB state
          const sp = batch.step_progress;
          setProgress({
            step: (batch.current_step || "processing") as SSEProgress["step"],
            completed: sp.completed ?? 0,
            total: sp.total ?? batch.file_count,
            file: sp.file,
            shipments_found: sp.shipments_found,
          });
        } catch {
          // Ignore transient fetch errors during polling
        }
      }, 3000);
    },
    [fetchDrafts, _stopPolling],
  );

  // ── SSE progress stream (background) ────────────────────────

  const _startSSE = useCallback(
    (bId: string) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      _stopPolling();

      const es = new EventSource(`/api/b2b-agent/jobs/${bId}/stream`);
      eventSourceRef.current = es;

      es.addEventListener("progress", (event) => {
        try {
          const data: SSEProgress = JSON.parse(event.data);
          setProgress(data);

          if (data.step === "complete") {
            es.close();
            eventSourceRef.current = undefined;
            setProcessing(false);
            // Refresh the current tab to show new drafts
            fetchDrafts();
          } else if (data.step === "error") {
            es.close();
            eventSourceRef.current = undefined;
            setError(data.message || "Processing failed");
            setProcessing(false);
          }
        } catch {
          // Ignore parse errors
        }
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = undefined;
        // Instead of giving up, fall back to polling
        _startPolling(bId);
      };
    },
    [fetchDrafts, _stopPolling, _startPolling],
  );

  // ── Check for active jobs on mount (persistent status) ──────

  const checkActiveJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/b2b-agent/jobs/active");
      if (!res.ok) return;
      const data: ActiveBatchesResponse = await res.json();

      if (data.batches.length === 0) return;

      // Take the most recent processing batch
      const batch = data.batches[0];
      setProcessing(true);

      // Convert DB state into SSEProgress for the banner
      const sp = batch.step_progress;
      setProgress({
        step: (batch.current_step || "processing") as SSEProgress["step"],
        completed: sp.completed ?? 0,
        total: sp.total ?? batch.file_count,
        file: sp.file,
        shipments_found: sp.shipments_found,
      });

      // Try to reconnect SSE for real-time updates
      // If the queue is gone (404), _startSSE's onerror will kick in polling
      _startSSE(batch.id);
    } catch {
      // Silently fail — this is a best-effort recovery
    }
  }, [_startSSE]);

  // ── Fetch single draft detail ───────────────────────────────

  const fetchDraft = useCallback(async (draftId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/b2b-agent/drafts/${draftId}`);
      if (!res.ok) throw new Error("Failed to load draft");
      const data: DraftDetail = await res.json();
      setActiveDraft(data);
      setSellerProfile(data.seller ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Apply corrections ───────────────────────────────────────

  const applyCorrections = useCallback(
    async (draftId: string, corrections: CorrectionItem[]) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b-agent/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ corrections }),
        });
        if (!res.ok) throw new Error("Failed to apply corrections");
        const data: DraftDetail = await res.json();
        setActiveDraft(data);
        return data;
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ── Approve draft ───────────────────────────────────────────

  const approveDraft = useCallback(
    async (draftId: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b-agent/drafts/${draftId}/approve`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to approve draft");
        const data: ApprovalResponse = await res.json();
        // Refresh the list
        fetchDrafts();
        return data;
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchDrafts],
  );

  // ── Reject draft ────────────────────────────────────────────

  const rejectDraft = useCallback(
    async (draftId: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b-agent/drafts/${draftId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to reject draft");
        // Refresh the list
        fetchDrafts();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [fetchDrafts],
  );

  return {
    // Tab state
    activeTab,
    drafts,
    draftsTotal,
    activeDraft,
    sellerProfile,

    // Processing state
    processing,
    progress,
    progressLabel: progress ? STEP_LABELS[progress.step] || progress.step : "",
    error,
    loading,

    // Actions
    switchTab,
    fetchDrafts,
    upload,
    fetchDraft,
    checkActiveJobs,
    applyCorrections,
    approveDraft,
    rejectDraft,
    setActiveDraft,
    setError,
  };
}
