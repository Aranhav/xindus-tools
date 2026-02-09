"use client";

import { Pencil, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ── Option constants ─────────────────────────────────────── */

export const PURPOSE_OPTIONS = ["Sold", "Sample", "Gift", "Not Sold", "Personal Effects", "Return and Repair"];
export const TERMS_OPTIONS = ["DDP", "DDU", "DAP", "CIF"];
export const DEST_CLEARANCE_OPTIONS = ["Formal", "Informal"];
export const TAX_OPTIONS = ["GST", "LUT"];
export const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "AED", "SGD", "JPY", "CNY"];
export const MARKETPLACE_OPTIONS = ["AMAZON", "AMAZON_FBA", "ETSY", "ETSY_USA", "EBAY", "WALMART", "WALMART_WFS", "FAIRE", "SHOPIFY", "OTHER", "NONE"];
export const COUNTRY_OPTIONS = ["US", "GB", "AU", "AE", "JP", "DE", "FR", "CA"];

/* ── Section header ───────────────────────────────────────── */

export function SectionHeader({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

/* ── Inline editable field ────────────────────────────────── */

export function EditableField({
  label,
  value,
  fieldPath,
  editingField,
  editValue,
  onStartEdit,
  onConfirm,
  onCancel,
  onEditValueChange,
  sellerDefault,
  type = "text",
}: {
  label: string;
  value: string;
  fieldPath: string;
  editingField: string | null;
  editValue: string;
  onStartEdit: (path: string, val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onEditValueChange: (val: string) => void;
  sellerDefault?: string;
  type?: string;
}) {
  const isEditing = editingField === fieldPath;
  const showDefault = sellerDefault && sellerDefault !== value && !isEditing;

  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="h-7 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm();
              if (e.key === "Escape") onCancel();
            }}
          />
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onConfirm}>
            <Check className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <p
            className="group flex cursor-pointer items-center gap-1 text-sm hover:text-primary"
            onClick={() => onStartEdit(fieldPath, value || "")}
          >
            {value ? (
              <span className="font-medium">{value}</span>
            ) : (
              <span className="italic text-muted-foreground/60">Not set</span>
            )}
            <Pencil className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
          </p>
          {showDefault && (
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary"
              onClick={() => onStartEdit(fieldPath, sellerDefault)}
            >
              <Sparkles className="h-2.5 w-2.5" />
              Default: {sellerDefault}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ── Select field ─────────────────────────────────────────── */

export function SelectField({
  label,
  value,
  fieldPath,
  options,
  onChanged,
  sellerDefault,
}: {
  label: string;
  value: string;
  fieldPath: string;
  options: string[];
  onChanged: (path: string, oldVal: unknown, newVal: string) => void;
  sellerDefault?: string;
}) {
  const safeOptions = options.filter(Boolean);
  const showDefault = sellerDefault && sellerDefault !== value;
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select
        value={value || undefined}
        onValueChange={(v) => {
          if (v !== value) onChanged(fieldPath, value, v);
        }}
      >
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {safeOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showDefault && (
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary"
          onClick={() => onChanged(fieldPath, value, sellerDefault)}
        >
          <Sparkles className="h-2.5 w-2.5" />
          Default: {sellerDefault}
        </button>
      )}
    </div>
  );
}

/* ── Toggle field ─────────────────────────────────────────── */

export function ToggleField({
  label,
  value,
  fieldPath,
  onChanged,
}: {
  label: string;
  value: boolean;
  fieldPath: string;
  onChanged: (path: string, oldVal: unknown, newVal: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-xs">{label}</span>
      <Switch
        checked={value}
        onCheckedChange={(v) => {
          if (v !== value) onChanged(fieldPath, value, v);
        }}
        className="scale-90"
      />
    </div>
  );
}

/* ── Summary stat ─────────────────────────────────────────── */

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value || "---"}</p>
    </div>
  );
}
