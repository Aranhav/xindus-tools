"use client";

import { Fragment, useState, useMemo, useCallback } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
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

/* ── Inline styles ────────────────────────────────────────── */

const cell = "border-0 bg-transparent h-7 text-xs p-1 focus:ring-1 focus:ring-ring rounded-sm";
const numCell = `${cell} text-right tabular-nums`;
const th = "text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1 py-1.5 whitespace-nowrap";

/* ── Product picker (dropdown on description) ─────────────── */

function ProductPicker({ options, onSelect }: {
  options: ProductDetail[];
  onSelect: (index: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Pick from product list"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-80 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="max-h-52 overflow-y-auto">
          {options.map((p, pi) => (
            <button
              key={pi}
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
              onClick={() => { onSelect(String(pi)); setOpen(false); }}
            >
              <span className="min-w-0 flex-1 truncate">{p.product_description}</span>
              {p.hsn_code && (
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {p.hsn_code}
                </span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── Items table ──────────────────────────────────────────── */

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
    (rowIdx: number, value: string) => {
      const pIdx = parseInt(value, 10);
      const product = productOptions[pIdx];
      if (!product) return;
      const item = items[rowIdx];
      const next = [...items];
      next[rowIdx] = {
        ...item,
        description: product.product_description,
        ehsn: product.hsn_code,
        country_of_origin: product.country_of_origin || item.country_of_origin || "IN",
        unit_price: product.unit_price ?? item.unit_price,
        duty_rate: product.duty_rate ?? item.duty_rate,
        igst_amount: product.igst_percent ?? item.igst_amount,
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
    <div>
      <div className="flex items-center justify-end pb-1">
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-muted-foreground"
          onClick={() => setShowMore((v) => !v)}>
          <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : ""}`} />
          {showMore ? "Less" : "More fields"}
        </Button>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className={`${th} w-6`}>#</th>
            <th className={`${th} text-left`}>Description</th>
            <th className={`${th} w-14 text-right`}>Qty</th>
            <th className={`${th} w-[72px] text-right`}>Price{sym ? ` (${sym})` : ""}</th>
            <th className={`${th} w-[88px] text-left font-mono`}>HSN</th>
            <th className={`${th} w-16 text-right`}>Total</th>
            <th className={`${th} w-7`} />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-6 text-center text-xs text-muted-foreground">
                No items — click below to add one.
              </td>
            </tr>
          ) : items.map((item, i) => {
            const total = item.quantity && item.unit_price
              ? (item.quantity * item.unit_price).toFixed(2) : "";
            return (
              <Fragment key={i}>
                {/* Primary row */}
                <tr className={`group/row hover:bg-muted/30 ${showMore ? "" : "border-b"}`}>
                  <td className="w-6 text-center text-[10px] text-muted-foreground align-middle">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-0.5">
                      <Input value={item.description} className={`${cell} min-w-0 flex-1`} placeholder="Item description"
                        onChange={(e) => updateItem(i, "description", e.target.value)} />
                      {hasProducts && (
                        <ProductPicker
                          options={productOptions}
                          onSelect={(v) => handleProductSelect(i, v)}
                        />
                      )}
                    </div>
                  </td>
                  <td className="w-14">
                    <Input type="number" value={item.quantity} className={numCell}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value) || 0)} />
                  </td>
                  <td className="w-[72px]">
                    <Input type="number" value={item.unit_price ?? ""} className={numCell}
                      onChange={(e) => updateItem(i, "unit_price", e.target.value ? Number(e.target.value) : null)} />
                  </td>
                  <td className="w-[88px]">
                    <Input value={item.ehsn} className={`${cell} font-mono`} placeholder="8-digit"
                      onChange={(e) => updateItem(i, "ehsn", e.target.value)} />
                  </td>
                  <td className="w-16 text-right tabular-nums text-muted-foreground px-1 align-middle">{total}</td>
                  <td className="w-7 align-middle">
                    <button type="button" onClick={() => removeItem(i)}
                      className="opacity-0 group-hover/row:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>

                {/* Secondary row — extra fields with visible inputs */}
                {showMore && (
                  <tr className="border-b">
                    <td />
                    <td colSpan={5} className="pb-2 pt-0.5">
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <span className="mb-0.5 block text-[10px] text-muted-foreground">iHSN</span>
                          <Input value={item.ihsn} className="h-6 text-xs font-mono"
                            onChange={(e) => updateItem(i, "ihsn", e.target.value)} />
                        </div>
                        <div>
                          <span className="mb-0.5 block text-[10px] text-muted-foreground">Weight (kg)</span>
                          <Input type="number" value={item.weight ?? ""} className="h-6 text-xs text-right tabular-nums"
                            onChange={(e) => updateItem(i, "weight", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                        <div>
                          <span className="mb-0.5 block text-[10px] text-muted-foreground">Origin</span>
                          <Input value={item.country_of_origin} className="h-6 text-xs"
                            onChange={(e) => updateItem(i, "country_of_origin", e.target.value)} />
                        </div>
                        <div>
                          <span className="mb-0.5 block text-[10px] text-muted-foreground">IGST %</span>
                          <Input type="number" value={item.igst_amount ?? ""} className="h-6 text-xs text-right tabular-nums"
                            onChange={(e) => updateItem(i, "igst_amount", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                        <div>
                          <span className="mb-0.5 block text-[10px] text-muted-foreground">Duty %</span>
                          <Input type="number" value={item.duty_rate ?? ""} className="h-6 text-xs text-right tabular-nums"
                            onChange={(e) => updateItem(i, "duty_rate", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                      </div>
                    </td>
                    <td />
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <button type="button" onClick={onAdd}
        className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border-t border-dashed transition-colors flex items-center justify-center gap-1">
        <Plus className="h-3 w-3" /> Add item
      </button>
    </div>
  );
}
