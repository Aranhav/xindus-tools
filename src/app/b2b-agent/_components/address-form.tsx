"use client";

import { useState, useMemo, useCallback } from "react";
import { Pencil, Sparkles, Phone, Mail, Check, X, AlertTriangle, CheckCircle2, History, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ADDRESS_FIELDS, ADDRESS_TYPE_CONFIG, type AddressType } from "./address-field-config";
import { AddressAutocomplete, type AutocompleteSelection } from "./address-autocomplete";
import type { ShipmentAddress, CorrectionItem } from "@/types/agent";

// Re-export for backwards compat (box-receiver-section imports ADDRESS_FIELDS from here)
export { ADDRESS_FIELDS } from "./address-field-config";

interface AddressFormProps {
  label: string;
  address: ShipmentAddress;
  basePath: string;
  confidence?: Record<string, number>;
  sellerDefault?: ShipmentAddress;
  onCorrections: (corrections: CorrectionItem[]) => void;
  addressType: AddressType;
  previousAddresses?: ShipmentAddress[];
  readOnly?: boolean;
  boxLabel?: string;
  boxTooltip?: string;
  onDelete?: () => void;
}

export function AddressForm({
  label,
  address,
  basePath,
  confidence,
  sellerDefault,
  onCorrections,
  addressType,
  previousAddresses,
  readOnly,
  boxLabel,
  boxTooltip,
  onDelete,
}: AddressFormProps) {
  const [editing, setEditing] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const config = ADDRESS_TYPE_CONFIG[addressType];
  const IconComponent = config.icon;

  const addrRecord = address as unknown as Record<string, string>;
  const defaultRecord = sellerDefault as unknown as Record<string, string> | undefined;

  const hasDiff =
    defaultRecord &&
    ADDRESS_FIELDS.some((f) => {
      const cur = addrRecord[f.key] || "";
      const def = defaultRecord[f.key] || "";
      return def && def !== cur;
    });

  /* Aggregate confidence */
  const confValues = confidence
    ? ADDRESS_FIELDS.map((f) => confidence[f.key]).filter((v): v is number => v != null && v > 0)
    : [];
  const avgConf = confValues.length > 0
    ? confValues.reduce((a, b) => a + b, 0) / confValues.length
    : null;

  const isUSCountry = useMemo(() => {
    const raw = (formValues.country || addrRecord.country || "").toLowerCase().trim();
    return !raw || raw === "us" || raw === "usa" || raw === "united states" || raw === "united states of america";
  }, [formValues.country, addrRecord.country]);

  const handleAutocompleteSelect = useCallback(
    (fields: AutocompleteSelection) => {
      setFormValues((prev) => ({
        ...prev,
        address: fields.address,
        city: fields.city,
        state: fields.state,
        zip: fields.zip,
        country: fields.country,
      }));
    },
    [],
  );

  const startEdit = () => {
    if (readOnly) return;
    const vals: Record<string, string> = {};
    for (const f of ADDRESS_FIELDS) {
      vals[f.key] = addrRecord[f.key] || "";
    }
    setFormValues(vals);
    setEditing(true);
  };

  const applyPreviousAddress = (prev: ShipmentAddress) => {
    const prevRecord = prev as unknown as Record<string, string>;
    const vals: Record<string, string> = {};
    for (const f of ADDRESS_FIELDS) {
      vals[f.key] = prevRecord[f.key] || "";
    }
    setFormValues(vals);
    if (!editing) setEditing(true);
  };

  const prevAddresses = (previousAddresses ?? []).filter((pa) => {
    const pr = pa as unknown as Record<string, string>;
    return pr.name && pr.name.toLowerCase() !== (addrRecord.name || "").toLowerCase();
  });

  const applyDefaults = () => {
    if (!defaultRecord) return;
    const vals: Record<string, string> = {};
    for (const f of ADDRESS_FIELDS) {
      const def = defaultRecord[f.key] || "";
      vals[f.key] = def || formValues[f.key] || addrRecord[f.key] || "";
    }
    setFormValues(vals);
    if (!editing) setEditing(true);
  };

  const saveEdit = () => {
    const corrections: CorrectionItem[] = [];
    for (const f of ADDRESS_FIELDS) {
      const oldVal = addrRecord[f.key] || "";
      const newVal = formValues[f.key] || "";
      if (oldVal !== newVal) {
        corrections.push({
          field_path: `${basePath}.${f.key}`,
          old_value: oldVal,
          new_value: newVal,
        });
      }
    }
    if (corrections.length > 0) {
      onCorrections(corrections);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormValues({});
  };

  /* View-mode derived values */
  const name = addrRecord.name || "";
  const contactName = addrRecord.contact_name || "";
  const street = addrRecord.address || "";
  const cityStateZip = [
    addrRecord.city,
    addrRecord.district,
    addrRecord.state,
  ].filter(Boolean).join(", ") + (addrRecord.zip ? ` ${addrRecord.zip}` : "");
  const country = addrRecord.country || "";
  const phone = addrRecord.phone || "";
  const email = addrRecord.email || "";
  const contactPhone = addrRecord.contact_phone || "";
  const extension = addrRecord.extension_number || "";
  const eori = addrRecord.eori_number || "";
  const hasAddress = name || street || country;

  return (
    <div className={`rounded-lg border bg-card transition-all ${editing ? `ring-1 ${config.ringColor}` : ""}`}>
      {/* Header — compact row */}
      <div className={`flex items-center justify-between px-3 py-2 ${editing ? "" : "border-b border-border/50"}`}>
        <div className="flex items-center gap-2 min-w-0">
          <IconComponent className={`h-3.5 w-3.5 shrink-0 ${config.iconColor}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </span>
          {boxLabel && (
            boxTooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-[10px] shrink-0 cursor-default">{boxLabel}</Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{boxTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Badge variant="secondary" className="text-[10px] shrink-0">{boxLabel}</Badge>
            )
          )}
          {avgConf != null && (
            <div className={`flex items-center gap-0.5 text-[10px] font-medium shrink-0 ${
              avgConf >= 0.85 ? "text-emerald-600 dark:text-emerald-400"
              : avgConf >= 0.65 ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
            }`}>
              {avgConf >= 0.85 ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
              {Math.round(avgConf * 100)}%
            </div>
          )}
          {eori && !editing && (
            <Badge variant="outline" className="gap-0.5 text-[9px] shrink-0 py-0">
              <Shield className="h-2 w-2" /> EORI: {eori}
            </Badge>
          )}
        </div>
        {!readOnly && (
          editing ? (
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={cancelEdit}>
                <X className="h-3 w-3" />
              </Button>
              <Button size="sm" className="h-5 gap-0.5 px-1.5 text-[10px]" onClick={saveEdit}>
                <Check className="h-2.5 w-2.5" />
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 gap-0.5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={startEdit}
              >
                <Pencil className="h-2.5 w-2.5" />
                Edit
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        )}
      </div>

      {editing ? (
        /* Edit mode: 3-column grid */
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 px-3 pb-3 pt-2">
          {ADDRESS_FIELDS.map((f) => (
            <div key={f.key} className={f.span === "full" ? "col-span-3" : ""}>
              <Label className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</Label>
              {f.key === "address" && isUSCountry ? (
                <AddressAutocomplete
                  value={formValues[f.key] || ""}
                  onChange={(val) =>
                    setFormValues((prev) => ({ ...prev, [f.key]: val }))
                  }
                  onSelect={handleAutocompleteSelect}
                  className="h-7 text-xs"
                />
              ) : (
                <Input
                  value={formValues[f.key] || ""}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  className="h-7 text-xs"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* View mode: compact 2-column layout */
        <div className="px-3 py-2">
          {hasAddress ? (
            <div className="flex gap-6">
              {/* Left: address block */}
              <div className="min-w-0 flex-1 space-y-0">
                {name && <p className="text-sm font-semibold text-foreground leading-tight">{name}</p>}
                {contactName && (
                  <p className="text-xs text-foreground/60 leading-snug">c/o {contactName}</p>
                )}
                {street && <p className="text-xs text-foreground/70 leading-snug">{street}</p>}
                {cityStateZip && <p className="text-xs text-foreground/70 leading-snug">{cityStateZip}</p>}
                {country && <p className="text-xs text-foreground/60 leading-snug">{country}</p>}
              </div>
              {/* Right: contact info */}
              {(phone || email || contactPhone) && (
                <div className="shrink-0 space-y-0.5 text-[11px] text-muted-foreground text-right">
                  {phone && (
                    <p className="flex items-center justify-end gap-1">
                      <Phone className="h-2.5 w-2.5" />
                      {phone}{extension ? ` x${extension}` : ""}
                    </p>
                  )}
                  {contactPhone && contactPhone !== phone && (
                    <p className="flex items-center justify-end gap-1">
                      <Phone className="h-2.5 w-2.5" />
                      {contactPhone}
                    </p>
                  )}
                  {email && (
                    <p className="flex items-center justify-end gap-1">
                      <Mail className="h-2.5 w-2.5" />
                      <span className="truncate max-w-[220px]">{email}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground/50">No address data</p>
          )}
        </div>
      )}

      {/* Seller defaults suggestion */}
      {hasDiff && !editing && !readOnly && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/[0.03] px-2.5 py-1.5">
          <Sparkles className="h-3 w-3 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
            <span className="font-medium text-primary">Saved defaults: </span>
            {[defaultRecord?.name, defaultRecord?.city, defaultRecord?.country].filter(Boolean).join(", ")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-5 shrink-0 border-primary/30 px-1.5 text-[10px] text-primary hover:bg-primary/10"
            onClick={applyDefaults}
          >
            Apply
          </Button>
        </div>
      )}

      {/* Previous addresses */}
      {prevAddresses.length > 0 && !editing && !readOnly && (
        <div className="mx-3 mb-2 rounded-md border border-primary/15 bg-primary/[0.02] p-2">
          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium text-primary">
            <History className="h-3 w-3" />
            Previous shipments
          </div>
          <div className="space-y-1">
            {prevAddresses.map((pa, i) => {
              const pr = pa as unknown as Record<string, string>;
              return (
                <button
                  key={i}
                  type="button"
                  className="flex w-full items-center justify-between rounded border border-primary/10 bg-background px-2 py-1 text-left text-[11px] transition-colors hover:border-primary/25 hover:bg-primary/5"
                  onClick={() => applyPreviousAddress(pa)}
                >
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{pr.name}</span>
                    {pr.city && <span className="text-muted-foreground">, {pr.city}</span>}
                    {pr.country && <span className="text-muted-foreground">, {pr.country}</span>}
                  </span>
                  <span className="ml-2 shrink-0 text-[10px] text-primary">Use</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
