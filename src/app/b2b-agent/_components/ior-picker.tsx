"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FileCheck, ChevronsUpDown, Check, Loader2, Phone, Mail, Building2 } from "lucide-react";
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
import { AddressForm } from "./address-form";
import type {
  ShipmentAddress,
  CorrectionItem,
  XindusAddress,
  SellerHistory,
} from "@/types/agent";

interface IorPickerProps {
  iorAddress: ShipmentAddress;
  xindusCustomerId?: number | null;
  onCorrections: (corrections: CorrectionItem[]) => void;
  confidence?: Record<string, number>;
  sellerDefault?: ShipmentAddress;
  sellerHistory?: SellerHistory | null;
}

interface MergedIorAddress {
  id: string;
  source: "xindus" | "history";
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  district: string;
  raw: XindusAddress | ShipmentAddress;
}

function toMergedFromXindus(addr: XindusAddress): MergedIorAddress {
  return {
    id: `x-${addr.id}`,
    source: "xindus",
    name: addr.name || "",
    address: addr.address || "",
    city: addr.city || "",
    state: addr.state || "",
    zip: addr.zip || "",
    country: addr.country || "",
    phone: addr.phone || "",
    email: addr.email || "",
    district: addr.district || "",
    raw: addr,
  };
}

function toMergedFromHistory(addr: ShipmentAddress, idx: number): MergedIorAddress {
  const r = addr as unknown as Record<string, string>;
  return {
    id: `h-${idx}`,
    source: "history",
    name: r.name || "",
    address: r.address || "",
    city: r.city || "",
    state: r.state || "",
    zip: r.zip || "",
    country: r.country || "",
    phone: r.phone || "",
    email: r.email || "",
    district: r.district || "",
    raw: addr,
  };
}

function dedupeKey(a: MergedIorAddress): string {
  return `${a.name.toLowerCase()}|${a.city.toLowerCase()}|${a.country.toLowerCase()}`;
}

export function IorPicker({
  iorAddress,
  xindusCustomerId,
  onCorrections,
  confidence,
  sellerDefault,
  sellerHistory,
}: IorPickerProps) {
  const [open, setOpen] = useState(false);
  const [xindusAddresses, setXindusAddresses] = useState<XindusAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const config = ADDRESS_TYPE_CONFIG.ior;

  const fetchXindusIor = useCallback(async () => {
    if (!xindusCustomerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/b2b-agent/customers/${xindusCustomerId}/addresses?type=I`);
      if (res.ok) {
        const data = await res.json();
        setXindusAddresses(data.addresses ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [xindusCustomerId]);

  useEffect(() => {
    fetchXindusIor();
  }, [fetchXindusIor]);

  // Merge Xindus IOR addresses + seller history IOR addresses, deduplicated
  const mergedAddresses = useMemo(() => {
    const seen = new Set<string>();
    const result: MergedIorAddress[] = [];

    // Xindus addresses first (platform source)
    for (const xa of xindusAddresses) {
      const m = toMergedFromXindus(xa);
      const key = dedupeKey(m);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(m);
      }
    }

    // History addresses
    const historyAddrs = sellerHistory?.ior_addresses ?? [];
    historyAddrs.forEach((ha, idx) => {
      const m = toMergedFromHistory(ha, idx);
      const key = dedupeKey(m);
      if (!seen.has(key) && m.name) {
        seen.add(key);
        result.push(m);
      }
    });

    return result;
  }, [xindusAddresses, sellerHistory]);

  const handleSelect = (addr: MergedIorAddress) => {
    setSelectedId(addr.id);
    setOpen(false);

    const fieldMap: Record<string, string> = {
      name: addr.name,
      address: addr.address,
      city: addr.city,
      district: addr.district,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone,
      email: addr.email,
    };

    const addrRecord = iorAddress as unknown as Record<string, string>;
    const corrections: CorrectionItem[] = [];
    for (const [key, newVal] of Object.entries(fieldMap)) {
      const oldVal = String(addrRecord[key] ?? "");
      if (oldVal !== newVal) {
        corrections.push({
          field_path: `ior_address.${key}`,
          old_value: addrRecord[key] ?? "",
          new_value: newVal,
        });
      }
    }
    if (corrections.length > 0) {
      onCorrections(corrections);
    }
  };

  const selectedAddr = mergedAddresses.find((a) => a.id === selectedId);
  const hasOptions = mergedAddresses.length > 0;

  return (
    <div className="space-y-2">
      {/* Picker combobox — only show when there are saved IOR addresses */}
      {hasOptions && (
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <FileCheck className={`h-3.5 w-3.5 ${config.iconColor}`} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Saved IOR Addresses
              </span>
              {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {mergedAddresses.length}
            </Badge>
          </div>
          <div className="px-3 py-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="h-8 w-full justify-between text-xs"
                >
                  {selectedAddr
                    ? `${selectedAddr.name} — ${selectedAddr.city || selectedAddr.country}`
                    : "Select an IOR address..."
                  }
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search IOR addresses..." className="h-8 text-xs" />
                  <CommandList>
                    <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
                      No matching addresses.
                    </CommandEmpty>
                    <CommandGroup>
                      {mergedAddresses.map((addr) => (
                        <CommandItem
                          key={addr.id}
                          value={`${addr.name} ${addr.city} ${addr.address} ${addr.country}`}
                          onSelect={() => handleSelect(addr)}
                          className="text-xs"
                        >
                          <Check
                            className={`mr-2 h-3 w-3 ${selectedId === addr.id ? "opacity-100" : "opacity-0"}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-medium">{addr.name}</p>
                              <Badge
                                variant="outline"
                                className={`shrink-0 text-[9px] py-0 ${
                                  addr.source === "xindus"
                                    ? "border-teal-300 text-teal-600 dark:border-teal-700 dark:text-teal-400"
                                    : "border-violet-300 text-violet-600 dark:border-violet-700 dark:text-violet-400"
                                }`}
                              >
                                {addr.source === "xindus" ? "Xindus" : "History"}
                              </Badge>
                            </div>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {[addr.address, addr.city, addr.state, addr.country].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected address preview */}
            {selectedAddr && (
              <div className="mt-2 rounded-md border border-teal-200/50 bg-teal-50/30 p-2.5 dark:border-teal-900/30 dark:bg-teal-950/20">
                <div className="space-y-0">
                  <p className="text-xs font-semibold text-foreground">{selectedAddr.name}</p>
                  {selectedAddr.address && <p className="text-[11px] text-foreground/70">{selectedAddr.address}</p>}
                  <p className="text-[11px] text-foreground/70">
                    {[selectedAddr.city, selectedAddr.state].filter(Boolean).join(", ")}
                    {selectedAddr.zip ? ` ${selectedAddr.zip}` : ""}
                  </p>
                  {selectedAddr.country && <p className="text-[11px] text-foreground/60">{selectedAddr.country}</p>}
                  {(selectedAddr.phone || selectedAddr.email) && (
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground">
                      {selectedAddr.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" /> {selectedAddr.phone}
                        </span>
                      )}
                      {selectedAddr.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5" /> {selectedAddr.email}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editable IOR address form (always shown for manual edits) */}
      <AddressForm
        label="Importer of Record"
        address={iorAddress}
        basePath="ior_address"
        confidence={confidence}
        sellerDefault={sellerDefault}
        onCorrections={onCorrections}
        addressType="ior"
        previousAddresses={sellerHistory?.ior_addresses}
      />
    </div>
  );
}
