"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ADDRESS_FIELDS } from "./address-form";
import type { ShipmentAddress } from "@/types/agent";

interface BoxReceiverSectionProps {
  address: ShipmentAddress;
  onChange: (address: ShipmentAddress) => void;
  isShared: boolean;
  canCopyFromFirst: boolean;
  onCopyFromFirst?: () => void;
}

export function BoxReceiverSection({
  address,
  onChange,
  isShared,
  canCopyFromFirst,
  onCopyFromFirst,
}: BoxReceiverSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const addrRecord = address as unknown as Record<string, string>;

  const summary = [address.name, address.city, address.country].filter(Boolean).join(", ");

  const setField = (key: string, value: string) => {
    onChange({ ...address, [key]: value });
  };

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
        {canCopyFromFirst && onCopyFromFirst && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 gap-1 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onCopyFromFirst();
            }}
          >
            <Copy className="h-2.5 w-2.5" />
            Copy Box 1
          </Button>
        )}
      </div>

      {/* Expanded: editable fields */}
      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ADDRESS_FIELDS.map((f) => (
            <div key={f.key}>
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
  );
}
