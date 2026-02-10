"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Link2, History, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADDRESS_FIELDS } from "./address-field-config";
import type { ShipmentAddress } from "@/types/agent";

interface BoxReceiverSectionProps {
  address: ShipmentAddress;
  onChange: (address: ShipmentAddress) => void;
  isShared: boolean;
  canCopyFromFirst: boolean;
  onCopyFromFirst?: () => void;
  previousAddresses?: ShipmentAddress[];
  /** All unique receiver addresses from the Addresses tab */
  allReceivers?: ShipmentAddress[];
}

function addressSummary(addr: ShipmentAddress | undefined): string {
  if (!addr) return "";
  return [addr.name, addr.city, addr.country].filter(Boolean).join(", ");
}

function addressMatchKey(addr: ShipmentAddress | undefined): string {
  if (!addr) return "";
  return `${addr.address ?? ""}|${addr.city ?? ""}|${addr.zip ?? ""}`;
}

export function BoxReceiverSection({
  address,
  onChange,
  isShared,
  canCopyFromFirst,
  onCopyFromFirst,
  previousAddresses,
  allReceivers,
}: BoxReceiverSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const addrRecord = address as unknown as Record<string, string>;

  const summary = addressSummary(address);

  // Build dropdown options from allReceivers + previousAddresses (deduplicated)
  const dropdownOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { label: string; address: ShipmentAddress; source: "current" | "history" }[] = [];

    // Unique receivers from the Addresses tab
    for (const r of allReceivers ?? []) {
      const key = addressMatchKey(r);
      if (key && !seen.has(key) && r.name) {
        seen.add(key);
        options.push({ label: addressSummary(r), address: r, source: "current" });
      }
    }

    // Previous addresses from seller history
    for (const pa of previousAddresses ?? []) {
      const key = addressMatchKey(pa);
      if (key && !seen.has(key) && pa.name) {
        seen.add(key);
        options.push({ label: addressSummary(pa), address: pa, source: "history" });
      }
    }

    return options;
  }, [allReceivers, previousAddresses]);

  const currentKey = addressMatchKey(address);

  const setField = (key: string, value: string) => {
    onChange({ ...address, [key]: value });
  };

  const handleDropdownSelect = (value: string) => {
    if (value === "__custom__") {
      setShowCustomForm(true);
      return;
    }
    const idx = parseInt(value, 10);
    const option = dropdownOptions[idx];
    if (option) {
      onChange({ ...option.address });
      setShowCustomForm(false);
    }
  };

  // Find current selection index
  const currentSelectionIdx = dropdownOptions.findIndex(
    (o) => addressMatchKey(o.address) === currentKey,
  );

  return (
    <div className="mt-2 rounded-md border border-dashed border-border/60 bg-muted/10 px-3 py-2">
      {/* Collapsed row */}
      <div
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <MapPin className="h-3 w-3 text-green-500" />
        <span className="text-xs text-muted-foreground">To:</span>
        <span className="min-w-0 flex-1 truncate text-xs">
          {summary || <span className="italic text-muted-foreground/60">No receiver set</span>}
        </span>
        {isShared && (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Link2 className="h-2.5 w-2.5" />
            Shared
          </Badge>
        )}
      </div>

      {/* Expanded: dropdown selector + optional custom form */}
      {expanded && (
        <div className="mt-2 space-y-2">
          {/* Dropdown for quick selection */}
          {dropdownOptions.length > 0 && !isShared && (
            <Select
              value={currentSelectionIdx >= 0 ? String(currentSelectionIdx) : undefined}
              onValueChange={handleDropdownSelect}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select receiver address..." />
              </SelectTrigger>
              <SelectContent>
                {dropdownOptions.map((opt, i) => (
                  <SelectItem key={i} value={String(i)} className="text-xs">
                    <div className="flex items-center gap-2">
                      {opt.source === "history" && (
                        <History className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="__custom__" className="text-xs">
                  Custom address...
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Copy from first button for multi-address */}
          {canCopyFromFirst && onCopyFromFirst && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={onCopyFromFirst}
            >
              Copy from Box 1
            </Button>
          )}

          {/* Custom form (shown when "Custom..." selected, no options, or shared mode) */}
          {(showCustomForm || dropdownOptions.length === 0 || isShared) && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ADDRESS_FIELDS.map((f) => (
                <div key={f.key} className={f.span === "full" ? "col-span-full" : ""}>
                  <Label className="text-[10px] text-muted-foreground">{f.label}</Label>
                  <Input
                    value={addrRecord[f.key] || ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
