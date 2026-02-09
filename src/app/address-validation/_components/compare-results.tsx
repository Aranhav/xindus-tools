"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Info, Bot, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusAlert } from "@/components/status-alert";

import type { AddressValidationResult } from "@/types/address";
import { dpvMatchLabels, formatAddress } from "./helpers";
import {
  DPVFootnoteBadges,
  DPVAnalysisSection,
  MetadataSection,
  FootnotesSection,
} from "./dpv-analysis";

/* ------------------------------------------------------------------ */
/*  Summary Card                                                       */
/* ------------------------------------------------------------------ */

export function SummaryCard({
  title,
  icon,
  result,
  showBreakdown,
}: {
  title: string;
  icon: React.ReactNode;
  result: AddressValidationResult;
  showBreakdown?: boolean;
}) {
  const dpvCode = result.dpv_analysis?.dpv_match_code;
  const dpvInfo = dpvCode ? dpvMatchLabels[dpvCode] : null;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </div>

        {/* Timing */}
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold">
            {result.timings?.total_ms ?? "--"}
          </span>
          <span className="text-sm text-muted-foreground">ms</span>
        </div>

        {showBreakdown && result.timings && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            {result.timings.claude_ms != null && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-info" />
                Claude {result.timings.claude_ms}ms
              </span>
            )}
            {result.timings.smarty_ms != null && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success" />
                Smarty {result.timings.smarty_ms}ms
              </span>
            )}
          </div>
        )}

        {!showBreakdown && (
          <p className="text-xs text-muted-foreground">Direct API call</p>
        )}

        {/* DPV status */}
        {dpvInfo && (
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                dpvCode === "Y" ? "bg-success" : dpvCode === "N" ? "bg-destructive" : "bg-warning"
              }`}
            />
            <span className="text-sm font-medium">{dpvInfo.label}</span>
            <span className="text-xs text-muted-foreground">({dpvCode})</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Compare Results                                                    */
/* ------------------------------------------------------------------ */

export function CompareResults({
  result,
}: {
  result: { claudeSmarty: AddressValidationResult; smartyOnly: AddressValidationResult; addressesMatch: boolean };
}) {
  const cs = result.claudeSmarty;
  const so = result.smartyOnly;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Quick summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard
          title="Claude + Smarty"
          icon={<Bot className="h-4 w-4" />}
          result={cs}
          showBreakdown
        />
        <SummaryCard
          title="Smarty Only"
          icon={<Zap className="h-4 w-4" />}
          result={so}
        />
      </div>

      {/* Match indicator */}
      <StatusAlert
        variant={result.addressesMatch ? "success" : "warning"}
        icon={result.addressesMatch ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
        title={result.addressesMatch
          ? "Both workflows returned the same validated address"
          : "Workflows returned different validated addresses"}
      />

      {/* Side-by-side address comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input address */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Entered
            </p>
            <p className="text-sm">
              {formatAddress(cs.input_address)}
            </p>
          </div>

          {/* Side-by-side */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Bot className="h-3.5 w-3.5" />
                Claude + Smarty
              </p>
              {cs.normalized_address && (
                <div>
                  <p className="text-[11px] font-medium text-info">Normalized (Claude)</p>
                  <p className="text-sm">{formatAddress(cs.normalized_address)}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-medium text-success">Validated (Smarty)</p>
                <p className="text-sm font-medium">
                  {cs.delivery_line ? `${cs.delivery_line}, ${cs.last_line || ""}` : formatAddress(cs.validated_address)}
                </p>
              </div>
              {cs.dpv_analysis && <DPVFootnoteBadges footnotes={cs.dpv_analysis.dpv_footnotes} />}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                Smarty Only
              </p>
              <div>
                <p className="text-[11px] font-medium text-success">Validated (Smarty)</p>
                <p className="text-sm font-medium">
                  {so.delivery_line ? `${so.delivery_line}, ${so.last_line || ""}` : formatAddress(so.validated_address)}
                </p>
              </div>
              {so.dpv_analysis && <DPVFootnoteBadges footnotes={so.dpv_analysis.dpv_footnotes} />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DPV Analysis (from Claude+Smarty result) */}
      {cs.dpv_analysis && <DPVAnalysisSection dpv={cs.dpv_analysis} />}

      {/* Metadata */}
      {cs.metadata && <MetadataSection metadata={cs.metadata} />}

      {/* Footnotes */}
      {cs.footnotes && cs.footnotes.length > 0 && <FootnotesSection footnotes={cs.footnotes} />}
    </motion.div>
  );
}
