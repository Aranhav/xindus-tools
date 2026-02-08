"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type {
  SellerProfile,
  SellerMatchResult,
  CorrectionItem,
  ShipmentAddress,
} from "@/types/agent";

/* ── Props ────────────────────────────────────────────────── */

interface SellerMatchProps {
  /** Shipper name extracted from the document */
  shipperName?: string;
  /** Currently matched seller (from backend) */
  currentSeller?: SellerProfile | null;
  /** Whether the draft is editable */
  isActionable: boolean;
  /** Search function from hook */
  onSearch: (name: string) => Promise<SellerMatchResult | null>;
  /** Link seller to draft */
  onLink: (sellerId: string) => Promise<unknown>;
  /** Apply defaults as corrections */
  onApplyDefaults: (corrections: CorrectionItem[]) => void;
  /** Loading state */
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [matchResult, setMatchResult] = useState<SellerMatchResult | null>(null);
  const [autoSearched, setAutoSearched] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Auto-search when component mounts with shipper name and no current seller
  useEffect(() => {
    if (shipperName && !currentSeller && !autoSearched) {
      setAutoSearched(true);
      doSearch(shipperName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipperName, currentSeller]);

  const doSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;
      setSearching(true);
      try {
        const result = await onSearch(query.trim());
        setMatchResult(result);
        if (result) setExpanded(true);
      } finally {
        setSearching(false);
      }
    },
    [onSearch],
  );

  const handleManualSearch = () => {
    if (searchQuery.trim()) {
      doSearch(searchQuery);
    }
  };

  const handleLink = async () => {
    if (!matchResult) return;
    await onLink(matchResult.seller.id);
    setShowSearch(false);
    setMatchResult(null);
  };

  const buildDefaultCorrections = (seller: SellerProfile): CorrectionItem[] => {
    const corrections: CorrectionItem[] = [];
    const defaults = seller.defaults || {};

    // Destination clearance from defaults
    if (defaults.destination_clearance_type) {
      corrections.push({
        field_path: "destination_clearance_type",
        old_value: null,
        new_value: defaults.destination_clearance_type,
      });
    }

    // Terms of trade
    if (defaults.terms_of_trade) {
      corrections.push({
        field_path: "terms_of_trade",
        old_value: null,
        new_value: defaults.terms_of_trade,
      });
    }

    // Billing address
    if (defaults.billing_address && typeof defaults.billing_address === "object") {
      const addr = defaults.billing_address as ShipmentAddress;
      if (addr.name) {
        corrections.push({
          field_path: "billing_address",
          old_value: null,
          new_value: addr,
        });
      }
    }

    // IOR address
    if (defaults.ior_address && typeof defaults.ior_address === "object") {
      const addr = defaults.ior_address as ShipmentAddress;
      if (addr.name) {
        corrections.push({
          field_path: "ior_address",
          old_value: null,
          new_value: addr,
        });
      }
    }

    return corrections;
  };

  // If seller is already matched
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
              <Badge variant="outline" className="text-[10px] font-normal text-emerald-700 dark:text-emerald-300">
                {currentSeller.shipment_count} past shipment{currentSeller.shipment_count !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
          {defaultCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {defaultCount} default{defaultCount !== 1 ? "s" : ""}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        {expanded && defaultCount > 0 && isActionable && (
          <div className="border-t border-emerald-200/60 px-4 py-2.5 dark:border-emerald-900/40">
            <p className="mb-2 text-[11px] text-muted-foreground">
              Apply learned defaults from past shipments:
            </p>
            <div className="space-y-1.5">
              {defaults.destination_clearance_type ? (
                <DefaultRow
                  label="Dest. Clearance"
                  value={String(defaults.destination_clearance_type)}
                />
              ) : null}
              {defaults.terms_of_trade ? (
                <DefaultRow
                  label="Terms of Trade"
                  value={String(defaults.terms_of_trade)}
                />
              ) : null}
              {defaults.billing_address ? (
                <DefaultRow
                  label="Billing Address"
                  value={formatAddrShort(defaults.billing_address as ShipmentAddress)}
                />
              ) : null}
              {defaults.ior_address ? (
                <DefaultRow
                  label="IOR Address"
                  value={formatAddrShort(defaults.ior_address as ShipmentAddress)}
                />
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
          </div>
        )}
      </div>
    );
  }

  // No seller matched yet
  return (
    <div className="rounded-lg border border-amber-200/60 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">No seller matched</p>
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
              setSearchQuery(shipperName || "");
            }}
          >
            <Search className="h-3 w-3" />
            Search
          </Button>
        )}
      </div>

      {/* Search input */}
      {showSearch && (
        <div className="border-t border-amber-200/60 px-4 py-2.5 dark:border-amber-900/40">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company name..."
                className="h-7 pl-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualSearch();
                }}
                autoFocus
              />
            </div>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleManualSearch}
              disabled={searching || !searchQuery.trim()}
            >
              {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Match"}
            </Button>
          </div>

          {/* Search result */}
          {searching && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching sellers...
            </div>
          )}

          {matchResult && !searching && (
            <div className="mt-2 rounded-md border bg-background p-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{matchResult.seller.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{matchResult.seller.shipment_count} shipments</span>
                    {matchResult.confidence > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          matchResult.confidence >= 0.8
                            ? "border-emerald-300 text-emerald-700"
                            : matchResult.confidence >= 0.5
                              ? "border-amber-300 text-amber-700"
                              : "border-red-300 text-red-700"
                        }`}
                      >
                        {Math.round(matchResult.confidence * 100)}% match
                      </Badge>
                    )}
                    {matchResult.match_reason && (
                      <span>{matchResult.match_reason}</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={handleLink}
                  disabled={loading}
                >
                  <ArrowRight className="h-3 w-3" />
                  Link
                </Button>
              </div>
            </div>
          )}

          {matchResult === null && autoSearched && !searching && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              No matching seller found. Try a different search term.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helper sub-components ────────────────────────────────── */

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
