"use client";

import { useState, useCallback } from "react";
import {
  ChevronRight, Pencil, Check, X, Trash2, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductDetail, TariffScenario } from "@/types/agent";

/* ── Gaia confidence dot (compact, for summary row) ──── */

function GaiaDot({ confidence }: { confidence?: string }) {
  const color = confidence === "HIGH"
    ? "bg-emerald-500"
    : confidence === "MEDIUM"
      ? "bg-amber-500"
      : confidence === "LOW"
        ? "bg-red-400"
        : "bg-emerald-500";
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Gaia · {confidence ? `${confidence[0]}${confidence.slice(1).toLowerCase()}` : "Classified"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ── Gaia badge (full, for detail panel) ─────────────── */

export function GaiaBadge({ confidence }: { confidence?: string }) {
  const colors = confidence === "HIGH"
    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500/80"
    : confidence === "MEDIUM"
      ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-500/80"
      : confidence === "LOW"
        ? "bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400/80"
        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500/80";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${colors}`}>
      Gaia · {confidence ? `${confidence[0]}${confidence.slice(1).toLowerCase()}` : "Classified"}
    </span>
  );
}

/* ── Duty breakdown tooltip ──────────────────────────── */

export function DutyBreakdownTooltip({
  baseDuty,
  scenarios,
  children,
}: {
  baseDuty?: number | null;
  scenarios?: TariffScenario[];
  children: React.ReactNode;
}) {
  const active = (scenarios ?? []).filter(
    (s) => s.is_additional && s.value > 0 && s.is_approved !== false,
  );
  if (baseDuty == null || active.length === 0) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Base MFN rate</span>
              <span className="font-mono">{baseDuty}%</span>
            </div>
            {active.map((s, i) => (
              <div key={i} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{s.title}</span>
                <span className="font-mono">+{s.value}%</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t pt-1 font-semibold">
              <span>Total duty</span>
              <span className="font-mono">
                {(baseDuty + active.reduce((sum, s) => sum + s.value, 0)).toFixed(1)}%
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ── Detail field (label + value pair) ───────────────── */

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-xs">{children}</div>
    </div>
  );
}

/* ── Product row with expandable detail ──────────────── */

interface ProductRowProps {
  product: ProductDetail;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onSave: (index: number, updated: ProductDetail, original: ProductDetail) => void;
  onRemove: (index: number) => void;
  onRecalculate: (index: number) => void;
  recalculating: boolean;
}

export function ProductRow({
  product,
  index,
  expanded,
  onToggle,
  onSave,
  onRemove,
  onRecalculate,
  recalculating,
}: ProductRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProductDetail>(product);

  const isGaia = product.gaia_classified;
  const hasIhsn = !!(product.ihsn ?? "").trim();

  const startEdit = useCallback(() => {
    setDraft(product);
    setEditing(true);
  }, [product]);

  const cancelEdit = useCallback(() => setEditing(false), []);

  const saveEdit = useCallback(() => {
    setEditing(false);
    onSave(index, draft, product);
  }, [index, draft, product, onSave]);

  const set = (field: keyof ProductDetail, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Summary row (always visible) ──────────────────── */
  const summaryRow = (
    <tr
      className="group cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/10"
      onClick={() => { if (!editing) onToggle(); }}
    >
      {/* Chevron */}
      <td className="w-7 py-2.5 pl-3 pr-0">
        <ChevronRight
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
        />
      </td>

      {/* Description */}
      <td className="max-w-[220px] truncate py-2.5 pr-3 text-xs">
        {product.product_description || (
          <span className="italic text-muted-foreground">No description</span>
        )}
      </td>

      {/* HSN Codes (combined) */}
      <td className="py-2.5 pr-3 font-mono text-xs">
        <span className="text-muted-foreground">{product.hsn_code || "—"}</span>
        {product.ihsn && (
          <>
            <span className="mx-1 text-muted-foreground/50">/</span>
            <span className={isGaia ? "text-emerald-600 dark:text-emerald-400" : ""}>
              {product.ihsn}
            </span>
            {isGaia && (
              <span className="ml-1 inline-flex items-center">
                <GaiaDot confidence={product.hsn_confidence} />
              </span>
            )}
          </>
        )}
      </td>

      {/* Duty % */}
      <td className="py-2.5 pr-3 text-right text-xs tabular-nums">
        <DutyBreakdownTooltip baseDuty={product.base_duty_rate} scenarios={product.tariff_scenarios}>
          <span className={isGaia && product.duty_rate != null ? "text-emerald-600 dark:text-emerald-400" : ""}>
            {product.duty_rate != null ? `${product.duty_rate}%` : "—"}
          </span>
        </DutyBreakdownTooltip>
      </td>
    </tr>
  );

  /* ── Detail panel (expanded) ───────────────────────── */
  const detailRow = expanded ? (
    <tr className="border-b border-border/40">
      <td colSpan={4} className="bg-muted/5 px-4 pb-4 pt-3">
        {editing ? (
          /* ── Edit mode ─────────────────────────────── */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                <Input
                  value={draft.product_description}
                  onChange={(e) => set("product_description", e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Export HSN
                </label>
                <Input
                  value={draft.hsn_code}
                  onChange={(e) => set("hsn_code", e.target.value)}
                  className="h-8 font-mono text-xs"
                  placeholder="8-digit"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Import HSN
                </label>
                <Input
                  value={draft.ihsn ?? ""}
                  onChange={(e) => set("ihsn", e.target.value)}
                  className="h-8 font-mono text-xs"
                  placeholder="10-digit"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Value
                </label>
                <Input
                  type="number"
                  value={draft.value ?? ""}
                  onChange={(e) => set("value", Number(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Unit Price
                </label>
                <Input
                  type="number"
                  value={draft.unit_price ?? ""}
                  onChange={(e) => set("unit_price", e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Origin
                </label>
                <Input
                  value={draft.country_of_origin ?? ""}
                  onChange={(e) => set("country_of_origin", e.target.value)}
                  className="h-8 text-xs"
                  placeholder="IN"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Duty %
                </label>
                <Input
                  type="number"
                  value={draft.duty_rate ?? ""}
                  onChange={(e) => set("duty_rate", e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  IGST %
                </label>
                <Input
                  type="number"
                  value={draft.igst_percent ?? ""}
                  onChange={(e) => set("igst_percent", e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelEdit}>
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={saveEdit}>
                <Check className="mr-1 h-3 w-3" /> Save
              </Button>
            </div>
          </div>
        ) : (
          /* ── Readonly detail ───────────────────────── */
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
              <Field label="Export HSN">
                <span className="font-mono">{product.hsn_code || "—"}</span>
              </Field>
              <Field label="Import HSN">
                <div className="flex items-center gap-1.5">
                  <span className={`font-mono ${isGaia && product.ihsn ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                    {product.ihsn || "—"}
                  </span>
                  {isGaia && product.ihsn && <GaiaBadge confidence={product.hsn_confidence} />}
                </div>
                {hasIhsn && (
                  <button
                    type="button"
                    disabled={recalculating}
                    onClick={() => onRecalculate(index)}
                    className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                  >
                    <RotateCcw className={`h-2.5 w-2.5 ${recalculating ? "animate-spin" : ""}`} />
                    {recalculating ? "Looking up..." : "Recalculate duty"}
                  </button>
                )}
              </Field>
              <Field label="Origin">
                {product.country_of_origin || "—"}
              </Field>
              <Field label="Value">
                <span className="tabular-nums">{product.value ?? "—"}</span>
              </Field>
              <Field label="Unit Price">
                <span className="tabular-nums">{product.unit_price ?? "—"}</span>
              </Field>
              <Field label="IGST %">
                <span className="tabular-nums">
                  {product.igst_percent != null ? `${product.igst_percent}%` : "—"}
                </span>
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-border/30 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={startEdit}
              >
                <Pencil className="h-3 w-3" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="h-3 w-3" /> Remove
              </Button>
            </div>
          </div>
        )}
      </td>
    </tr>
  ) : null;

  return (
    <>
      {summaryRow}
      {detailRow}
    </>
  );
}
