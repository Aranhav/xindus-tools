"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessingBarProps {
  progress: { completed: number; total: number; file?: string; shipments_found?: number } | null;
  label: string;
}

export function ProcessingBar({ progress, label }: ProcessingBarProps) {
  const pct = progress && progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4 overflow-hidden"
    >
      <div className="flex items-center gap-3 rounded-md border border-primary/15 bg-primary/5 px-3 py-2">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
        <span className="shrink-0 text-sm font-medium">{label || "Processing..."}</span>
        {progress && progress.total > 0 && (
          <>
            <Progress value={pct} className="h-1.5 flex-1" />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {progress.completed}/{progress.total}
              {progress.shipments_found != null && ` \u00b7 ${progress.shipments_found} found`}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
