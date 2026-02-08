"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fadeIn, stagger } from "./helpers";
import { DraftRow } from "./draft-row";
import type { DraftSummary } from "@/types/agent";

interface DraftListProps {
  drafts: DraftSummary[];
  total: number;
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  filterLabel: string;
}

export function DraftList({
  drafts,
  total,
  loading,
  selectedId,
  onSelect,
  filterLabel,
}: DraftListProps) {
  return (
    <AnimatePresence mode="wait">
      {loading && drafts.length === 0 ? (
        <motion.div
          key="loading"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="py-12 text-center"
        >
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading drafts...</p>
        </motion.div>
      ) : drafts.length === 0 ? (
        <motion.div
          key="empty"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No {filterLabel} drafts found. Upload files to create new drafts.
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="list"
          variants={stagger}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-1.5"
        >
          <p className="mb-2 text-xs text-muted-foreground">
            {total} draft{total !== 1 ? "s" : ""}
          </p>
          {drafts.map((draft) => (
            <DraftRow
              key={draft.id}
              draft={draft}
              selected={draft.id === selectedId}
              onClick={() => onSelect(draft.id)}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
