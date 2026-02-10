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
import { emptyBox, emptyItem, ItemRow } from "./box-item-row";
import { BoxReceiverSection } from "./box-receiver-section";
import type { ShipmentBox, ShipmentBoxItem, ShipmentAddress } from "@/types/agent";

/* ── Single box editor ────────────────────────────────────── */

function BoxCard({
  box,
  index,
  onChange,
  onRemove,
  isShared,
  canCopyFromFirst,
  onCopyFromFirst,
  previousReceiverAddresses,
}: {
  box: ShipmentBox;
  index: number;
  onChange: (index: number, box: ShipmentBox) => void;
  onRemove: (index: number) => void;
  isShared: boolean;
  canCopyFromFirst: boolean;
  onCopyFromFirst?: () => void;
  previousReceiverAddresses?: ShipmentAddress[];
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

  const handleReceiverChange = (addr: ShipmentAddress) => {
    onChange(index, { ...box, receiver_address: addr });
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
          {/* Receiver address (editable) */}
          <BoxReceiverSection
            address={box.receiver_address}
            onChange={handleReceiverChange}
            isShared={isShared}
            canCopyFromFirst={canCopyFromFirst}
            onCopyFromFirst={onCopyFromFirst}
            previousAddresses={previousReceiverAddresses}
          />

          {/* Dimensions row */}
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
  multiAddress: boolean;
  previousReceiverAddresses?: ShipmentAddress[];
}

export function BoxEditor({ boxes, onChange, multiAddress, previousReceiverAddresses }: BoxEditorProps) {
  const updateBox = useCallback(
    (index: number, box: ShipmentBox) => {
      const next = [...boxes];
      next[index] = box;

      // Single-address mode: propagate receiver to all boxes
      if (!multiAddress) {
        const receiver = box.receiver_address;
        for (let i = 0; i < next.length; i++) {
          if (i !== index) {
            next[i] = { ...next[i], receiver_address: { ...receiver } };
          }
        }
      }

      onChange(next);
    },
    [boxes, onChange, multiAddress],
  );

  const removeBox = useCallback(
    (index: number) => {
      onChange(boxes.filter((_, i) => i !== index));
    },
    [boxes, onChange],
  );

  const addBox = useCallback(() => {
    // In single-address mode, inherit receiver from box 0
    const inheritReceiver = !multiAddress && boxes.length > 0
      ? boxes[0].receiver_address
      : undefined;
    onChange([...boxes, emptyBox(boxes.length, inheritReceiver)]);
  }, [boxes, onChange, multiAddress]);

  const copyFromFirst = useCallback(
    (targetIndex: number) => {
      if (boxes.length === 0) return;
      const next = [...boxes];
      next[targetIndex] = {
        ...next[targetIndex],
        receiver_address: { ...boxes[0].receiver_address },
      };
      onChange(next);
    },
    [boxes, onChange],
  );

  return (
    <div className="space-y-2">
      {boxes.map((box, i) => (
        <BoxCard
          key={`${box.box_id}-${i}`}
          box={box}
          index={i}
          onChange={updateBox}
          onRemove={removeBox}
          isShared={!multiAddress}
          canCopyFromFirst={multiAddress && i > 0}
          onCopyFromFirst={() => copyFromFirst(i)}
          previousReceiverAddresses={previousReceiverAddresses}
        />
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addBox}>
        <Plus className="h-3.5 w-3.5" />
        Add Box
      </Button>
    </div>
  );
}
