"use client";

import { useState, useEffect, useCallback } from "react";
import { Warehouse, ChevronsUpDown, Check, Loader2, AlertTriangle, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ADDRESS_TYPE_CONFIG } from "./address-field-config";
import type { ShipmentAddress, CorrectionItem, XindusAddress } from "@/types/agent";

interface ShipperPickerProps {
  shipperAddress: ShipmentAddress;
  xindusCustomerId?: number | null;
  onCorrections: (corrections: CorrectionItem[]) => void;
  confidence?: Record<string, number>;
}

export function ShipperPicker({
  shipperAddress,
  xindusCustomerId,
  onCorrections,
  confidence,
}: ShipperPickerProps) {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<XindusAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(
    shipperAddress.warehouse_id ? Number(shipperAddress.warehouse_id) : null,
  );

  const config = ADDRESS_TYPE_CONFIG.shipper;

  const fetchAddresses = useCallback(async () => {
    if (!xindusCustomerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/b2b-agent/customers/${xindusCustomerId}/addresses?type=P`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [xindusCustomerId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Sync selectedId if shipper_address.warehouse_id changes externally
  useEffect(() => {
    setSelectedId(shipperAddress.warehouse_id ? Number(shipperAddress.warehouse_id) : null);
  }, [shipperAddress.warehouse_id]);

  const handleSelect = (addr: XindusAddress) => {
    setSelectedId(addr.id);
    setOpen(false);

    const fieldMap: Record<string, string> = {
      name: addr.name || "",
      address: addr.address || "",
      city: addr.city || "",
      district: addr.district || "",
      state: addr.state || "",
      zip: addr.zip || "",
      country: addr.country || "",
      phone: addr.phone || "",
      email: addr.email || "",
      warehouse_id: String(addr.id),
    };

    const addrRecord = shipperAddress as unknown as Record<string, string>;
    const corrections: CorrectionItem[] = [];
    for (const [key, newVal] of Object.entries(fieldMap)) {
      const oldVal = String(addrRecord[key] ?? "");
      if (oldVal !== newVal) {
        corrections.push({
          field_path: `shipper_address.${key}`,
          old_value: addrRecord[key] ?? "",
          new_value: newVal,
        });
      }
    }
    if (corrections.length > 0) {
      onCorrections(corrections);
    }
  };

  const selectedAddr = addresses.find((a) => a.id === selectedId);

  // No Xindus customer linked
  if (!xindusCustomerId) {
    return (
      <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${config.iconBg}`}>
            <Warehouse className={`h-3.5 w-3.5 ${config.iconColor}`} />
          </div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Shipper Pickup Address
          </h4>
        </div>
        <div className="mt-3 flex items-start gap-2 pl-[34px]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Link a Xindus customer to select a pickup address from their saved warehouses.
          </p>
        </div>
        {/* Show extracted shipper name if available */}
        {shipperAddress.name && (
          <div className="mt-2 pl-[34px]">
            <p className="text-xs text-muted-foreground">
              Extracted shipper: <span className="font-medium text-foreground">{shipperAddress.name}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${config.iconBg}`}>
            <Warehouse className={`h-3.5 w-3.5 ${config.iconColor}`} />
          </div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Shipper Pickup Address
          </h4>
        </div>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      {/* Combobox */}
      <div className="pl-[34px]">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-7 w-full justify-between text-xs"
            >
              {selectedAddr
                ? `${selectedAddr.name} — ${selectedAddr.city || ""}`
                : addresses.length > 0
                  ? "Select pickup warehouse..."
                  : "No pickup addresses found"
              }
              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search addresses..." className="h-8 text-xs" />
              <CommandList>
                <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
                  No matching addresses.
                </CommandEmpty>
                <CommandGroup>
                  {addresses.map((addr) => (
                    <CommandItem
                      key={addr.id}
                      value={`${addr.name} ${addr.city} ${addr.address}`}
                      onSelect={() => handleSelect(addr)}
                      className="text-xs"
                    >
                      <Check
                        className={`mr-2 h-3 w-3 ${selectedId === addr.id ? "opacity-100" : "opacity-0"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{addr.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {[addr.address, addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected address card */}
        {selectedAddr && (
          <div className="mt-3 rounded-lg border border-blue-200/50 bg-blue-50/30 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">{selectedAddr.name}</p>
              {selectedAddr.address && <p className="text-xs leading-snug text-foreground/80">{selectedAddr.address}</p>}
              <p className="text-xs leading-snug text-foreground/80">
                {[selectedAddr.city, selectedAddr.district, selectedAddr.state].filter(Boolean).join(", ")}
                {selectedAddr.zip ? ` ${selectedAddr.zip}` : ""}
              </p>
              {selectedAddr.country && <p className="text-xs leading-snug text-foreground/60">{selectedAddr.country}</p>}
              {(selectedAddr.phone || selectedAddr.email) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs text-muted-foreground">
                  {selectedAddr.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {selectedAddr.phone}
                    </span>
                  )}
                  {selectedAddr.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {selectedAddr.email}
                    </span>
                  )}
                </div>
              )}
            </div>
            <Badge variant="outline" className="mt-2 gap-1 text-[10px] text-blue-600 dark:text-blue-400">
              <MapPin className="h-2.5 w-2.5" />
              Xindus Warehouse #{selectedAddr.id}
            </Badge>
          </div>
        )}

        {/* Show extracted name even when no address selected yet */}
        {!selectedAddr && shipperAddress.name && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              Extracted: <span className="font-medium text-foreground">{shipperAddress.name}</span>
              {shipperAddress.city && `, ${shipperAddress.city}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
