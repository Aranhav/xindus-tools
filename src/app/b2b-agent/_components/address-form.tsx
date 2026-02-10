"use client";

import { useState } from "react";
import { Pencil, Sparkles, Phone, Mail, Check, X, AlertTriangle, CheckCircle2, History, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ADDRESS_FIELDS, ADDRESS_TYPE_CONFIG, type AddressType } from "./address-field-config";
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
  const cityParts = [addrRecord.city, addrRecord.district].filter(Boolean);
  const cityLine = cityParts.join(", ") + (addrRecord.state ? `, ${addrRecord.state}` : "") + (addrRecord.zip ? ` ${addrRecord.zip}` : "");
  const country = addrRecord.country || "";
  const phone = addrRecord.phone || "";
  const email = addrRecord.email || "";
  const contactPhone = addrRecord.contact_phone || "";
  const extension = addrRecord.extension_number || "";
  const eori = addrRecord.eori_number || "";

  return (
    <div className={`rounded-xl border bg-card p-4 transition-all ${editing ? `ring-1 ${config.ringColor}` : ""}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${config.iconBg}`}>
            <IconComponent className={`h-3.5 w-3.5 ${config.iconColor}`} />
          </div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </h4>
          {boxLabel && (
            <Badge variant="secondary" className="text-[10px]">{boxLabel}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {avgConf != null && (
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              avgConf >= 0.85 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : avgConf >= 0.65 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}>
              {avgConf >= 0.85 ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {Math.round(avgConf * 100)}%
            </div>
          )}
          {!readOnly && (
            editing ? (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={cancelEdit}>
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={saveEdit}>
                  <Check className="h-3 w-3" />
                  Save
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={startEdit}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            )
          )}
        </div>
      </div>

      {editing ? (
        /* Edit mode: 3-column grid */
        <div className="grid grid-cols-3 gap-x-3 gap-y-2">
          {ADDRESS_FIELDS.map((f) => (
            <div key={f.key} className={f.span === "full" ? "col-span-3" : ""}>
              <Label className="mb-0.5 text-[10px] text-muted-foreground">{f.label}</Label>
              <Input
                value={formValues[f.key] || ""}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                className="h-7 text-xs"
              />
            </div>
          ))}
        </div>
      ) : (
        /* View mode: natural address block */
        <div className="space-y-0.5 pl-[34px]">
          {name && <p className="text-sm font-semibold text-foreground">{name}</p>}
          {contactName && (
            <p className="text-[13px] leading-snug text-foreground/70">
              c/o {contactName}
            </p>
          )}
          {street && <p className="text-[13px] leading-snug text-foreground/80">{street}</p>}
          {cityLine && <p className="text-[13px] leading-snug text-foreground/80">{cityLine}</p>}
          {country && <p className="text-[13px] leading-snug text-foreground/60">{country}</p>}
          {(phone || email || contactPhone) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs text-muted-foreground">
              {phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  {phone}{extension ? ` ext. ${extension}` : ""}
                </span>
              )}
              {contactPhone && contactPhone !== phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  {contactPhone}
                </span>
              )}
              {email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  {email}
                </span>
              )}
            </div>
          )}
          {eori && (
            <div className="pt-1">
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Shield className="h-2.5 w-2.5" />
                EORI: {eori}
              </Badge>
            </div>
          )}
          {!name && !street && !country && (
            <p className="text-xs italic text-muted-foreground/50">No address data</p>
          )}
        </div>
      )}

      {/* Seller defaults suggestion */}
      {hasDiff && !editing && !readOnly && (
        <div className="mt-3 ml-[34px] flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-primary">Saved defaults available</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {[defaultRecord?.name, defaultRecord?.city, defaultRecord?.country].filter(Boolean).join(", ")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-6 shrink-0 border-primary/30 px-2 text-[10px] text-primary hover:bg-primary/10"
            onClick={applyDefaults}
          >
            Apply
          </Button>
        </div>
      )}

      {/* Previous addresses from approved shipments */}
      {prevAddresses.length > 0 && !editing && !readOnly && (
        <div className="mt-3 ml-[34px] rounded-lg border border-primary/20 bg-primary/[0.03] p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-primary">
            <History className="h-3.5 w-3.5" />
            From previous shipments
          </div>
          <div className="space-y-1.5">
            {prevAddresses.map((pa, i) => {
              const pr = pa as unknown as Record<string, string>;
              return (
                <button
                  key={i}
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-primary/15 bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary/30 hover:bg-primary/5"
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
