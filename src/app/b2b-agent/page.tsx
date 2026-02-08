"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { useB2BAgent, type DraftTab } from "@/hooks/use-b2b-agent";
import { Toolbar } from "./_components/toolbar";
import { ProcessingBar } from "./_components/processing-bar";
import { DraftList } from "./_components/draft-list";
import { DraftDetailSheet } from "./_components/draft-detail-sheet";

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

  // Filter label for empty state
  const filterLabel = useMemo(() => {
    if (search.trim()) return "matching";
    if (agent.activeTab === "all") return "";
    return agent.activeTab.replace("_", " ");
  }, [agent.activeTab, search]);

  const handleUpload = useCallback(
    (files: File[]) => {
      agent.upload(files);
    },
    [agent],
  );

  const handleTabChange = useCallback(
    (tab: DraftTab) => {
      agent.switchTab(tab);
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

      {/* Toolbar: Upload + Filter + Search */}
      <Toolbar
        activeTab={agent.activeTab}
        onTabChange={handleTabChange}
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

      {/* Draft list */}
      <DraftList
        drafts={filteredDrafts}
        total={filteredDrafts.length}
        loading={agent.loading}
        selectedId={selectedDraftId}
        onSelect={handleSelectDraft}
        filterLabel={filterLabel}
      />

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
