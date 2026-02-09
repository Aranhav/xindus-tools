"use client";

import { useState, useEffect, useCallback } from "react";
import {
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
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerCombobox } from "./customer-combobox";
import type {
  SellerProfile,
  SellerMatchResult,
  CorrectionItem,
  XindusCustomer,
} from "@/types/agent";

/* ── Props ───────────────────────────────────────────────── */

interface SellerMatchProps {
  shipperName?: string;
  currentSeller?: SellerProfile | null;
  isActionable: boolean;
  onSearch: (name: string) => Promise<SellerMatchResult | null>;
  onLink: (sellerId: string) => Promise<unknown>;
  onApplyCorrections: (corrections: CorrectionItem[]) => void;
  loading: boolean;
}

/* ── Fetch customer profile by name ──────────────────────── */

async function fetchCustomerByName(name: string): Promise<XindusCustomer | null> {
  try {
    const res = await fetch(
      `/api/b2b-agent/customers/search?q=${encodeURIComponent(name)}`,
    );
    if (!res.ok) return null;
    const data: { customers: XindusCustomer[] } = await res.json();
    return data.customers[0] ?? null;
  } catch {
    return null;
  }
}

/* ── Component ────────────────────────────────────────────── */

export function SellerMatch({
  shipperName,
  currentSeller,
  isActionable,
  onSearch,
  onLink,
  onApplyCorrections,
  loading,
}: SellerMatchProps) {
  const [autoMatch, setAutoMatch] = useState<SellerMatchResult | null>(null);
  const [autoSearched, setAutoSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [changingSeller, setChangingSeller] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState<XindusCustomer | null>(null);
  const [noMatchName, setNoMatchName] = useState<string | null>(null);

  // Auto-search Python backend on mount
  useEffect(() => {
    if (shipperName && !currentSeller && !autoSearched) {
      setAutoSearched(true);
      setSearching(true);
      onSearch(shipperName.trim())
        .then((r) => { if (r) setAutoMatch(r); })
        .finally(() => setSearching(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipperName, currentSeller]);

  // Auto-fetch enriched Xindus profile when seller is linked
  useEffect(() => {
    if (currentSeller && !linkedCustomer) {
      fetchCustomerByName(currentSeller.name).then((c) => {
        if (c) setLinkedCustomer(c);
      });
    }
  }, [currentSeller, linkedCustomer]);

  // Reset when seller changes (e.g. different draft opened)
  useEffect(() => {
    setLinkedCustomer(null);
    setChangingSeller(false);
    setNoMatchName(null);
  }, [currentSeller?.id]);

  /* ── Handlers ───────────────────────────────────────────── */

  /** User selects from type-ahead: find Python seller, then link with correct ID */
  const handleSelectCustomer = useCallback(
    async (customer: XindusCustomer) => {
      setNoMatchName(null);
      setAutoMatch(null);
      setLinking(true);
      try {
        // Always apply shipper address from Xindus customer
        const shipperCorrections: CorrectionItem[] = [];
        if (customer.company)
          shipperCorrections.push({ field_path: "shipper_address.name", old_value: null, new_value: customer.company });
        if (customer.email)
          shipperCorrections.push({ field_path: "shipper_address.email", old_value: null, new_value: customer.email });
        if (customer.phone)
          shipperCorrections.push({ field_path: "shipper_address.phone", old_value: null, new_value: customer.phone });

        // Search Python backend by company name to get the correct seller UUID
        const match = await onSearch(customer.company);
        if (match) {
          await onLink(match.seller.id);
        }

        // Apply shipper corrections regardless of match
        if (shipperCorrections.length > 0) onApplyCorrections(shipperCorrections);
        setLinkedCustomer(customer);
        setChangingSeller(false);
      } finally {
        setLinking(false);
      }
    },
    [onSearch, onLink, onApplyCorrections],
  );

  const handleLinkAutoMatch = useCallback(async () => {
    if (!autoMatch) return;
    await onLink(autoMatch.seller.id);
    setAutoMatch(null);
  }, [autoMatch, onLink]);

  const isBusy = loading || linking;

  /* ── LINKED STATE ───────────────────────────────────────── */

  if ((currentSeller || linkedCustomer) && !changingSeller) {
    const isFullyLinked = !!currentSeller;
    const displayName = currentSeller?.name ?? linkedCustomer?.company ?? "";
    return (
      <div className={`rounded-lg border ${
        isFullyLinked
          ? "border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          : "border-blue-200/60 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/20"
      }`}>
        {/* Header */}
        <div
          className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5"
          onClick={() => setExpanded(!expanded)}
        >
          <UserCheck className={`h-4 w-4 ${isFullyLinked ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium">{displayName}</span>
              {linkedCustomer?.crn_number && (
                <Badge variant="outline" className="text-[10px] font-mono font-normal">
                  {linkedCustomer.crn_number}
                </Badge>
              )}
              {isFullyLinked ? (
                <Badge variant="outline" className="text-[10px] font-normal text-emerald-700 dark:text-emerald-300">
                  {currentSeller.shipment_count} shipment{currentSeller.shipment_count !== 1 ? "s" : ""}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-normal text-blue-700 dark:text-blue-300">
                  Xindus Customer
                </Badge>
              )}
            </div>
          </div>
          {isActionable && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); setChangingSeller(true); }}
            >
              <RefreshCw className="h-3 w-3" />
              Change
            </Button>
          )}
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className={`space-y-3 border-t px-4 py-3 ${
            isFullyLinked ? "border-emerald-200/60 dark:border-emerald-900/40" : "border-blue-200/40 dark:border-blue-900/30"
          }`}>
            {linkedCustomer && <CustomerProfile customer={linkedCustomer} />}

            {!isFullyLinked && (
              <p className="text-[10px] text-muted-foreground">
                Shipper info queued from Xindus. Click Save to apply.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── CHANGING STATE ─────────────────────────────────────── */

  if (changingSeller) {
    const previousName = currentSeller?.name ?? linkedCustomer?.company ?? "";
    return (
      <div className="rounded-lg border border-blue-200/60 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Change seller</p>
            {previousName && <p className="text-[11px] text-blue-600/80">Current: {previousName}</p>}
          </div>
          <Button
            size="sm" variant="ghost"
            className="h-6 gap-1 text-[10px] text-muted-foreground"
            onClick={() => setChangingSeller(false)}
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>
        </div>
        <div className="border-t border-blue-200/40 px-4 py-2.5 dark:border-blue-900/30">
          <CustomerCombobox
            onSelect={handleSelectCustomer}
            initialQuery={previousName}
            placeholder="Type new company name..."
          />
          {linking && <LinkingIndicator />}
          {noMatchName && <NoMatchMessage name={noMatchName} />}
        </div>
      </div>
    );
  }

  /* ── NO SELLER — SEARCH STATE ───────────────────────────── */

  return (
    <div className="rounded-lg border border-amber-200/60 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20">
      {/* Auto-match suggestion from Python backend */}
      {autoMatch && !searching && (
        <div className="flex items-center gap-2.5 border-b border-amber-200/40 px-4 py-2 dark:border-amber-900/30">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium">{autoMatch.seller.name}</span>
              {autoMatch.confidence > 0 && (
                <Badge
                  variant="outline"
                  className={`text-[9px] ${
                    autoMatch.confidence >= 0.8
                      ? "border-emerald-300 text-emerald-700"
                      : autoMatch.confidence >= 0.5
                        ? "border-amber-300 text-amber-700"
                        : "border-red-300 text-red-700"
                  }`}
                >
                  {Math.round(autoMatch.confidence * 100)}% match
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {autoMatch.seller.shipment_count} past shipment{autoMatch.seller.shipment_count !== 1 ? "s" : ""}
              {autoMatch.match_reason && ` · ${autoMatch.match_reason}`}
            </p>
          </div>
          <Button
            size="sm" className="h-6 gap-1 text-[11px]"
            onClick={handleLinkAutoMatch} disabled={isBusy}
          >
            <ArrowRight className="h-3 w-3" />
            Link
          </Button>
        </div>
      )}

      {/* Header + always-visible search */}
      <div className="px-4 py-2.5">
        <div className="mb-2 flex items-center gap-2">
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          ) : (
            <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          )}
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {searching ? "Finding seller..." : "No seller linked"}
          </span>
          {shipperName && !autoMatch && !searching && (
            <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[140px]">
              {shipperName}
            </span>
          )}
        </div>

        {isActionable && (
          <CustomerCombobox
            onSelect={handleSelectCustomer}
            initialQuery={shipperName || ""}
            placeholder="Search by company name..."
          />
        )}

        {linking && <LinkingIndicator />}
        {noMatchName && <NoMatchMessage name={noMatchName} />}
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function CustomerProfile({ customer }: { customer: XindusCustomer }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {customer.contact_name && (
        <ProfileRow icon={User} label="Contact" value={customer.contact_name} />
      )}
      <ProfileRow icon={Mail} label="Email" value={customer.email} />
      <ProfileRow icon={Phone} label="Phone" value={customer.phone} />
      {customer.iec && <ProfileRow icon={Hash} label="IEC" value={customer.iec} />}
      {customer.gstn && <ProfileRow icon={Hash} label="GSTN" value={customer.gstn} />}
      {(customer.city || customer.state) && (
        <ProfileRow
          icon={Building2}
          label="Location"
          value={[customer.city, customer.state].filter(Boolean).join(", ")}
        />
      )}
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="w-14 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate">{value}</span>
    </div>
  );
}

function LinkingIndicator() {
  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      Linking seller...
    </div>
  );
}

function NoMatchMessage({ name }: { name: string }) {
  return (
    <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
      No seller profile found for &ldquo;{name}&rdquo;. The customer exists in Xindus but has no shipment history in the agent yet.
    </p>
  );
}

