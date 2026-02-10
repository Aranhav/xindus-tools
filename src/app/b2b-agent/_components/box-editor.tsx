"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { emptyBox, emptyItem, ItemsTable } from "./box-item-row";
import { BoxReceiverSection } from "./box-receiver-section";
import { currencySymbol } from "./editable-fields";
import type { ShipmentBox, ShipmentAddress, ProductDetail } from "@/types/agent";

/* ── Single box card ──────────────────────────────────────── */

function BoxCard({
  box, index, onChange, onRemove, isShared, canCopyFromFirst,
  onCopyFromFirst, previousReceiverAddresses, allReceivers, products, currency,
}: {
  box: ShipmentBox;
  index: number;
  onChange: (index: number, box: ShipmentBox) => void;
  onRemove: (index: number) => void;
  isShared: boolean;
  canCopyFromFirst: boolean;
  onCopyFromFirst?: () => void;
  previousReceiverAddresses?: ShipmentAddress[];
  allReceivers?: ShipmentAddress[];
  products?: ProductDetail[];
  currency?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const setField = (field: keyof ShipmentBox, value: unknown) =>
    onChange(index, { ...box, [field]: value });

  const handleReceiverChange = (addr: ShipmentAddress) =>
    onChange(index, { ...box, receiver_address: addr });

  const volWeight = ((box.length * box.width * box.height) / 5000).toFixed(2);
  const sym = currencySymbol(currency);
  const itemCount = box.shipment_box_items.length;

  const totalValue = useMemo(
    () => box.shipment_box_items.reduce(
      (s, it) => s + (it.quantity || 0) * (it.unit_price || 0), 0,
    ),
    [box.shipment_box_items],
  );

  return (
    <div className="rounded-lg border bg-background">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded
          ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium whitespace-nowrap">Box {box.box_id}</span>

        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">
            {box.length}&times;{box.width}&times;{box.height} cm
          </span>
          <span>{box.weight} kg</span>
        </span>

        <Badge variant="secondary" className="min-w-[72px] text-center text-[10px] shrink-0">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
          {totalValue > 0 && <>&nbsp;&middot;&nbsp;{sym}{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</>}
        </Badge>

        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-3 py-3 space-y-3">
          {/* Receiver section (multi-address only) */}
          {!isShared && (
            <BoxReceiverSection
              address={box.receiver_address}
              onChange={handleReceiverChange}
              isShared={isShared}
              canCopyFromFirst={canCopyFromFirst}
              onCopyFromFirst={onCopyFromFirst}
              previousAddresses={previousReceiverAddresses}
              allReceivers={allReceivers}
            />
          )}

          {/* Compact dimensions */}
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-[10px] text-muted-foreground">Dimensions (cm)</Label>
              <div className="flex items-center">
                <Input type="number" value={box.length || ""} placeholder="L"
                  onChange={(e) => setField("length", Number(e.target.value) || 0)}
                  className="h-7 w-[72px] rounded-r-none border-r-0 text-xs text-center" />
                <span className="flex h-7 items-center border-y border-border bg-muted/50 px-1 text-[10px] text-muted-foreground">&times;</span>
                <Input type="number" value={box.width || ""} placeholder="W"
                  onChange={(e) => setField("width", Number(e.target.value) || 0)}
                  className="h-7 w-[72px] rounded-none border-x-0 text-xs text-center" />
                <span className="flex h-7 items-center border-y border-border bg-muted/50 px-1 text-[10px] text-muted-foreground">&times;</span>
                <Input type="number" value={box.height || ""} placeholder="H"
                  onChange={(e) => setField("height", Number(e.target.value) || 0)}
                  className="h-7 w-[72px] rounded-l-none border-l-0 text-xs text-center" />
              </div>
            </div>
            <div className="w-20">
              <Label className="text-[10px] text-muted-foreground">Weight (kg)</Label>
              <Input type="number" value={box.weight || ""}
                onChange={(e) => setField("weight", Number(e.target.value) || 0)}
                className="h-7 text-xs" />
            </div>
            <span className="whitespace-nowrap pb-1.5 text-[10px] text-muted-foreground">
              Vol: {volWeight} kg
            </span>
          </div>

          <Separator />

          {/* Items table */}
          <ItemsTable
            items={box.shipment_box_items}
            onChange={(items) => onChange(index, { ...box, shipment_box_items: items })}
            onAdd={() => onChange(index, { ...box, shipment_box_items: [...box.shipment_box_items, emptyItem()] })}
            products={products}
            currency={currency}
          />
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
  products?: ProductDetail[];
  currency?: string;
}

export function BoxEditor({ boxes, onChange, multiAddress, previousReceiverAddresses, products, currency }: BoxEditorProps) {
  const allReceivers = useMemo(() => {
    const seen = new Set<string>();
    const result: ShipmentAddress[] = [];
    for (const b of boxes) {
      const addr = b.receiver_address;
      if (!addr?.name) continue;
      const key = `${addr.address ?? ""}|${addr.city ?? ""}|${addr.zip ?? ""}`;
      if (key && !seen.has(key)) { seen.add(key); result.push(addr); }
    }
    return result;
  }, [boxes]);

  const updateBox = useCallback(
    (index: number, box: ShipmentBox) => {
      const next = [...boxes];
      next[index] = box;
      // Only sync receiver across boxes when the receiver actually changed
      if (!multiAddress && box.receiver_address !== boxes[index]?.receiver_address) {
        const receiver = box.receiver_address;
        for (let i = 0; i < next.length; i++) {
          if (i !== index) next[i] = { ...next[i], receiver_address: { ...receiver } };
        }
      }
      onChange(next);
    },
    [boxes, onChange, multiAddress],
  );

  const removeBox = useCallback(
    (index: number) => onChange(boxes.filter((_, i) => i !== index)),
    [boxes, onChange],
  );

  const addBox = useCallback(() => {
    const inheritReceiver = !multiAddress && boxes.length > 0 ? boxes[0].receiver_address : undefined;
    onChange([...boxes, emptyBox(boxes.length, inheritReceiver)]);
  }, [boxes, onChange, multiAddress]);

  const copyFromFirst = useCallback(
    (targetIndex: number) => {
      if (boxes.length === 0) return;
      const next = [...boxes];
      next[targetIndex] = { ...next[targetIndex], receiver_address: { ...boxes[0].receiver_address } };
      onChange(next);
    },
    [boxes, onChange],
  );

  return (
    <div className="space-y-1.5">
      {boxes.map((box, i) => (
        <BoxCard
          key={`${box.box_id}-${i}`}
          box={box} index={i} onChange={updateBox} onRemove={removeBox}
          isShared={!multiAddress} canCopyFromFirst={multiAddress && i > 0}
          onCopyFromFirst={() => copyFromFirst(i)}
          previousReceiverAddresses={previousReceiverAddresses}
          allReceivers={allReceivers} products={products} currency={currency}
        />
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addBox}>
        <Plus className="h-3.5 w-3.5" />
        Add Box
      </Button>
    </div>
  );
}
