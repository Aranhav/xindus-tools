"use client";

import { useState, useCallback } from "react";
import { Pencil, Check, X, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductDetail, TariffScenario } from "@/types/agent";

/* ── Gaia badge (reusable) ───────────────────────────────── */

export function GaiaBadge({ confidence }: { confidence?: string }) {
  const colors = confidence === "HIGH"
    ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-500/80"
    : confidence === "MEDIUM"
      ? "bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-500/80"
      : confidence === "LOW"
        ? "bg-red-50 text-red-400 dark:bg-red-950/20 dark:text-red-400/80"
        : "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-500/80";
  return (
    <span className={`rounded px-1 py-px text-[9px] font-medium leading-none ${colors}`}>
      Gaia{confidence ? ` · ${confidence[0]}${confidence.slice(1).toLowerCase()}` : ""}
    </span>
  );
}

/* ── Duty breakdown tooltip ─────────────────────────────── */

export function DutyBreakdownTooltip({
  baseDuty,
  scenarios,
  children,
}: {
  baseDuty?: number | null;
  scenarios?: TariffScenario[];
  children: React.ReactNode;
}) {
  const active = (scenarios ?? []).filter((s) => s.is_additional && s.value > 0 && s.is_approved !== false);
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

/* ── Product row with edit/readonly mode ─────────────────── */

interface ProductRowProps {
  product: ProductDetail;
  index: number;
  onSave: (index: number, updated: ProductDetail, original: ProductDetail) => void;
  onRemove: (index: number) => void;
  onRecalculate: (index: number) => void;
  recalculating: boolean;
}

export function ProductRow({
  product,
  index,
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

  const cancelEdit = useCallback(() => {
    setEditing(false);
  }, []);

  const saveEdit = useCallback(() => {
    setEditing(false);
    onSave(index, draft, product);
  }, [index, draft, product, onSave]);

  const set = (field: keyof ProductDetail, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  if (editing) {
    return (
      <tr className="group border-b border-border/40 last:border-0 bg-muted/20">
        <td className="py-1.5 pr-2">
          <Input
            value={draft.product_description}
            onChange={(e) => set("product_description", e.target.value)}
            className="h-7 text-xs"
            placeholder="Product description"
            autoFocus
          />
        </td>
        <td className="py-1.5 pr-2">
          <Input
            value={draft.hsn_code}
            onChange={(e) => set("hsn_code", e.target.value)}
            className="h-7 font-mono text-xs"
            placeholder="8-digit"
          />
        </td>
        <td className="py-1.5 pr-2">
          <Input
            value={draft.ihsn ?? ""}
            onChange={(e) => set("ihsn", e.target.value)}
            className="h-7 font-mono text-xs"
            placeholder="10-digit"
          />
        </td>
        <td className="py-1.5 pr-2">
          <Input
            type="number"
            value={draft.value ?? ""}
            onChange={(e) => set("value", Number(e.target.value) || 0)}
            className="h-7 text-right text-xs"
            placeholder="0"
          />
        </td>
        <td className="py-1.5 pr-2">
          <Input
            value={draft.country_of_origin ?? ""}
            onChange={(e) => set("country_of_origin", e.target.value)}
            className="h-7 text-xs"
            placeholder="IN"
          />
        </td>
        <td className="py-1.5 pr-2">
          <Input
            type="number"
            value={draft.unit_price ?? ""}
            onChange={(e) => set("unit_price", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-right text-xs"
            placeholder="0"
          />
        </td>
        <td className="py-1.5 pr-2">
          <Input
            type="number"
            value={draft.duty_rate ?? ""}
            onChange={(e) => set("duty_rate", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-right text-xs"
            placeholder="%"
          />
        </td>
        <td className="py-1.5 pr-2">
          <Input
            type="number"
            value={draft.igst_percent ?? ""}
            onChange={(e) => set("igst_percent", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-right text-xs"
            placeholder="%"
          />
        </td>
        <td className="py-1.5 text-right">
          <div className="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-emerald-600"
              onClick={saveEdit}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              onClick={cancelEdit}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  // Readonly mode
  return (
    <tr className="group border-b border-border/40 last:border-0">
      <td className="px-3 py-1.5 pr-2 text-xs">{product.product_description || <span className="text-muted-foreground italic">—</span>}</td>
      <td className="px-3 py-1.5 pr-2 font-mono text-xs">{product.hsn_code || <span className="text-muted-foreground italic">—</span>}</td>
      <td className="px-3 py-1.5 pr-2">
        <div className="space-y-0.5">
          <span className={`font-mono text-xs ${isGaia && product.ihsn ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
            {product.ihsn || <span className="text-muted-foreground italic">—</span>}
          </span>
          <div className="flex items-center justify-between gap-1">
            {hasIhsn && (
              <button
                type="button"
                disabled={recalculating}
                onClick={() => onRecalculate(index)}
                className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
              >
                <RotateCcw className={`h-2.5 w-2.5 ${recalculating ? "animate-spin" : ""}`} />
                {recalculating ? "Looking up..." : "Recalculate duty"}
              </button>
            )}
            {isGaia && product.ihsn && (
              <GaiaBadge confidence={product.hsn_confidence} />
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-1.5 pr-2 text-right text-xs tabular-nums">{product.value ?? <span className="text-muted-foreground italic">—</span>}</td>
      <td className="px-3 py-1.5 pr-2 text-xs">{product.country_of_origin || <span className="text-muted-foreground italic">—</span>}</td>
      <td className="px-3 py-1.5 pr-2 text-right text-xs tabular-nums">{product.unit_price ?? <span className="text-muted-foreground italic">—</span>}</td>
      <td className="px-3 py-1.5 pr-2">
        <DutyBreakdownTooltip baseDuty={product.base_duty_rate} scenarios={product.tariff_scenarios}>
          <div className="space-y-0.5">
            <span className={`text-right text-xs tabular-nums ${isGaia && product.duty_rate != null ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
              {product.duty_rate != null ? `${product.duty_rate}%` : <span className="text-muted-foreground italic">—</span>}
            </span>
            {isGaia && product.duty_rate != null && (
              <div className="flex justify-end"><GaiaBadge confidence={product.hsn_confidence} /></div>
            )}
          </div>
        </DutyBreakdownTooltip>
      </td>
      <td className="px-3 py-1.5 pr-2 text-right text-xs tabular-nums">
        {product.igst_percent != null ? `${product.igst_percent}%` : <span className="text-muted-foreground italic">—</span>}
      </td>
      <td className="py-1.5 text-right">
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={startEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
