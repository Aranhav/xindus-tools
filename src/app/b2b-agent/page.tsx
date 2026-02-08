"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { useB2BAgent, type DraftTab } from "@/hooks/use-b2b-agent";
import { Toolbar } from "./_components/toolbar";
import { ProcessingBar } from "./_components/processing-bar";
import { DraftTable } from "./_components/draft-table";
import { DraftDetailSheet } from "./_components/draft-detail-sheet";

const TAB_OPTIONS: { value: DraftTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function B2BAgentPage() {
  const agent = useB2BAgent();
  const [search, setSearch] = useState("");
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  // Load drafts + check for in-flight jobs on mount
  useEffect(() => {
    agent.fetchDrafts();
    agent.checkActiveJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side search filter
  const filteredDrafts = useMemo(() => {
    if (!search.trim()) return agent.drafts;
    const q = search.toLowerCase();
    return agent.drafts.filter(
      (d) =>
        d.invoice_number?.toLowerCase().includes(q) ||
        d.shipper_name?.toLowerCase().includes(q) ||
        d.receiver_name?.toLowerCase().includes(q),
    );
  }, [agent.drafts, search]);

  // Per-status counts (computed from all drafts in current tab's data)
  const statusCounts = useMemo(() => {
    const counts: Record<DraftTab, number> = {
      all: agent.draftsTotal,
      pending_review: 0,
      approved: 0,
      rejected: 0,
    };
    // If we're on "all" tab, count from the loaded drafts
    if (agent.activeTab === "all") {
      for (const d of agent.drafts) {
        if (d.status in counts) {
          counts[d.status as DraftTab]++;
        }
      }
    }
    return counts;
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
      agent.applyCorrections(draftId, corrections);
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
        onUpload={handleUpload}
        draftsTotal={filteredDrafts.length}
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
              {agent.activeTab === "all" && statusCounts[tab.value] > 0 && (
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
              onView={handleSelectDraft}
              onApprove={handleApprove}
              onReject={handleReject}
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
        loading={agent.loading}
        sellerProfile={agent.sellerProfile}
      />
    </PageContainer>
  );
}
