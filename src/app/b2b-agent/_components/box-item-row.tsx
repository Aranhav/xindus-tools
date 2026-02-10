"use client";

import { useMemo } from "react";
import { Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

/* ── Item row editor ──────────────────────────────────────── */

export function ItemRow({
  item,
  index,
  onChange,
  onRemove,
  products,
  currency,
}: {
  item: ShipmentBoxItem;
  index: number;
  onChange: (index: number, item: ShipmentBoxItem) => void;
  onRemove: (index: number) => void;
  products?: ProductDetail[];
  currency?: string;
}) {
  const sym = currencySymbol(currency);
  const set = (field: keyof ShipmentBoxItem, value: unknown) => {
    onChange(index, { ...item, [field]: value });
  };

  // Auto-calculate total_price and fob_value
  const computedTotal = item.quantity && item.unit_price
    ? (item.quantity * item.unit_price).toFixed(2)
    : "";
  const computedFob = item.quantity && item.unit_fob_value
    ? (item.quantity * item.unit_fob_value).toFixed(2)
    : "";

  // Build product dropdown options (deduplicated by description+hsn)
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

  // Find current product match
  const currentProductIdx = productOptions.findIndex(
    (p) => p.product_description === item.description && p.hsn_code === item.ehsn,
  );

  const handleProductSelect = (value: string) => {
    const idx = parseInt(value, 10);
    const product = productOptions[idx];
    if (!product) return;
    onChange(index, {
      ...item,
      description: product.product_description,
      ehsn: product.hsn_code,
      country_of_origin: product.country_of_origin || item.country_of_origin || "IN",
      unit_price: product.unit_price ?? item.unit_price,
      duty_rate: product.duty_rate ?? item.duty_rate,
      igst_amount: product.igst_percent ?? item.igst_amount,
    });
  };

  return (
    <div className="group relative rounded-md border border-border/60 bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Product picker */}
      {productOptions.length > 0 && (
        <div className="mb-2">
          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Receipt className="h-2.5 w-2.5" />
            Product
          </Label>
          <Select
            value={currentProductIdx >= 0 ? String(currentProductIdx) : undefined}
            onValueChange={handleProductSelect}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select from products..." />
            </SelectTrigger>
            <SelectContent>
              {productOptions.map((p, i) => (
                <SelectItem key={i} value={String(i)} className="text-xs">
                  <span className="truncate">{p.product_description}</span>
                  {p.hsn_code && (
                    <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{p.hsn_code}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Row 1: Required — Description, Qty, Unit Price */}
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-2">
          <Label className="text-[10px] text-muted-foreground">Description *</Label>
          <Input
            value={item.description}
            onChange={(e) => set("description", e.target.value)}
            className="h-7 text-xs"
            placeholder="Product description"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Qty *</Label>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => set("quantity", Number(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Unit Price {sym && `(${sym})`} *</Label>
          <Input
            type="number"
            value={item.unit_price ?? ""}
            onChange={(e) => set("unit_price", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* Row 2: HSN + calculated total */}
      <div className="mt-2 grid grid-cols-4 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">Export HSN *</Label>
          <Input
            value={item.ehsn}
            onChange={(e) => set("ehsn", e.target.value)}
            className="h-7 font-mono text-xs"
            placeholder="8-digit"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Import HSN</Label>
          <Input
            value={item.ihsn}
            onChange={(e) => set("ihsn", e.target.value)}
            className="h-7 font-mono text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Unit Weight (kg)</Label>
          <Input
            type="number"
            value={item.weight ?? ""}
            onChange={(e) => set("weight", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Total {sym && `(${sym})`}</Label>
          <Input
            value={computedTotal}
            readOnly
            tabIndex={-1}
            className="h-7 text-xs bg-muted/50 text-muted-foreground"
          />
        </div>
      </div>

      {/* Row 3: Optional — Origin, IGST, Duty, FOB */}
      <div className="mt-2 grid grid-cols-4 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">Country of Origin</Label>
          <Input
            value={item.country_of_origin}
            onChange={(e) => set("country_of_origin", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">IGST %</Label>
          <Input
            type="number"
            value={item.igst_amount ?? ""}
            onChange={(e) => set("igst_amount", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Duty Rate %</Label>
          <Input
            type="number"
            value={item.duty_rate ?? ""}
            onChange={(e) => set("duty_rate", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Unit FOB {sym && `(${sym})`}</Label>
          <Input
            type="number"
            value={item.unit_fob_value ?? ""}
            onChange={(e) => set("unit_fob_value", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* FOB total (auto-calc, shown only if unit_fob has a value) */}
      {item.unit_fob_value != null && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          <div className="col-start-4">
            <Label className="text-[10px] text-muted-foreground">FOB Total {sym && `(${sym})`}</Label>
            <Input
              value={computedFob}
              readOnly
              tabIndex={-1}
              className="h-7 text-xs bg-muted/50 text-muted-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
}
