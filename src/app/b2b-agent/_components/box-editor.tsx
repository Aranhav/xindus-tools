"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Package,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ShipmentBox, ShipmentBoxItem, ShipmentAddress } from "@/types/agent";

/* ── Empty factories ──────────────────────────────────────── */

function emptyAddress(): ShipmentAddress {
  return {
    name: "", email: "", phone: "", address: "", city: "", zip: "",
    district: "", state: "", country: "", extension_number: "",
    eori_number: "", contact_name: "", contact_phone: "",
    warehouse_id: null, type: null,
  };
}

function emptyItem(): ShipmentBoxItem {
  return {
    description: "", quantity: 1, weight: null, unit_price: null,
    total_price: null, ehsn: "", ihsn: "", country_of_origin: "IN",
    category: "", market_place: "", igst_amount: null, duty_rate: null,
    vat_rate: null, unit_fob_value: null, fob_value: null,
    listing_price: null, cogs_value: null, insurance: null, remarks: "",
  };
}

function emptyBox(index: number): ShipmentBox {
  return {
    box_id: String(index + 1),
    weight: 0, width: 0, length: 0, height: 0,
    uom: "cm", has_battery: false, remarks: "",
    receiver_address: emptyAddress(),
    shipment_box_items: [emptyItem()],
  };
}

/* ── Item row editor ──────────────────────────────────────── */

function ItemRow({
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

/* ── Single box editor ────────────────────────────────────── */

function BoxCard({
  box,
  index,
  onChange,
  onRemove,
}: {
  box: ShipmentBox;
  index: number;
  onChange: (index: number, box: ShipmentBox) => void;
  onRemove: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const setField = (field: keyof ShipmentBox, value: unknown) => {
    onChange(index, { ...box, [field]: value });
  };

  const updateItem = (itemIdx: number, item: ShipmentBoxItem) => {
    const items = [...box.shipment_box_items];
    items[itemIdx] = item;
    onChange(index, { ...box, shipment_box_items: items });
  };

  const addItem = () => {
    onChange(index, {
      ...box,
      shipment_box_items: [...box.shipment_box_items, emptyItem()],
    });
  };

  const removeItem = (itemIdx: number) => {
    const items = box.shipment_box_items.filter((_, i) => i !== itemIdx);
    onChange(index, { ...box, shipment_box_items: items });
  };

  const volWeight = ((box.length * box.width * box.height) / 5000).toFixed(2);

  return (
    <div className="rounded-lg border">
      {/* Box header */}
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <Package className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">Box #{box.box_id}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {box.length}x{box.width}x{box.height} {box.uom} | {box.weight} kg | Vol: {volWeight} kg
        </span>
        <Badge variant="outline" className="text-[10px]">
          {box.shipment_box_items.length} item{box.shipment_box_items.length !== 1 ? "s" : ""}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Box body (expanded) */}
      {expanded && (
        <div className="border-t px-3 py-3">
          {/* Dimensions row */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <div>
              <Label className="text-[10px] text-muted-foreground">Length</Label>
              <Input
                type="number"
                value={box.length || ""}
                onChange={(e) => setField("length", Number(e.target.value) || 0)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={box.width || ""}
                onChange={(e) => setField("width", Number(e.target.value) || 0)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Height</Label>
              <Input
                type="number"
                value={box.height || ""}
                onChange={(e) => setField("height", Number(e.target.value) || 0)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Weight (kg)</Label>
              <Input
                type="number"
                value={box.weight || ""}
                onChange={(e) => setField("weight", Number(e.target.value) || 0)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">UOM</Label>
              <Input
                value={box.uom}
                onChange={(e) => setField("uom", e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={box.has_battery}
                  onCheckedChange={(v) => setField("has_battery", v)}
                  className="scale-75"
                />
                <Label className="text-[10px] text-muted-foreground">Battery</Label>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-2">
            <Label className="text-[10px] text-muted-foreground">Remarks</Label>
            <Input
              value={box.remarks}
              onChange={(e) => setField("remarks", e.target.value)}
              className="h-7 text-xs"
              placeholder="Optional remarks"
            />
          </div>

          {/* Receiver address (compact) */}
          {box.receiver_address?.name && (
            <p className="mt-2 text-xs text-muted-foreground">
              To: {[box.receiver_address.name, box.receiver_address.city, box.receiver_address.country].filter(Boolean).join(", ")}
            </p>
          )}

          <Separator className="my-3" />

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-medium text-muted-foreground">
                Items ({box.shipment_box_items.length})
              </h5>
              <Button variant="outline" size="sm" className="h-6 gap-1 px-2 text-xs" onClick={addItem}>
                <Plus className="h-3 w-3" />
                Add Item
              </Button>
            </div>
            {box.shipment_box_items.map((item, j) => (
              <ItemRow
                key={j}
                item={item}
                index={j}
                onChange={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Box editor (manages array of boxes) ──────────────────── */

interface BoxEditorProps {
  boxes: ShipmentBox[];
  onChange: (boxes: ShipmentBox[]) => void;
}

export function BoxEditor({ boxes, onChange }: BoxEditorProps) {
  const updateBox = useCallback(
    (index: number, box: ShipmentBox) => {
      const next = [...boxes];
      next[index] = box;
      onChange(next);
    },
    [boxes, onChange],
  );

  const removeBox = useCallback(
    (index: number) => {
      onChange(boxes.filter((_, i) => i !== index));
    },
    [boxes, onChange],
  );

  const addBox = useCallback(() => {
    onChange([...boxes, emptyBox(boxes.length)]);
  }, [boxes, onChange]);

  return (
    <div className="space-y-2">
      {boxes.map((box, i) => (
        <BoxCard
          key={`${box.box_id}-${i}`}
          box={box}
          index={i}
          onChange={updateBox}
          onRemove={removeBox}
        />
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addBox}>
        <Plus className="h-3.5 w-3.5" />
        Add Box
      </Button>
    </div>
  );
}
