"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  UserCheck,
  UserX,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Building2,
  ArrowRight,
  Mail,
  Phone,
  Hash,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCustomerSearch } from "@/hooks/use-customer-search";
import type {
  SellerProfile,
  SellerMatchResult,
  CorrectionItem,
  ShipmentAddress,
  XindusCustomer,
} from "@/types/agent";

/* ── Props ────────────────────────────────────────────────── */

interface SellerMatchProps {
  shipperName?: string;
  currentSeller?: SellerProfile | null;
  isActionable: boolean;
  onSearch: (name: string) => Promise<SellerMatchResult | null>;
  onLink: (sellerId: string) => Promise<unknown>;
  onApplyDefaults: (corrections: CorrectionItem[]) => void;
  loading: boolean;
}

/* ── Component ────────────────────────────────────────────── */

export function SellerMatch({
  shipperName,
  currentSeller,
  isActionable,
  onSearch,
  onLink,
  onApplyDefaults,
  loading,
}: SellerMatchProps) {
  const [matchResult, setMatchResult] = useState<SellerMatchResult | null>(null);
  const [autoSearched, setAutoSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState<XindusCustomer | null>(null);

  // Type-ahead search
  const search = useCustomerSearch(300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-search Python backend when mounted with shipper name
  useEffect(() => {
    if (shipperName && !currentSeller && !autoSearched) {
      setAutoSearched(true);
      setSearching(true);
      onSearch(shipperName.trim())
        .then((result) => {
          setMatchResult(result);
          if (result) setExpanded(true);
        })
        .finally(() => setSearching(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipperName, currentSeller]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        search.setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [search]);

  const handleSelectCustomer = useCallback(
    async (customer: XindusCustomer) => {
      search.setIsOpen(false);
      search.setQuery(customer.company);
      setLinkedCustomer(customer);
      await onLink(String(customer.id));
    },
    [onLink, search],
  );

  const handleLinkFromAutoMatch = useCallback(async () => {
    if (!matchResult) return;
    await onLink(matchResult.seller.id);
    setShowSearch(false);
    setMatchResult(null);
  }, [matchResult, onLink]);

  const buildDefaultCorrections = (seller: SellerProfile): CorrectionItem[] => {
    const corrections: CorrectionItem[] = [];
    const defaults = seller.defaults || {};

    if (defaults.destination_clearance_type) {
      corrections.push({
        field_path: "destination_clearance_type",
        old_value: null,
        new_value: defaults.destination_clearance_type,
      });
    }
    if (defaults.terms_of_trade) {
      corrections.push({
        field_path: "terms_of_trade",
        old_value: null,
        new_value: defaults.terms_of_trade,
      });
    }
    if (defaults.billing_address && typeof defaults.billing_address === "object") {
      const addr = defaults.billing_address as ShipmentAddress;
      if (addr.name) {
        corrections.push({ field_path: "billing_address", old_value: null, new_value: addr });
      }
    }
    if (defaults.ior_address && typeof defaults.ior_address === "object") {
      const addr = defaults.ior_address as ShipmentAddress;
      if (addr.name) {
        corrections.push({ field_path: "ior_address", old_value: null, new_value: addr });
      }
    }
    return corrections;
  };

  /* ── Linked seller view ─────────────────────────────────── */

  if (currentSeller) {
    const defaults = currentSeller.defaults || {};
    const defaultCount = Object.keys(defaults).length;
    return (
      <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div
          className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5"
          onClick={() => setExpanded(!expanded)}
        >
          <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{currentSeller.name}</span>
              {linkedCustomer?.crn_number && (
                <Badge variant="outline" className="text-[10px] font-mono font-normal">
                  {linkedCustomer.crn_number}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] font-normal text-emerald-700 dark:text-emerald-300">
                {currentSeller.shipment_count} shipment{currentSeller.shipment_count !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        {expanded && (
          <div className="border-t border-emerald-200/60 px-4 py-2.5 dark:border-emerald-900/40">
            {/* Enriched profile from Xindus */}
            {linkedCustomer && (
              <div className="mb-2.5 space-y-1">
                {linkedCustomer.contact_name && (
                  <ProfileRow icon={User} label="Contact" value={linkedCustomer.contact_name} />
                )}
                <ProfileRow icon={Mail} label="Email" value={linkedCustomer.email} />
                <ProfileRow icon={Phone} label="Phone" value={linkedCustomer.phone} />
                {linkedCustomer.iec && (
                  <ProfileRow icon={Hash} label="IEC" value={linkedCustomer.iec} />
                )}
                {linkedCustomer.gstn && (
                  <ProfileRow icon={Hash} label="GSTN" value={linkedCustomer.gstn} />
                )}
                {(linkedCustomer.city || linkedCustomer.state) && (
                  <ProfileRow
                    icon={Building2}
                    label="Location"
                    value={[linkedCustomer.city, linkedCustomer.state].filter(Boolean).join(", ")}
                  />
                )}
              </div>
            )}

            {/* Learned defaults section */}
            {defaultCount > 0 && isActionable && (
              <>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Apply learned defaults from past shipments:
                </p>
                <div className="space-y-1.5">
                  {defaults.destination_clearance_type ? (
                    <DefaultRow label="Dest. Clearance" value={String(defaults.destination_clearance_type)} />
                  ) : null}
                  {defaults.terms_of_trade ? (
                    <DefaultRow label="Terms of Trade" value={String(defaults.terms_of_trade)} />
                  ) : null}
                  {defaults.billing_address ? (
                    <DefaultRow label="Billing Address" value={formatAddrShort(defaults.billing_address as ShipmentAddress)} />
                  ) : null}
                  {defaults.ior_address ? (
                    <DefaultRow label="IOR Address" value={formatAddrShort(defaults.ior_address as ShipmentAddress)} />
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2.5 w-full gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
                  onClick={() => onApplyDefaults(buildDefaultCorrections(currentSeller))}
                  disabled={loading}
                >
                  <Sparkles className="h-3 w-3" />
                  Apply All Defaults
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── No seller matched — search UI ──────────────────────── */

  return (
    <div className="rounded-lg border border-amber-200/60 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20">
      {/* Auto-match result from Python backend */}
      {matchResult && !searching && (
        <div className="flex items-center gap-2 border-b border-amber-200/60 px-4 py-2.5 dark:border-amber-900/40">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">{matchResult.seller.name}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>{matchResult.seller.shipment_count} shipments</span>
              {matchResult.confidence > 0 && (
                <Badge
                  variant="outline"
                  className={`text-[9px] ${
                    matchResult.confidence >= 0.8
                      ? "border-emerald-300 text-emerald-700"
                      : matchResult.confidence >= 0.5
                        ? "border-amber-300 text-amber-700"
                        : "border-red-300 text-red-700"
                  }`}
                >
                  {Math.round(matchResult.confidence * 100)}%
                </Badge>
              )}
            </div>
          </div>
          <Button
            size="sm"
            className="h-6 gap-1 text-[11px]"
            onClick={handleLinkFromAutoMatch}
            disabled={loading}
          >
            <ArrowRight className="h-3 w-3" />
            Link
          </Button>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        {searching ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
        ) : (
          <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {searching ? "Searching sellers..." : "No seller linked"}
          </p>
          {shipperName && !matchResult && !searching && (
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70">
              Shipper: {shipperName}
            </p>
          )}
        </div>
        {!showSearch && isActionable && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-300"
            onClick={() => {
              setShowSearch(true);
              search.setQuery(shipperName || "");
            }}
          >
            <Search className="h-3 w-3" />
            Search
          </Button>
        )}
      </div>

      {/* Type-ahead search input */}
      {showSearch && (
        <div
          ref={dropdownRef}
          className="relative border-t border-amber-200/60 px-4 py-2.5 dark:border-amber-900/40"
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search.query}
              onChange={(e) => search.setQuery(e.target.value)}
              placeholder="Type company name..."
              className="h-7 pl-7 pr-8 text-xs"
              autoFocus
              onFocus={() => {
                if (search.results.length > 0) search.setIsOpen(true);
              }}
            />
            {search.loading && (
              <Loader2 className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Dropdown suggestions */}
          {search.isOpen && search.results.length > 0 && (
            <div className="absolute left-4 right-4 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
              {search.results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-accent"
                  onClick={() => handleSelectCustomer(c)}
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.company}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {c.crn_number && <span className="font-mono">{c.crn_number}</span>}
                      {c.city && <span>{c.city}</span>}
                      {c.shipment_count != null && c.shipment_count > 0 && (
                        <span>{c.shipment_count} shipments</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {search.query.length >= 2 && !search.loading && search.results.length === 0 && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              No matching customers found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helper sub-components ────────────────────────────────── */

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate">{value}</span>
    </div>
  );
}

function DefaultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{value}</span>
    </div>
  );
}

function formatAddrShort(addr: ShipmentAddress): string {
  const parts = [addr.name, addr.city, addr.country].filter(Boolean);
  return parts.join(", ") || "Address set";
}
