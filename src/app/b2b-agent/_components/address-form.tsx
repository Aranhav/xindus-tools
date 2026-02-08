"use client";

import { useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfidenceBadge } from "@/components/confidence-badge";
import type { ShipmentAddress, CorrectionItem } from "@/types/agent";

const ADDRESS_FIELDS = [
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
}

export function AddressForm({
  label,
  address,
  basePath,
  confidence,
  sellerDefault,
  onCorrections,
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

  const startEdit = () => {
    // Populate form with current values
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

  return (
    <div className="rounded-lg border p-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h4>
        <div className="flex items-center gap-1.5">
          {hasDiff && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs text-primary/70 hover:text-primary"
              onClick={applyDefaults}
            >
              <Sparkles className="h-3 w-3" />
              Use default
            </Button>
          )}
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={startEdit}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        /* ── Edit mode: 2-col grid of inputs ──────────────── */
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {ADDRESS_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-0.5 block text-[10px] text-muted-foreground">
                  {f.label}
                </label>
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
          <div className="flex justify-end gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={saveEdit}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        /* ── View mode: compact label + value list ────────── */
        <div className="space-y-1">
          {ADDRESS_FIELDS.map((f) => {
            const val = addrRecord[f.key] || "";
            const fieldConf = confidence?.[f.key];
            if (!val && !fieldConf) return null; // skip empty fields in view mode
            return (
              <div key={f.key} className="flex items-center gap-2 text-xs">
                <span className="w-12 shrink-0 text-muted-foreground">{f.label}</span>
                <span className="min-w-0 flex-1 truncate">{val || "\u2014"}</span>
                {fieldConf != null && fieldConf > 0 && <ConfidenceBadge value={fieldConf} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
