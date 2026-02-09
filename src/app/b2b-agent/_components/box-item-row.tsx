"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShipmentBox, ShipmentBoxItem, ShipmentAddress } from "@/types/agent";

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
}: {
  item: ShipmentBoxItem;
  index: number;
  onChange: (index: number, item: ShipmentBoxItem) => void;
  onRemove: (index: number) => void;
}) {
  const set = (field: keyof ShipmentBoxItem, value: unknown) => {
    onChange(index, { ...item, [field]: value });
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="col-span-2">
          <Label className="text-[10px] text-muted-foreground">Description</Label>
          <Input
            value={item.description}
            onChange={(e) => set("description", e.target.value)}
            className="h-7 text-xs"
            placeholder="Product description"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Qty</Label>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => set("quantity", Number(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Weight (kg)</Label>
          <Input
            type="number"
            value={item.weight ?? ""}
            onChange={(e) => set("weight", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Unit Price</Label>
          <Input
            type="number"
            value={item.unit_price ?? ""}
            onChange={(e) => set("unit_price", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Total Price</Label>
          <Input
            type="number"
            value={item.total_price ?? ""}
            onChange={(e) => set("total_price", e.target.value ? Number(e.target.value) : null)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Export HSN</Label>
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
          <Label className="text-[10px] text-muted-foreground">Country of Origin</Label>
          <Input
            value={item.country_of_origin}
            onChange={(e) => set("country_of_origin", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">FOB Value</Label>
          <Input
            type="number"
            value={item.unit_fob_value ?? ""}
            onChange={(e) => set("unit_fob_value", e.target.value ? Number(e.target.value) : null)}
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
          <Label className="text-[10px] text-muted-foreground">Category</Label>
          <Input
            value={item.category}
            onChange={(e) => set("category", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
