"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

import type { AddressValidationResult, AddressInput } from "@/types/address";
import type { ValidationMode } from "@/hooks/use-address-validation";
import { formatAddress } from "./helpers";
import {
  DPVAnalysisSection,
  MetadataSection,
  FootnotesSection,
} from "./dpv-analysis";

/* ------------------------------------------------------------------ */
/*  Timing Bar                                                         */
/* ------------------------------------------------------------------ */

export function TimingBar({ timings }: { timings: NonNullable<AddressValidationResult["timings"]> }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">API Response:</span>
        <span className="font-mono font-semibold">{timings.total_ms}ms</span>
      </div>
      {timings.claude_ms != null && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-info" />
          Claude {timings.claude_ms}ms
        </div>
      )}
      {timings.smarty_ms != null && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success" />
          Smarty {timings.smarty_ms}ms
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Address Step                                                       */
/* ------------------------------------------------------------------ */

export function AddressStep({
  label,
  address,
  color,
  highlight,
}: {
  label: string;
  address?: AddressInput;
  color?: string;
  highlight?: boolean;
}) {
  if (!address) return null;
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-primary/30 bg-primary/5" : ""}`}>
      <p className={`mb-1 text-[11px] font-semibold uppercase tracking-wider ${color || "text-muted-foreground"}`}>
        {label}
      </p>
      <p className={`text-sm ${highlight ? "font-medium" : ""}`}>
        {formatAddress(address)}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single Result                                                      */
/* ------------------------------------------------------------------ */

export function SingleResult({
  result,
  mode,
}: {
  result: AddressValidationResult;
  mode: ValidationMode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Status + timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              {result.is_valid ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              Validation Result
            </span>
            <StatusBadge status={result.is_valid ? "Valid" : "Invalid"} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timing */}
          {result.timings && <TimingBar timings={result.timings} />}

          {/* Address progression */}
          <div className="space-y-3">
            <AddressStep label="Entered" address={result.input_address} />
            {mode === "claude_smarty" && result.normalized_address && (
              <AddressStep label="Normalized (Claude)" address={result.normalized_address} color="text-info" />
            )}
            {result.validated_address && (
              <AddressStep label="Validated (Smarty)" address={result.validated_address} color="text-success" highlight />
            )}
          </div>
        </CardContent>
      </Card>

      {/* DPV Analysis */}
      {result.dpv_analysis && <DPVAnalysisSection dpv={result.dpv_analysis} />}

      {/* Metadata */}
      {result.metadata && <MetadataSection metadata={result.metadata} />}

      {/* Footnotes */}
      {result.footnotes && result.footnotes.length > 0 && <FootnotesSection footnotes={result.footnotes} />}
    </motion.div>
  );
}
