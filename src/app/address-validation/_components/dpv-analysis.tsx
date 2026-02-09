"use client";

import { Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { AddressValidationResult } from "@/types/address";
import {
  dpvMatchLabels,
  dpvBoolLabel,
  dpvFootnoteDescriptions,
  smartyFootnoteDescriptions,
} from "./helpers";

/* ------------------------------------------------------------------ */
/*  DPV Footnote Badges                                                */
/* ------------------------------------------------------------------ */

export function DPVFootnoteBadges({ footnotes }: { footnotes: string }) {
  if (!footnotes) return null;
  const codes: string[] = [];
  for (let i = 0; i < footnotes.length; i += 2) {
    codes.push(footnotes.substring(i, i + 2));
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {codes.map((code) => {
        const info = dpvFootnoteDescriptions[code];
        const colorClass = info
          ? info.category === "success"
            ? "bg-success-muted text-success-foreground border-success/20"
            : info.category === "warning"
              ? "bg-warning-muted text-warning-foreground border-warning/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          : "bg-muted text-muted-foreground";
        return (
          <span
            key={code}
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${colorClass}`}
            title={info?.meaning || code}
          >
            {code}
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DPV Item                                                           */
/* ------------------------------------------------------------------ */

export function DPVItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DPV Analysis Section                                               */
/* ------------------------------------------------------------------ */

export function DPVAnalysisSection({ dpv }: { dpv: NonNullable<AddressValidationResult["dpv_analysis"]> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">DPV Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <DPVItem
            label="Match Code"
            value={
              <Badge
                variant="secondary"
                className={`border-0 font-medium ${
                  dpvMatchLabels[dpv.dpv_match_code]?.color || "bg-muted text-muted-foreground"
                }`}
              >
                {dpv.dpv_match_code} - {dpvMatchLabels[dpv.dpv_match_code]?.label || "Unknown"}
              </Badge>
            }
          />
          <DPVItem label="CMRA" value={<span className={dpvBoolLabel(dpv.dpv_cmra).className}>{dpvBoolLabel(dpv.dpv_cmra).text}</span>} />
          <DPVItem label="Vacant" value={<span className={dpvBoolLabel(dpv.dpv_vacant).className}>{dpvBoolLabel(dpv.dpv_vacant).text}</span>} />
          <DPVItem label="Active" value={<span className={dpvBoolLabel(dpv.active).className}>{dpvBoolLabel(dpv.active).text}</span>} />
          <DPVItem label="No Stat" value={<span className={dpvBoolLabel(dpv.dpv_no_stat).className}>{dpvBoolLabel(dpv.dpv_no_stat).text}</span>} />
          {dpv.enhanced_match && (
            <DPVItem label="Match Type" value={<span className="text-sm capitalize">{dpv.enhanced_match.replace("-", " ")}</span>} />
          )}
        </div>

        {/* DPV Footnotes with descriptions */}
        {dpv.dpv_footnotes && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Info className="h-3 w-3" />
              DPV Footnotes
            </p>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const codes: string[] = [];
                for (let i = 0; i < dpv.dpv_footnotes.length; i += 2) {
                  codes.push(dpv.dpv_footnotes.substring(i, i + 2));
                }
                return codes.map((code) => {
                  const info = dpvFootnoteDescriptions[code];
                  const colorClass = info
                    ? info.category === "success"
                      ? "bg-success-muted text-success-foreground border-success/20"
                      : info.category === "warning"
                        ? "bg-warning-muted text-warning-foreground border-warning/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-muted text-muted-foreground";
                  return (
                    <div key={code} className={`rounded-md border px-2.5 py-1.5 text-xs ${colorClass}`} title={info?.meaning || code}>
                      <span className="font-mono font-semibold">{code}</span>
                      {info && <span className="ml-1.5">{info.meaning}</span>}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Metadata Section                                                   */
/* ------------------------------------------------------------------ */

export function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export function MetadataSection({ metadata }: { metadata: NonNullable<AddressValidationResult["metadata"]> }) {
  const items: { label: string; value: string }[] = [];
  if (metadata.county_name) items.push({ label: "County", value: metadata.county_name });
  if (metadata.record_type) items.push({ label: "Record Type", value: metadata.record_type });
  if (metadata.zip_type) items.push({ label: "ZIP Type", value: metadata.zip_type });
  if (metadata.carrier_route) items.push({ label: "Carrier Route", value: metadata.carrier_route });
  if (metadata.rdi) items.push({ label: "RDI", value: metadata.rdi });
  if (metadata.congressional_district) items.push({ label: "Congressional District", value: metadata.congressional_district });
  if (metadata.time_zone) items.push({ label: "Time Zone", value: metadata.time_zone });
  if (metadata.precision) items.push({ label: "Precision", value: metadata.precision });
  if (metadata.latitude != null && metadata.longitude != null) {
    items.push({ label: "Lat / Lng", value: `${metadata.latitude.toFixed(5)}, ${metadata.longitude.toFixed(5)}` });
  }
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <MetaItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Footnotes Section                                                  */
/* ------------------------------------------------------------------ */

export function FootnotesSection({ footnotes }: { footnotes: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Analysis Footnotes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {footnotes.map((fn, i) => {
            const desc = smartyFootnoteDescriptions[fn];
            return (
              <div key={i} className="flex items-baseline gap-2 text-sm">
                <span className="font-mono font-semibold text-muted-foreground">{fn}</span>
                <span className="text-muted-foreground">{desc || "Unknown footnote code"}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
