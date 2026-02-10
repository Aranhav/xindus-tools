"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

/* ── Inline table styles ──────────────────────────────────── */

const cell = "border-0 bg-transparent h-7 text-xs p-1 focus:ring-1 focus:ring-ring rounded-sm";
const numCell = `${cell} text-right tabular-nums`;
const th = "text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1 py-1.5 whitespace-nowrap";

/* ── Helper: nullable number input ────────────────────────── */

function NumCell({ value, field, row, update, mono }: {
  value: number | null | undefined; field: keyof ShipmentBoxItem;
  row: number; update: (i: number, f: keyof ShipmentBoxItem, v: unknown) => void; mono?: boolean;
}) {
  return (
    <Input type="number" value={value ?? ""} className={mono ? `${cell} font-mono` : numCell}
      onChange={(e) => update(row, field, e.target.value ? Number(e.target.value) : null)} />
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

  const totalCols = 6 + (hasProducts ? 1 : 0) + 1 + (showMore ? 5 : 0);

  return (
    <div>
      <div className="flex items-center justify-end pb-1">
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-muted-foreground"
          onClick={() => setShowMore((v) => !v)}>
          <ChevronRight className={`h-3 w-3 transition-transform ${showMore ? "rotate-90" : ""}`} />
          {showMore ? "Less" : "More"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className={`${th} w-6`}>#</th>
              {hasProducts && <th className={`${th} min-w-[140px] text-left`}>Product</th>}
              <th className={`${th} min-w-[180px] text-left`}>Description</th>
              <th className={`${th} w-16 text-right`}>Qty</th>
              <th className={`${th} w-20 text-right`}>Price{sym ? ` (${sym})` : ""}</th>
              <th className={`${th} w-24 text-left font-mono`}>eHSN</th>
              <th className={`${th} w-20 text-right`}>Total{sym ? ` (${sym})` : ""}</th>
              {showMore && <>
                <th className={`${th} w-20 text-left font-mono`}>iHSN</th>
                <th className={`${th} w-20 text-right`}>Wt (kg)</th>
                <th className={`${th} w-20 text-left`}>Origin</th>
                <th className={`${th} w-20 text-right`}>IGST%</th>
                <th className={`${th} w-20 text-right`}>Duty%</th>
              </>}
              <th className={`${th} w-8`} />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="py-6 text-center text-xs text-muted-foreground">
                  No items. Click below to add one.
                </td>
              </tr>
            ) : items.map((item, i) => {
              const total = item.quantity && item.unit_price
                ? (item.quantity * item.unit_price).toFixed(2) : "";
              const prodIdx = productOptions.findIndex(
                (p) => p.product_description === item.description && p.hsn_code === item.ehsn,
              );
              return (
                <tr key={i} className="group/row border-b last:border-b-0 hover:bg-muted/30">
                  <td className="w-6 text-center text-[10px] text-muted-foreground">{i + 1}</td>
                  {hasProducts && (
                    <td className="min-w-[140px]">
                      <Select value={prodIdx >= 0 ? String(prodIdx) : undefined}
                        onValueChange={(v) => handleProductSelect(i, v)}>
                        <SelectTrigger className="h-7 text-xs border-0 bg-transparent">
                          <SelectValue placeholder="Pick..." />
                        </SelectTrigger>
                        <SelectContent>
                          {productOptions.map((p, pi) => (
                            <SelectItem key={pi} value={String(pi)} className="text-xs">
                              <span className="truncate">{p.product_description}</span>
                              {p.hsn_code && (
                                <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                                  {p.hsn_code}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  <td className="min-w-[180px]">
                    <Input value={item.description} className={cell} placeholder="Description"
                      onChange={(e) => updateItem(i, "description", e.target.value)} />
                  </td>
                  <td className="w-16">
                    <Input type="number" value={item.quantity} className={numCell}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value) || 0)} />
                  </td>
                  <td className="w-20">
                    <NumCell value={item.unit_price} field="unit_price" row={i} update={updateItem} />
                  </td>
                  <td className="w-24">
                    <Input value={item.ehsn} className={`${cell} font-mono`} placeholder="8-digit"
                      onChange={(e) => updateItem(i, "ehsn", e.target.value)} />
                  </td>
                  <td className="w-20 text-right tabular-nums text-muted-foreground px-1">{total}</td>
                  {showMore && <>
                    <td className="w-20">
                      <Input value={item.ihsn} className={`${cell} font-mono`}
                        onChange={(e) => updateItem(i, "ihsn", e.target.value)} />
                    </td>
                    <td className="w-20">
                      <NumCell value={item.weight} field="weight" row={i} update={updateItem} />
                    </td>
                    <td className="w-20">
                      <Input value={item.country_of_origin} className={cell}
                        onChange={(e) => updateItem(i, "country_of_origin", e.target.value)} />
                    </td>
                    <td className="w-20">
                      <NumCell value={item.igst_amount} field="igst_amount" row={i} update={updateItem} />
                    </td>
                    <td className="w-20">
                      <NumCell value={item.duty_rate} field="duty_rate" row={i} update={updateItem} />
                    </td>
                  </>}
                  <td className="w-8">
                    <button onClick={() => removeItem(i)}
                      className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1 text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={onAdd}
        className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border-t border-dashed transition-colors flex items-center justify-center gap-1">
        <Plus className="h-3 w-3" /> Add item
      </button>
    </div>
  );
}
