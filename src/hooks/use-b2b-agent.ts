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
  SellerMatchResult,
  SellerHistory,
  ActiveBatchesResponse,
} from "@/types/agent";

export type DraftTab = "all" | "pending_review" | "approved" | "rejected" | "archived";

const STEP_LABELS: Record<SSEProgress["step"], string> = {
  classifying: "Classifying documents",
  extracting: "Extracting data with AI",
  grouping: "Grouping into shipments",
  building_drafts: "Building draft shipments",
  enriching: "Classifying items with Gaia",
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
  const [sellerHistory, setSellerHistory] = useState<SellerHistory | null>(null);

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
        } else {
          qs.set("exclude_status", "archived");
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
        setSellerProfile(data.seller ?? null);
        // Refresh the drafts list so the table shows updated values
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

  // ── Archive draft ──────────────────────────────────────────

  const archiveDraft = useCallback(
    async (draftId: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b-agent/drafts/${draftId}/archive`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to archive draft");
        fetchDrafts();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [fetchDrafts],
  );

  // ── Delete draft (permanent) ───────────────────────────────

  const deleteDraft = useCallback(
    async (draftId: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b-agent/drafts/${draftId}/delete`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to delete draft");
        fetchDrafts();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [fetchDrafts],
  );

  // ── Bulk operations ──────────────────────────────────────

  const bulkApprove = useCallback(
    async (ids: string[]) => {
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/b2b-agent/drafts/${id}/approve`, { method: "POST" }),
          ),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) setError(`${failed} of ${ids.length} approvals failed`);
        fetchDrafts();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [fetchDrafts],
  );

  const bulkReject = useCallback(
    async (ids: string[]) => {
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/b2b-agent/drafts/${id}`, { method: "DELETE" }),
          ),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) setError(`${failed} of ${ids.length} rejections failed`);
        fetchDrafts();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [fetchDrafts],
  );

  const bulkArchive = useCallback(
    async (ids: string[]) => {
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/b2b-agent/drafts/${id}/archive`, { method: "POST" }),
          ),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) setError(`${failed} of ${ids.length} archives failed`);
        fetchDrafts();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [fetchDrafts],
  );

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/b2b-agent/drafts/${id}/delete`, { method: "POST" }),
          ),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) setError(`${failed} of ${ids.length} deletions failed`);
        fetchDrafts();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [fetchDrafts],
  );

  // ── Re-extract draft ──────────────────────────────────────

  const reExtractDraft = useCallback(
    async (draftId: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b-agent/drafts/${draftId}/re-extract`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to re-extract draft");
        const data: DraftDetail = await res.json();
        setActiveDraft(data);
        setSellerProfile(data.seller ?? null);
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

  // ── Classify items with Gaia ──────────────────────────────

  const classifyItems = useCallback(
    async (draftId: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b-agent/drafts/${draftId}/classify`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("Failed to classify items");
        const data: DraftDetail = await res.json();
        setActiveDraft(data);
        setSellerProfile(data.seller ?? null);
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

  // ── Add files to draft ─────────────────────────────────────

  const addFilesToDraft = useCallback(
    async (draftId: string, files: File[]): Promise<DraftDetail | null> => {
      setLoading(true);
      try {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        const res = await fetch(`/api/b2b-agent/drafts/${draftId}/files`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to add files");
        const data: DraftDetail = await res.json();
        setActiveDraft(data);
        setSellerProfile(data.seller ?? null);
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

  // ── Remove file from draft ────────────────────────────────

  const removeFileFromDraft = useCallback(
    async (draftId: string, fileId: string): Promise<DraftDetail | null> => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b-agent/drafts/${draftId}/files/${fileId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to remove file");
        const data: DraftDetail = await res.json();
        setActiveDraft(data);
        setSellerProfile(data.seller ?? null);
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

  // ── Download file from draft ──────────────────────────────

  const downloadDraftFile = useCallback(
    (draftId: string, fileId: string) => {
      window.open(`/api/b2b-agent/drafts/${draftId}/files/${fileId}/download`, "_blank");
    },
    [],
  );

  // ── Search / match seller by name ─────────────────────────

  const searchSellers = useCallback(
    async (name: string): Promise<SellerMatchResult | null> => {
      try {
        const qs = new URLSearchParams({ name });
        const res = await fetch(`/api/b2b-agent/sellers?${qs.toString()}`);
        if (!res.ok) return null;
        const data = await res.json();
        // Backend returns a seller profile or match result
        if (data.seller) {
          return {
            seller: data.seller,
            confidence: data.confidence ?? 0,
            match_reason: data.match_reason,
          };
        }
        // If it returns the profile directly (no wrapper)
        if (data.id && data.name) {
          return {
            seller: data as SellerProfile,
            confidence: data.confidence ?? 0.8,
            match_reason: "Name match",
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  // ── Link seller to draft ─────────────────────────────────

  const linkSellerToDraft = useCallback(
    async (draftId: string, sellerId: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b-agent/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            corrections: [
              { field_path: "seller_id", old_value: null, new_value: sellerId },
            ],
          }),
        });
        if (!res.ok) throw new Error("Failed to link seller");
        const data: DraftDetail = await res.json();
        setActiveDraft(data);
        setSellerProfile(data.seller ?? null);
        // Refresh the drafts list so the table reflects seller changes
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

  // ── Fetch seller history (previous approved shipments) ────

  const fetchSellerHistory = useCallback(
    async (sellerId: string) => {
      try {
        const res = await fetch(`/api/b2b-agent/sellers/${sellerId}/history`);
        if (!res.ok) {
          setSellerHistory(null);
          return null;
        }
        const data: SellerHistory = await res.json();
        setSellerHistory(data);
        return data;
      } catch {
        setSellerHistory(null);
        return null;
      }
    },
    [],
  );

  return {
    // Tab state
    activeTab,
    drafts,
    draftsTotal,
    activeDraft,
    sellerProfile,
    sellerHistory,

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
    archiveDraft,
    reExtractDraft,
    classifyItems,
    addFilesToDraft,
    removeFileFromDraft,
    downloadDraftFile,
    deleteDraft,
    bulkApprove,
    bulkReject,
    bulkArchive,
    bulkDelete,
    searchSellers,
    linkSellerToDraft,
    fetchSellerHistory,
    setActiveDraft,
    setError,
  };
}
