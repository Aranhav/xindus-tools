"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Trash2, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { currencySymbol } from "./editable-fields";
import type { ShipmentBox, ShipmentBoxItem, ShipmentAddress, ProductDetail, TariffScenario } from "@/types/agent";

/* ── Empty factories ──────────────────────────────────────── */

export function emptyAddress(): ShipmentAddress {
  return {
    name: "", email: "", phone: "", address: "", city: "", zip: "",
    district: "", state: "", country: "", extension_number: "",
    eori_number: "", contact_name: "", contact_phone: "",
    warehouse_id: null, type: null,
  };
}

export function emptyItem(): ShipmentBoxItem {
  return {
    description: "", quantity: 1, weight: null, unit_price: null,
    total_price: null, ehsn: "", ihsn: "", country_of_origin: "IN",
    category: "", market_place: "", igst_amount: null, duty_rate: null,
    vat_rate: null, unit_fob_value: null, fob_value: null,
    listing_price: null, cogs_value: null, insurance: null, remarks: "",
  };
}

export function emptyBox(index: number, inheritReceiver?: ShipmentAddress): ShipmentBox {
  return {
    box_id: String(index + 1),
    weight: 0, width: 0, length: 0, height: 0,
    uom: "cm", has_battery: false, remarks: "",
    receiver_address: inheritReceiver ? { ...inheritReceiver } : emptyAddress(),
    shipment_box_items: [emptyItem()],
  };
}

/* ── Duty breakdown tooltip ─────────────────────────────── */

function DutyBreakdownTooltip({
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

/* ── Gaia confidence badge (color-coded: HIGH/MEDIUM/LOW) ── */

function GaiaConfidence({ confidence }: { confidence?: string }) {
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

/* ── Product combobox (searchable, scrollable) ────────────── */

function ProductCombobox({ options, onSelect }: {
  options: ProductDetail[];
  onSelect: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Pick from product list"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end" side="bottom" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Search products..." className="h-8 text-xs" />
          <CommandList className="max-h-[240px]">
            <CommandEmpty className="py-4 text-xs">No products found.</CommandEmpty>
            <CommandGroup>
              {options.map((p, i) => (
                <CommandItem
                  key={i}
                  value={`${p.product_description} ${p.hsn_code}`}
                  className="text-xs gap-2"
                  onSelect={() => { onSelect(i); setOpen(false); }}
                >
                  <span className="min-w-0 flex-1 truncate">{p.product_description}</span>
                  {p.hsn_code && (
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {p.hsn_code}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ── Items list (grid-based layout) ───────────────────────── */

export function ItemsTable({ items, onChange, onAdd, products, currency }: {
  items: ShipmentBoxItem[];
  onChange: (items: ShipmentBoxItem[]) => void;
  onAdd: () => void;
  products?: ProductDetail[];
  currency?: string;
}) {
  const sym = currencySymbol(currency);
  const hasProducts = (products?.length ?? 0) > 0;

  const productOptions = useMemo(() => {
    if (!products?.length) return [];
    const seen = new Set<string>();
    return products.filter((p) => {
      const key = `${p.product_description.toLowerCase()}|${p.hsn_code}`;
      if (seen.has(key) || !p.product_description) return false;
      seen.add(key);
      return true;
    });
  }, [products]);

  const updateItem = useCallback(
    (idx: number, field: keyof ShipmentBoxItem, value: unknown) => {
      const next = [...items];
      next[idx] = { ...next[idx], [field]: value };
      onChange(next);
    },
    [items, onChange],
  );

  const handleProductSelect = useCallback(
    (rowIdx: number, pIdx: number) => {
      const product = productOptions[pIdx];
      if (!product) return;
      const next = [...items];
      next[rowIdx] = {
        ...items[rowIdx],
        description: product.product_description,
        ehsn: product.hsn_code,
        ihsn: product.ihsn || "",
        country_of_origin: product.country_of_origin || "IN",
        unit_price: product.unit_price ?? null,
        duty_rate: product.duty_rate ?? null,
        igst_amount: product.igst_percent ?? null,
        gaia_classified: product.gaia_classified || false,
        gaia_description: product.gaia_description || "",
        hsn_confidence: product.hsn_confidence || "",
        base_duty_rate: product.base_duty_rate ?? null,
        tariff_scenarios: product.tariff_scenarios || [],
      };
      onChange(next);
    },
    [items, onChange, productOptions],
  );

  const removeItem = useCallback(
    (idx: number) => onChange(items.filter((_, i) => i !== idx)),
    [items, onChange],
  );

  return (
    <div className="rounded-lg border border-blue-200/50 bg-blue-50/30 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
      {/* Header */}
      <div className="pb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Items
        </span>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed bg-background py-6 text-center text-sm text-muted-foreground">
          No items — click below to add one.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const total = (item.quantity || 0) * (item.unit_price || 0);
            return (
              <div key={i} className="group overflow-hidden rounded-lg border border-border/60 bg-background">
                {/* Row 1: Description + Product picker + Qty × Price = Total + delete */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <Input
                    value={item.description}
                    className="h-8 min-w-0 flex-1 text-sm font-medium"
                    placeholder="Item description *"
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                  />
                  {hasProducts && (
                    <ProductCombobox
                      options={productOptions}
                      onSelect={(pi) => handleProductSelect(i, pi)}
                    />
                  )}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">Qty<span className="text-red-500"> *</span></span>
                    <Input
                      type="number"
                      value={item.quantity}
                      className="h-7 w-16 text-center text-xs tabular-nums"
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value) || 0)}
                    />
                    <span className="text-xs text-muted-foreground">&times;</span>
                    <span className="text-[11px] text-muted-foreground">Price<span className="text-red-500"> *</span></span>
                    <Input
                      type="number"
                      value={item.unit_price ?? ""}
                      className="h-7 w-20 text-right text-xs tabular-nums"
                      placeholder="0.00"
                      onChange={(e) => updateItem(i, "unit_price", e.target.value ? Number(e.target.value) : null)}
                    />
                    <span className="text-xs text-muted-foreground">=</span>
                    <span className="min-w-[60px] text-right text-xs font-semibold tabular-nums">
                      {total > 0
                        ? `${sym}${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : "—"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Row 2: Customs & classification grid (always visible) */}
                <div className="grid grid-cols-6 gap-x-3 border-t border-border/40 bg-muted/30 px-3 py-2 pl-10">
                  <div>
                    <span className="mb-0.5 block text-[11px] text-muted-foreground">Export HSN<span className="text-red-500"> *</span></span>
                    <Input
                      value={item.ehsn}
                      className="h-7 font-mono text-xs"
                      placeholder="8-digit"
                      onChange={(e) => updateItem(i, "ehsn", e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      Import HSN
                      {item.gaia_classified && item.ihsn && (
                        <GaiaConfidence confidence={item.hsn_confidence} />
                      )}
                    </span>
                    <Input
                      value={item.ihsn ?? ""}
                      className={`h-7 font-mono text-xs ${item.gaia_classified && item.ihsn ? "border-emerald-200 dark:border-emerald-900" : ""}`}
                      placeholder="10-digit"
                      onChange={(e) => updateItem(i, "ihsn", e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[11px] text-muted-foreground">Weight</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={item.weight ?? ""}
                        className="h-7 min-w-0 flex-1 text-xs tabular-nums"
                        placeholder="0.00"
                        onChange={(e) => updateItem(i, "weight", e.target.value ? Number(e.target.value) : null)}
                      />
                      <span className="shrink-0 text-[11px] text-muted-foreground">kg</span>
                    </div>
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[11px] text-muted-foreground">Origin</span>
                    <Input
                      value={item.country_of_origin ?? ""}
                      className="h-7 text-xs uppercase"
                      placeholder="IN"
                      maxLength={2}
                      onChange={(e) => updateItem(i, "country_of_origin", e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="mb-0.5 block text-[11px] text-muted-foreground">IGST %</span>
                    <Input
                      type="number"
                      value={item.igst_amount ?? ""}
                      className="h-7 text-xs tabular-nums"
                      placeholder="0"
                      onChange={(e) => updateItem(i, "igst_amount", e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <DutyBreakdownTooltip baseDuty={item.base_duty_rate} scenarios={item.tariff_scenarios}>
                    <div>
                      <span className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        Duty %
                        {item.gaia_classified && item.duty_rate != null && (
                          <GaiaConfidence confidence={item.hsn_confidence} />
                        )}
                      </span>
                      <Input
                        type="number"
                        value={item.duty_rate ?? ""}
                        className={`h-7 text-xs tabular-nums ${item.gaia_classified && item.duty_rate != null ? "border-emerald-200 dark:border-emerald-900" : ""}`}
                        placeholder="0"
                        onChange={(e) => updateItem(i, "duty_rate", e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                  </DutyBreakdownTooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={onAdd}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed bg-background py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </div>
  );
}
