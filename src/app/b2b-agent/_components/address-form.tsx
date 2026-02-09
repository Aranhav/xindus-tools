"use client";

import { useState } from "react";
import { Pencil, Sparkles, Phone, Mail, Check, X, Building2, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShipmentAddress, CorrectionItem } from "@/types/agent";

export const ADDRESS_FIELDS = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "ZIP" },
  { key: "country", label: "Country" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
] as const;

interface AddressFormProps {
  label: string;
  address: ShipmentAddress;
  basePath: string;
  confidence?: Record<string, number>;
  sellerDefault?: ShipmentAddress;
  onCorrections: (corrections: CorrectionItem[]) => void;
  icon?: "billing" | "ior";
}

export function AddressForm({
  label,
  address,
  basePath,
  confidence,
  sellerDefault,
  onCorrections,
  icon,
}: AddressFormProps) {
  const [editing, setEditing] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const addrRecord = address as unknown as Record<string, string>;
  const defaultRecord = sellerDefault as unknown as Record<string, string> | undefined;

  const hasDiff =
    defaultRecord &&
    ADDRESS_FIELDS.some((f) => {
      const cur = addrRecord[f.key] || "";
      const def = defaultRecord[f.key] || "";
      return def && def !== cur;
    });

  /* ── Aggregate confidence ── */
  const confValues = confidence
    ? ADDRESS_FIELDS.map((f) => confidence[f.key]).filter((v): v is number => v != null && v > 0)
    : [];
  const avgConf = confValues.length > 0
    ? confValues.reduce((a, b) => a + b, 0) / confValues.length
    : null;

  const startEdit = () => {
    const vals: Record<string, string> = {};
    for (const f of ADDRESS_FIELDS) {
      vals[f.key] = addrRecord[f.key] || "";
    }
    setFormValues(vals);
    setEditing(true);
  };

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

  const IconComponent = icon === "ior" ? FileCheck : Building2;
  const iconBg = icon === "ior" ? "bg-emerald-500/10" : "bg-blue-500/10";
  const iconColor = icon === "ior" ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400";

  const name = addrRecord.name || "";
  const street = addrRecord.address || "";
  const cityStateZip = [addrRecord.city, addrRecord.state].filter(Boolean).join(", ")
    + (addrRecord.zip ? ` ${addrRecord.zip}` : "");
  const country = addrRecord.country || "";
  const phone = addrRecord.phone || "";
  const email = addrRecord.email || "";

  return (
    <div className={`rounded-xl border bg-card p-4 transition-all ${editing ? "ring-1 ring-primary/20 border-primary/30" : ""}`}>
      {/* ── Header ── */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${iconBg}`}>
            <IconComponent className={`h-3.5 w-3.5 ${iconColor}`} />
          </div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {/* Aggregate confidence pill */}
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
          {editing ? (
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
          )}
        </div>
      </div>

      {editing ? (
        /* ── Edit mode ── */
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {ADDRESS_FIELDS.map((f) => (
            <div key={f.key} className={f.key === "address" ? "col-span-2" : ""}>
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
        /* ── View mode: natural address block ── */
        <div className="space-y-0.5 pl-[34px]">
          {name && <p className="text-sm font-semibold text-foreground">{name}</p>}
          {street && <p className="text-[13px] leading-snug text-foreground/80">{street}</p>}
          {cityStateZip && <p className="text-[13px] leading-snug text-foreground/80">{cityStateZip}</p>}
          {country && <p className="text-[13px] leading-snug text-foreground/60">{country}</p>}
          {(phone || email) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs text-muted-foreground">
              {phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  {phone}
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
          {!name && !street && !country && (
            <p className="text-xs italic text-muted-foreground/50">No address data</p>
          )}
        </div>
      )}

      {/* ── Seller defaults suggestion ── */}
      {hasDiff && !editing && (
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
    </div>
  );
}
