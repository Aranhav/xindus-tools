"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { useB2BAgent, type DraftTab } from "@/hooks/use-b2b-agent";
import { Toolbar, DEFAULT_FILTERS, type DraftFilters } from "./_components/toolbar";
import { ProcessingBar } from "./_components/processing-bar";
import { DraftTable } from "./_components/draft-table";
import { DraftDetailSheet } from "./_components/draft-detail-sheet";

const TAB_OPTIONS: { value: DraftTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

export default function B2BAgentPage() {
  const agent = useB2BAgent();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DraftFilters>(DEFAULT_FILTERS);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  // Load drafts + check for in-flight jobs on mount
  useEffect(() => {
    agent.fetchDrafts();
    agent.checkActiveJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side search + filters
  const filteredDrafts = useMemo(() => {
    let result = agent.drafts;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.invoice_number?.toLowerCase().includes(q) ||
          d.shipper_name?.toLowerCase().includes(q) ||
          d.receiver_name?.toLowerCase().includes(q),
      );
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = Date.now();
      const cutoff: Record<string, number> = {
        today: now - 86400000,
        "7d": now - 7 * 86400000,
        "30d": now - 30 * 86400000,
      };
      if (cutoff[filters.dateRange]) {
        result = result.filter(
          (d) => d.created_at && new Date(d.created_at).getTime() >= cutoff[filters.dateRange],
        );
      }
    }

    // Value range filter
    if (filters.valueRange !== "all") {
      const bounds: Record<string, [number, number]> = {
        lt1k: [0, 1000],
        "1k-5k": [1000, 5000],
        "5k-10k": [5000, 10000],
        gt10k: [10000, Infinity],
      };
      const [min, max] = bounds[filters.valueRange] ?? [0, Infinity];
      result = result.filter(
        (d) => d.total_value != null && d.total_value >= min && d.total_value < max,
      );
    }

    // Shipper filter
    if (filters.shipper !== "all") {
      result = result.filter((d) => d.shipper_name === filters.shipper);
    }

    // Receiver filter
    if (filters.receiver !== "all") {
      result = result.filter((d) => d.receiver_name === filters.receiver);
    }

    // Box count filter
    if (filters.boxCount !== "all") {
      const boxBounds: Record<string, [number, number]> = {
        "1": [1, 1],
        "2-5": [2, 5],
        "6-10": [6, 10],
        gt10: [11, Infinity],
      };
      const [min, max] = boxBounds[filters.boxCount] ?? [0, Infinity];
      result = result.filter(
        (d) => d.box_count != null && d.box_count >= min && d.box_count <= max,
      );
    }

    // Seller filter
    if (filters.seller !== "all") {
      result = result.filter((d) => d.seller_id === filters.seller);
    }

    return result;
  }, [agent.drafts, search, filters]);

  // Per-status counts — computed from "all" tab data, cached across tab switches
  const [statusCounts, setStatusCounts] = useState<Record<DraftTab, number>>({
    all: 0, pending_review: 0, approved: 0, rejected: 0, archived: 0,
  });

  useEffect(() => {
    if (agent.activeTab === "all") {
      const counts: Record<DraftTab, number> = {
        all: agent.draftsTotal,
        pending_review: 0,
        approved: 0,
        rejected: 0,
        archived: 0,
      };
      for (const d of agent.drafts) {
        if (d.status in counts) {
          counts[d.status as DraftTab]++;
        }
      }
      setStatusCounts(counts);
    }
  }, [agent.drafts, agent.draftsTotal, agent.activeTab]);

  const handleUpload = useCallback(
    (files: File[]) => {
      agent.upload(files);
    },
    [agent],
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      agent.switchTab(tab as DraftTab);
      setSearch("");
      setFilters(DEFAULT_FILTERS);
    },
    [agent],
  );

  const handleSelectDraft = useCallback(
    (id: string) => {
      setSelectedDraftId(id);
      agent.fetchDraft(id);
    },
    [agent],
  );

  const handleSheetClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setSelectedDraftId(null);
        agent.setActiveDraft(null);
      }
    },
    [agent],
  );

  const handleCorrect = useCallback(
    (draftId: string, corrections: Parameters<typeof agent.applyCorrections>[1]) => {
      return agent.applyCorrections(draftId, corrections);
    },
    [agent],
  );

  const handleApprove = useCallback(
    async (draftId: string) => {
      await agent.approveDraft(draftId);
      setSelectedDraftId(null);
    },
    [agent],
  );

  const handleReject = useCallback(
    async (draftId: string) => {
      await agent.rejectDraft(draftId);
      setSelectedDraftId(null);
    },
    [agent],
  );

  const handleReExtract = useCallback(
    async (draftId: string) => {
      await agent.reExtractDraft(draftId);
    },
    [agent],
  );

  const handleArchive = useCallback(
    async (draftId: string) => {
      await agent.archiveDraft(draftId);
    },
    [agent],
  );

  const handleDelete = useCallback(
    async (draftId: string) => {
      await agent.deleteDraft(draftId);
      if (selectedDraftId === draftId) {
        setSelectedDraftId(null);
        agent.setActiveDraft(null);
      }
    },
    [agent, selectedDraftId],
  );

  const handleBulkApprove = useCallback(
    async (ids: string[]) => {
      await agent.bulkApprove(ids);
    },
    [agent],
  );

  const handleBulkReject = useCallback(
    async (ids: string[]) => {
      await agent.bulkReject(ids);
    },
    [agent],
  );

  const handleBulkArchive = useCallback(
    async (ids: string[]) => {
      await agent.bulkArchive(ids);
    },
    [agent],
  );

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      await agent.bulkDelete(ids);
      // If any of the deleted drafts was currently open, close the detail sheet
      if (selectedDraftId && ids.includes(selectedDraftId)) {
        setSelectedDraftId(null);
        agent.setActiveDraft(null);
      }
    },
    [agent, selectedDraftId],
  );

  return (
    <PageContainer>
      <PageHeader
        title="B2B Booking Agent"
        description="Upload shipment documents, AI extracts and groups into draft shipments for review."
        icon={<Bot className="h-5 w-5" />}
      />

      {/* Toolbar: Upload + Search */}
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        allDrafts={agent.drafts}
        onUpload={handleUpload}
      />

      {/* Error banner */}
      {agent.error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {agent.error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => agent.setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Processing bar (slim) */}
      <AnimatePresence>
        {agent.processing && (
          <ProcessingBar progress={agent.progress} label={agent.progressLabel} />
        )}
      </AnimatePresence>

      {/* Tabs + data table */}
      <Tabs value={agent.activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line">
          {TAB_OPTIONS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {statusCounts[tab.value] > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  {statusCounts[tab.value]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Single content area — all tabs render the same table with filtered data */}
        {TAB_OPTIONS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <DraftTable
              drafts={filteredDrafts}
              loading={agent.loading}
              selectedId={selectedDraftId}
              activeTab={agent.activeTab}
              onView={handleSelectDraft}
              onApprove={handleApprove}
              onReject={handleReject}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onBulkApprove={handleBulkApprove}
              onBulkReject={handleBulkReject}
              onBulkArchive={handleBulkArchive}
              onBulkDelete={handleBulkDelete}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail sheet (slides in from right) */}
      <DraftDetailSheet
        draft={agent.activeDraft}
        open={selectedDraftId !== null}
        onOpenChange={handleSheetClose}
        onCorrect={handleCorrect}
        onApprove={handleApprove}
        onReject={handleReject}
        onReExtract={handleReExtract}
        loading={agent.loading}
        sellerProfile={agent.sellerProfile}
        onSearchSeller={agent.searchSellers}
        onLinkSeller={agent.linkSellerToDraft}
        onAddFiles={agent.addFilesToDraft}
        onRemoveFile={agent.removeFileFromDraft}
        onDownloadFile={agent.downloadDraftFile}
        sellerHistory={agent.sellerHistory}
        onFetchSellerHistory={agent.fetchSellerHistory}
        onClassify={agent.classifyItems}
      />
    </PageContainer>
  );
}
