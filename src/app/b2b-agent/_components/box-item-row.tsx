"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Trash2, ChevronRight, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { currencySymbol } from "./editable-fields";
import type { ShipmentBox, ShipmentBoxItem, ShipmentAddress, ProductDetail } from "@/types/agent";

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
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
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

/* ── Inline field (underline-style for secondary row) ─────── */

function InlineField({ label, value, onChange, width, mono, suffix, type }: {
  label: string;
  value: string | number | null | undefined;
  onChange: (v: string | number | null) => void;
  width: string;
  mono?: boolean;
  suffix?: string;
  type?: "number";
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="whitespace-nowrap text-[10px] text-muted-foreground">{label}</span>
      <input
        type={type || "text"}
        value={value ?? ""}
        onChange={(e) => {
          if (type === "number") {
            onChange(e.target.value ? Number(e.target.value) : null);
          } else {
            onChange(e.target.value);
          }
        }}
        className={`${width} h-5 bg-transparent border-b border-dashed border-border/60 px-0.5 text-[11px] transition-colors focus:outline-none focus:border-foreground ${mono ? "font-mono" : ""} ${type === "number" ? "text-right tabular-nums" : ""}`}
      />
      {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
    </div>
  );
}

/* ── Items list (card-based layout) ───────────────────────── */

export function ItemsTable({ items, onChange, onAdd, products, currency }: {
  items: ShipmentBoxItem[];
  onChange: (items: ShipmentBoxItem[]) => void;
  onAdd: () => void;
  products?: ProductDetail[];
  currency?: string;
}) {
  const [showMore, setShowMore] = useState(false);
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
        country_of_origin: product.country_of_origin || "IN",
        // Direct replacement — always apply product values
        unit_price: product.unit_price ?? null,
        duty_rate: product.duty_rate ?? null,
        igst_amount: product.igst_percent ?? null,
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
    <div className="rounded-lg border border-blue-200/50 bg-blue-50/30 p-2.5 dark:border-blue-900/30 dark:bg-blue-950/20">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Items
        </span>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-muted-foreground"
          onClick={() => setShowMore((v) => !v)}>
          <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : ""}`} />
          {showMore ? "Hide details" : "Show details"}
        </Button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed bg-background py-6 text-center text-xs text-muted-foreground">
          No items — click below to add one.
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => {
            const total = (item.quantity || 0) * (item.unit_price || 0);
            return (
              <div key={i} className="group rounded-md border border-border/60 bg-background px-2.5 py-1.5">
                {/* Line 1: Description */}
                <div className="flex items-center gap-1.5">
                  <span className="w-4 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <Input
                    value={item.description}
                    className="h-7 min-w-0 flex-1 text-[13px] font-medium"
                    placeholder="Item description"
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                  />
                  {hasProducts && (
                    <ProductCombobox
                      options={productOptions}
                      onSelect={(pi) => handleProductSelect(i, pi)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Line 2: Qty × Price = Total + HSN + Secondary fields */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[18px]">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Qty</span>
                    <Input
                      type="number"
                      value={item.quantity}
                      className="h-6 w-14 text-center text-xs tabular-nums"
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value) || 0)}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">&times;</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Price</span>
                    <Input
                      type="number"
                      value={item.unit_price ?? ""}
                      className="h-6 w-20 text-right text-xs tabular-nums"
                      onChange={(e) => updateItem(i, "unit_price", e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">=</span>
                  <span className="min-w-[48px] text-xs font-medium tabular-nums">
                    {total > 0
                      ? `${sym}${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">HSN</span>
                    <Input
                      value={item.ehsn}
                      className="h-6 w-20 font-mono text-xs"
                      placeholder="8-digit"
                      onChange={(e) => updateItem(i, "ehsn", e.target.value)}
                    />
                  </div>
                  {showMore && (
                    <>
                      <div className="mx-0.5 h-4 w-px bg-border/40" />
                      <InlineField label="iHSN" value={item.ihsn} mono width="w-20"
                        onChange={(v) => updateItem(i, "ihsn", v)} />
                      <InlineField label="Wt" value={item.weight} type="number" width="w-14" suffix="kg"
                        onChange={(v) => updateItem(i, "weight", v)} />
                      <InlineField label="Origin" value={item.country_of_origin} width="w-12"
                        onChange={(v) => updateItem(i, "country_of_origin", v)} />
                      <InlineField label="IGST" value={item.igst_amount} type="number" width="w-12" suffix="%"
                        onChange={(v) => updateItem(i, "igst_amount", v)} />
                      <InlineField label="Duty" value={item.duty_rate} type="number" width="w-12" suffix="%"
                        onChange={(v) => updateItem(i, "duty_rate", v)} />
                    </>
                  )}
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
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed bg-background py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </div>
  );
}
