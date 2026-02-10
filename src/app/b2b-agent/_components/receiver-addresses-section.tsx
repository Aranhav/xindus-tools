"use client";

import { useMemo, useCallback } from "react";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressForm } from "./address-form";
import { ADDRESS_TYPE_CONFIG } from "./address-field-config";
import type { ShipmentBox, ShipmentAddress, CorrectionItem, SellerHistory } from "@/types/agent";

interface ReceiverAddressesSectionProps {
  boxes: ShipmentBox[];
  onBoxesChange: (boxes: ShipmentBox[]) => void;
  multiAddress: boolean;
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
  sellerHistory,
  confidence,
}: ReceiverAddressesSectionProps) {
  const config = ADDRESS_TYPE_CONFIG.receiver;

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

  const addReceiver = useCallback(() => {
    // Add a new box with empty receiver to trigger multi-address
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
    onBoxesChange([...boxes, newBox]);
  }, [boxes, onBoxesChange]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${config.iconBg}`}>
            <MapPin className={`h-3.5 w-3.5 ${config.iconColor}`} />
          </div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Receiver {multiAddress ? `Addresses (${groups.length})` : "Address"}
          </h4>
        </div>
        {multiAddress && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={addReceiver}
          >
            <Plus className="h-3 w-3" />
            Add Receiver
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {groups.map((group, i) => {
          const boxLabel = multiAddress
            ? `Box ${group.boxIndices.map((idx) => idx + 1).join(", ")}`
            : boxes.length > 1
              ? "All Boxes"
              : undefined;

          return (
            <AddressForm
              key={group.key}
              label={multiAddress ? `Receiver ${i + 1}` : "Receiver"}
              address={group.address}
              basePath={`receiver_${i}`}
              addressType="receiver"
              confidence={confidence}
              onCorrections={(corrections) => handleSave(i, corrections)}
              previousAddresses={sellerHistory?.receiver_addresses}
              boxLabel={boxLabel}
            />
          );
        })}

        {groups.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-xs text-muted-foreground">No receiver addresses. Add a box to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
