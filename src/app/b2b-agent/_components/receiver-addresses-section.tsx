"use client";

import { useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressForm } from "./address-form";
import type { ShipmentBox, ShipmentAddress, CorrectionItem, SellerHistory } from "@/types/agent";

interface ReceiverAddressesSectionProps {
  boxes: ShipmentBox[];
  onBoxesChange: (boxes: ShipmentBox[]) => void;
  multiAddress: boolean;
  onMultiAddressChange?: (multi: boolean) => void;
  sellerHistory?: SellerHistory | null;
  confidence?: Record<string, number>;
}

interface ReceiverGroup {
  address: ShipmentAddress;
  boxIndices: number[];
  key: string;
}

function addressKey(addr: ShipmentAddress | undefined): string {
  if (!addr) return "||";
  const r = addr as unknown as Record<string, string>;
  return `${r.address ?? ""}|${r.city ?? ""}|${r.zip ?? ""}`;
}

export function ReceiverAddressesSection({
  boxes,
  onBoxesChange,
  multiAddress,
  onMultiAddressChange,
  sellerHistory,
  confidence,
}: ReceiverAddressesSectionProps) {
  // Derive unique receiver groups from boxes
  const groups = useMemo<ReceiverGroup[]>(() => {
    const map = new Map<string, ReceiverGroup>();
    boxes.forEach((box, idx) => {
      const key = addressKey(box.receiver_address);
      const existing = map.get(key);
      if (existing) {
        existing.boxIndices.push(idx);
      } else {
        map.set(key, {
          address: box.receiver_address ?? ({} as ShipmentAddress),
          boxIndices: [idx],
          key,
        });
      }
    });
    return Array.from(map.values());
  }, [boxes]);

  // Handle saving changes from an address card
  const handleSave = useCallback(
    (groupIdx: number, corrections: CorrectionItem[]) => {
      const group = groups[groupIdx];
      if (!group) return;

      // Build updated address from corrections
      const updated = { ...group.address } as unknown as Record<string, string>;
      for (const c of corrections) {
        // corrections have field_path like "receiver_N.field" — extract field name
        const parts = c.field_path.split(".");
        const fieldName = parts[parts.length - 1];
        updated[fieldName] = String(c.new_value ?? "");
      }
      const newAddr = updated as unknown as ShipmentAddress;

      // If single-address mode, propagate to ALL boxes
      if (!multiAddress) {
        const next = boxes.map((b) => ({ ...b, receiver_address: { ...newAddr } }));
        onBoxesChange(next);
        return;
      }

      // Multi-address mode: only update boxes in this group
      const next = [...boxes];
      for (const boxIdx of group.boxIndices) {
        next[boxIdx] = { ...next[boxIdx], receiver_address: { ...newAddr } };
      }
      onBoxesChange(next);
    },
    [groups, boxes, onBoxesChange, multiAddress],
  );

  const handleDelete = useCallback(
    (groupIdx: number) => {
      const group = groups[groupIdx];
      if (!group) return;
      // Remove all boxes belonging to this receiver group
      const removeSet = new Set(group.boxIndices);
      const next = boxes.filter((_, idx) => !removeSet.has(idx));

      if (next.length === 0) {
        onBoxesChange([]);
        onMultiAddressChange?.(false);
        return;
      }

      // Check if remaining boxes collapse to a single address group
      const remainingKeys = new Set(next.map((b) => addressKey(b.receiver_address)));
      if (remainingKeys.size <= 1) {
        // Convert to single-address: assign remaining address to all boxes
        const remainingAddr = next[0].receiver_address;
        const singleBoxes = next.map((b) => ({ ...b, receiver_address: { ...remainingAddr } }));
        onBoxesChange(singleBoxes);
        onMultiAddressChange?.(false);
      } else {
        onBoxesChange(next);
      }
    },
    [groups, boxes, onBoxesChange, onMultiAddressChange],
  );

  const addReceiver = useCallback(() => {
    // Add a new box with empty receiver for a new delivery address
    const emptyAddr: ShipmentAddress = {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zip: "",
      district: "",
      state: "",
      country: "",
      extension_number: "",
      eori_number: "",
      contact_name: "",
      contact_phone: "",
      warehouse_id: null,
      type: null,
    };
    const newBox: ShipmentBox = {
      box_id: String(boxes.length + 1),
      weight: 0,
      width: 0,
      length: 0,
      height: 0,
      uom: "CM",
      has_battery: false,
      remarks: "",
      receiver_address: emptyAddr,
      shipment_box_items: [],
    };

    // Convert to multi-address mode — existing boxes keep their current address
    onMultiAddressChange?.(true);
    onBoxesChange([...boxes, newBox]);
  }, [boxes, onBoxesChange, onMultiAddressChange]);

  return (
    <div>
      {multiAddress && groups.length > 0 && (
        <div className="mb-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            {groups.length} receiver{groups.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {groups.map((group, i) => {
          const MAX_BOX_DISPLAY = 3;
          const boxNums = group.boxIndices.map((idx) => idx + 1);
          const isTruncated = multiAddress && boxNums.length > MAX_BOX_DISPLAY;
          const boxLabel = multiAddress
            ? isTruncated
              ? `Box ${boxNums.slice(0, MAX_BOX_DISPLAY).join(", ")} +${boxNums.length - MAX_BOX_DISPLAY}`
              : `Box ${boxNums.join(", ")}`
            : boxes.length > 1
              ? "All Boxes"
              : undefined;
          const boxTooltip = isTruncated
            ? `Box ${boxNums.join(", ")}`
            : undefined;

          return (
            <AddressForm
              key={group.key}
              label={groups.length > 1 ? `Receiver ${i + 1}` : "Receiver"}
              address={group.address}
              basePath={`receiver_${i}`}
              addressType="receiver"
              confidence={confidence}
              onCorrections={(corrections) => handleSave(i, corrections)}
              previousAddresses={sellerHistory?.receiver_addresses}
              boxLabel={boxLabel}
              boxTooltip={boxTooltip}
              onDelete={groups.length > 1 ? () => handleDelete(i) : undefined}
            />
          );
        })}

        {groups.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-xs text-muted-foreground">No receiver addresses. Add a box to get started.</p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full gap-1 text-xs text-muted-foreground"
          onClick={addReceiver}
        >
          <Plus className="h-3 w-3" />
          Add Delivery Address
        </Button>
      </div>
    </div>
  );
}
