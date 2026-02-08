"use client";

import { useState, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Pencil,
  Check,
  X,
  User,
  Sparkles,
  Download,
  Plus,
  Trash2,
  ArrowRight,
  Package,
  Receipt,
  MapPin,
  Settings2,
  Truck,
  Scale,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddressForm } from "./address-form";
import { BoxEditor } from "./box-editor";
import { DraftStatusBadge } from "./draft-table";
import { getNestedValue } from "./helpers";
import type {
  DraftDetail,
  CorrectionItem,
  ShipmentAddress,
  ShipmentBox,
  ProductDetail,
  SellerProfile,
} from "@/types/agent";

/* ── Option constants ─────────────────────────────────────── */

const PURPOSE_OPTIONS = ["Sold", "Sample", "Gift", "Not Sold", "Personal Effects", "Return and Repair"];
const TERMS_OPTIONS = ["DDP", "DDU", "DAP", "CIF"];
const ORIGIN_CLEARANCE_OPTIONS = ["Commercial", "CSB IV", "CSB V"];
const DEST_CLEARANCE_OPTIONS = ["Formal", "Informal"];
const TAX_OPTIONS = ["GST", "LUT"];
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "AED", "SGD", "JPY", "CNY"];
const MARKETPLACE_OPTIONS = ["AMAZON_FBA", "WALMART_WFS", "FAIRE", "OTHER", "NONE"];

/* ── Section header ───────────────────────────────────────── */

function SectionHeader({
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

function EditableField({
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

function SelectField({
  label,
  value,
  fieldPath,
  options,
  onChanged,
}: {
  label: string;
  value: string;
  fieldPath: string;
  options: string[];
  onChanged: (path: string, oldVal: unknown, newVal: string) => void;
}) {
  const safeOptions = options.filter(Boolean);
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Select
        value={value || undefined}
        onValueChange={(v) => {
          if (v !== value) onChanged(fieldPath, value, v);
        }}
      >
        <SelectTrigger className="h-7 text-xs">
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
    </div>
  );
}

/* ── Toggle field ─────────────────────────────────────────── */

function ToggleField({
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

/* ── Product row ──────────────────────────────────────────── */

function ProductRow({
  product,
  index,
  onChange,
  onRemove,
}: {
  product: ProductDetail;
  index: number;
  onChange: (i: number, p: ProductDetail) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <tr className="group border-b border-border/40 last:border-0">
      <td className="py-1.5 pr-2">
        <Input
          value={product.product_description}
          onChange={(e) => onChange(index, { ...product, product_description: e.target.value })}
          className="h-7 text-xs"
          placeholder="Product description"
        />
      </td>
      <td className="py-1.5 pr-2">
        <Input
          value={product.hsn_code}
          onChange={(e) => onChange(index, { ...product, hsn_code: e.target.value })}
          className="h-7 font-mono text-xs"
          placeholder="HSN code"
        />
      </td>
      <td className="py-1.5 pr-2">
        <Input
          type="number"
          value={product.value ?? ""}
          onChange={(e) => onChange(index, { ...product, value: Number(e.target.value) || 0 })}
          className="h-7 text-right text-xs"
          placeholder="0"
        />
      </td>
      <td className="py-1.5 text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  );
}

/* ── Summary stat ─────────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value || "---"}</p>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */

interface DraftDetailSheetProps {
  draft: DraftDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCorrect: (draftId: string, corrections: CorrectionItem[]) => void;
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
  loading: boolean;
  sellerProfile?: SellerProfile | null;
}

export function DraftDetailSheet({
  draft,
  open,
  onOpenChange,
  onCorrect,
  onApprove,
  onReject,
  loading,
  sellerProfile,
}: DraftDetailSheetProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingCorrections, setPendingCorrections] = useState<CorrectionItem[]>([]);
  const [localBoxes, setLocalBoxes] = useState<ShipmentBox[] | null>(null);
  const [localProducts, setLocalProducts] = useState<ProductDetail[] | null>(null);

  const data = draft ? draft.corrected_data || draft.shipment_data : null;
  const sellerDefaults = (sellerProfile?.defaults ?? {}) as Record<string, unknown>;
  const isActionable = draft?.status === "pending_review";

  const boxes = localBoxes ?? data?.shipment_boxes ?? [];
  const products = localProducts ?? data?.product_details ?? [];
  const boxesModified = localBoxes !== null;
  const productsModified = localProducts !== null;

  const startEdit = useCallback((fieldPath: string, currentValue: string) => {
    setEditingField(fieldPath);
    setEditValue(currentValue);
  }, []);

  const confirmEdit = useCallback(() => {
    if (!editingField || !data) return;
    const oldValue = getNestedValue(data, editingField);
    if (String(oldValue ?? "") !== editValue) {
      setPendingCorrections((prev) => [
        ...prev,
        { field_path: editingField, old_value: oldValue, new_value: editValue },
      ]);
    }
    setEditingField(null);
  }, [editingField, editValue, data]);

  const cancelEdit = useCallback(() => setEditingField(null), []);

  const addFieldCorrection = useCallback(
    (fieldPath: string, oldVal: unknown, newVal: unknown) => {
      setPendingCorrections((prev) => [
        ...prev,
        { field_path: fieldPath, old_value: oldVal, new_value: newVal },
      ]);
    },
    [],
  );

  const addCorrections = useCallback((corrections: CorrectionItem[]) => {
    setPendingCorrections((prev) => [...prev, ...corrections]);
  }, []);

  const totalPending = useMemo(() => {
    let count = pendingCorrections.length;
    if (boxesModified) count++;
    if (productsModified) count++;
    return count;
  }, [pendingCorrections.length, boxesModified, productsModified]);

  const saveAll = useCallback(() => {
    if (!draft || !data) return;
    const allCorrections = [...pendingCorrections];
    if (localBoxes !== null) {
      allCorrections.push({
        field_path: "shipment_boxes",
        old_value: data.shipment_boxes,
        new_value: localBoxes,
      });
    }
    if (localProducts !== null) {
      allCorrections.push({
        field_path: "product_details",
        old_value: data.product_details,
        new_value: localProducts,
      });
    }
    if (allCorrections.length > 0) {
      onCorrect(draft.id, allCorrections);
    }
    setPendingCorrections([]);
    setLocalBoxes(null);
    setLocalProducts(null);
  }, [draft, data, pendingCorrections, localBoxes, localProducts, onCorrect]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setPendingCorrections([]);
        setEditingField(null);
        setLocalBoxes(null);
        setLocalProducts(null);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  // Reset when draft changes
  const prevDraftId = useMemo(() => draft?.id, [draft?.id]);
  useMemo(() => {
    setLocalBoxes(null);
    setLocalProducts(null);
    setPendingCorrections([]);
  }, [prevDraftId]);

  if (!draft || !data) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="sm:max-w-2xl" />
      </Sheet>
    );
  }

  const fieldProps = {
    editingField,
    editValue,
    onStartEdit: startEdit,
    onConfirm: confirmEdit,
    onCancel: cancelEdit,
    onEditValueChange: setEditValue,
  };

  const totalValue = data.total_amount ?? products.reduce((s, p) => s + (p.value || 0), 0);
  const grossWeight = data.total_gross_weight_kg ?? boxes.reduce((s, b) => s + (b.weight || 0), 0);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-2xl" showCloseButton>
        {/* ── Header ────────────────────────────────────────── */}
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="truncate text-lg">
                  {data.invoice_number ? `INV ${data.invoice_number}` : "Shipment Draft"}
                </SheetTitle>
                <DraftStatusBadge status={draft.status} />
              </div>
              <SheetDescription className="mt-1 text-xs">
                {data.shipper_address?.name && data.receiver_address?.name ? (
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{data.shipper_address.name}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-foreground">{data.receiver_address.name}</span>
                    {data.receiver_address.country && (
                      <Badge variant="outline" className="ml-1 text-[10px] font-normal">
                        {data.receiver_address.country}
                      </Badge>
                    )}
                  </span>
                ) : (
                  "Draft shipment detail view"
                )}
              </SheetDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => window.open(`/api/b2b-agent/drafts/${draft.id}/download`, "_blank")}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Excel
              </Button>
            </div>
          </div>

          {/* Summary stats row */}
          <div className="mt-3 grid grid-cols-4 gap-4 rounded-lg border bg-muted/30 px-4 py-3">
            <Stat label="Total Value" value={totalValue ? `$${Number(totalValue).toLocaleString()}` : "---"} />
            <Stat label="Boxes" value={boxes.length} />
            <Stat label="Gross Weight" value={grossWeight ? `${grossWeight} kg` : "---"} />
            <Stat label="Invoice Date" value={data.invoice_date || "---"} />
          </div>

          {/* Seller banner */}
          {sellerProfile && sellerProfile.shipment_count > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs">
              <User className="h-3 w-3 text-primary" />
              <span className="font-medium">{sellerProfile.name}</span>
              <span className="text-muted-foreground">
                {sellerProfile.shipment_count} past shipment{sellerProfile.shipment_count !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </SheetHeader>

        {/* ── Tabbed content ────────────────────────────────── */}
        <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
          <div className="border-b px-6">
            <TabsList variant="line" className="h-9">
              <TabsTrigger value="overview" className="text-xs">
                <Settings2 className="mr-1 h-3 w-3" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="addresses" className="text-xs">
                <MapPin className="mr-1 h-3 w-3" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="boxes" className="text-xs">
                <Package className="mr-1 h-3 w-3" />
                Boxes ({boxes.length})
              </TabsTrigger>
              <TabsTrigger value="products" className="text-xs">
                <Receipt className="mr-1 h-3 w-3" />
                Customs ({products.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {/* ── Overview tab ──────────────────────────────── */}
            <TabsContent value="overview" className="mt-0 px-6 py-4">
              {/* Shipment Configuration */}
              <SectionHeader icon={Settings2} title="Shipment Configuration" />
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                <SelectField
                  label="Origin Clearance"
                  value={data.origin_clearance_type}
                  fieldPath="origin_clearance_type"
                  options={ORIGIN_CLEARANCE_OPTIONS}
                  onChanged={addFieldCorrection}
                />
                <SelectField
                  label="Dest. Clearance"
                  value={data.destination_clearance_type}
                  fieldPath="destination_clearance_type"
                  options={DEST_CLEARANCE_OPTIONS}
                  onChanged={addFieldCorrection}
                />
                <EditableField
                  label="Shipping Method"
                  value={data.shipping_method}
                  fieldPath="shipping_method"
                  {...fieldProps}
                />
                <SelectField
                  label="Purpose"
                  value={data.purpose_of_booking}
                  fieldPath="purpose_of_booking"
                  options={PURPOSE_OPTIONS}
                  onChanged={addFieldCorrection}
                />
                <SelectField
                  label="Terms of Trade"
                  value={data.terms_of_trade}
                  fieldPath="terms_of_trade"
                  options={TERMS_OPTIONS}
                  onChanged={addFieldCorrection}
                />
                <SelectField
                  label="Tax Type"
                  value={data.tax_type}
                  fieldPath="tax_type"
                  options={TAX_OPTIONS}
                  onChanged={addFieldCorrection}
                />
                <EditableField
                  label="Destination Country"
                  value={data.country}
                  fieldPath="country"
                  {...fieldProps}
                />
                <SelectField
                  label="Marketplace"
                  value={data.marketplace}
                  fieldPath="marketplace"
                  options={MARKETPLACE_OPTIONS}
                  onChanged={addFieldCorrection}
                />
                <EditableField
                  label="Exporter Category"
                  value={data.exporter_category}
                  fieldPath="exporter_category"
                  {...fieldProps}
                />
              </div>

              {/* Toggles */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <ToggleField
                  label="Amazon FBA"
                  value={data.amazon_fba}
                  fieldPath="amazon_fba"
                  onChanged={addFieldCorrection}
                />
                <ToggleField
                  label="Multi-Address"
                  value={data.multi_address_destination_delivery}
                  fieldPath="multi_address_destination_delivery"
                  onChanged={addFieldCorrection}
                />
              </div>

              <Separator className="my-5" />

              {/* Invoice & References */}
              <SectionHeader icon={Receipt} title="Invoice & References" />
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                <EditableField
                  label="Invoice Number"
                  value={data.invoice_number}
                  fieldPath="invoice_number"
                  {...fieldProps}
                />
                <EditableField
                  label="Invoice Date"
                  value={data.invoice_date}
                  fieldPath="invoice_date"
                  {...fieldProps}
                />
                <EditableField
                  label="Total Amount"
                  value={data.total_amount != null ? String(data.total_amount) : ""}
                  fieldPath="total_amount"
                  type="number"
                  {...fieldProps}
                />
                <SelectField
                  label="Shipping Currency"
                  value={data.shipping_currency}
                  fieldPath="shipping_currency"
                  options={CURRENCY_OPTIONS}
                  onChanged={addFieldCorrection}
                />
                <SelectField
                  label="Billing Currency"
                  value={data.billing_currency}
                  fieldPath="billing_currency"
                  options={CURRENCY_OPTIONS}
                  onChanged={addFieldCorrection}
                />
                <EditableField
                  label="Export Reference"
                  value={data.export_reference}
                  fieldPath="export_reference"
                  {...fieldProps}
                />
                <EditableField
                  label="Shipment References"
                  value={data.shipment_references}
                  fieldPath="shipment_references"
                  {...fieldProps}
                />
              </div>

              <Separator className="my-5" />

              {/* Logistics */}
              <SectionHeader icon={Truck} title="Logistics & Handling" />
              <div className="grid grid-cols-3 gap-2">
                <ToggleField
                  label="Self Drop"
                  value={data.self_drop}
                  fieldPath="self_drop"
                  onChanged={addFieldCorrection}
                />
                <ToggleField
                  label="Self Origin Clearance"
                  value={data.self_origin_clearance}
                  fieldPath="self_origin_clearance"
                  onChanged={addFieldCorrection}
                />
                <ToggleField
                  label="Self Dest. Clearance"
                  value={data.self_destination_clearance}
                  fieldPath="self_destination_clearance"
                  onChanged={addFieldCorrection}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                <EditableField
                  label="Port of Entry"
                  value={data.port_of_entry}
                  fieldPath="port_of_entry"
                  {...fieldProps}
                />
                <EditableField
                  label="Destination CHA"
                  value={data.destination_cha}
                  fieldPath="destination_cha"
                  {...fieldProps}
                />
              </div>

              <Separator className="my-5" />

              {/* Weight Summary */}
              <SectionHeader icon={Scale} title="Weight Summary" />
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                <EditableField
                  label="Total Boxes"
                  value={data.total_boxes != null ? String(data.total_boxes) : ""}
                  fieldPath="total_boxes"
                  type="number"
                  {...fieldProps}
                />
                <EditableField
                  label="Gross Weight (kg)"
                  value={data.total_gross_weight_kg != null ? String(data.total_gross_weight_kg) : ""}
                  fieldPath="total_gross_weight_kg"
                  type="number"
                  {...fieldProps}
                />
                <EditableField
                  label="Net Weight (kg)"
                  value={data.total_net_weight_kg != null ? String(data.total_net_weight_kg) : ""}
                  fieldPath="total_net_weight_kg"
                  type="number"
                  {...fieldProps}
                />
              </div>

              {/* Files */}
              {draft.files.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <SectionHeader icon={Paperclip} title={`Source Documents (${draft.files.length})`} />
                  <div className="flex flex-wrap gap-2">
                    {draft.files.map((f) => (
                      <Badge key={f.id} variant="outline" className="gap-1.5 font-normal">
                        <FileText className="h-3 w-3" />
                        {f.filename}
                        {f.file_type && (
                          <span className="text-muted-foreground">({f.file_type})</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* ── Addresses tab ─────────────────────────────── */}
            <TabsContent value="addresses" className="mt-0 px-6 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <AddressForm
                  label="Shipper"
                  address={data.shipper_address}
                  basePath="shipper_address"
                  confidence={draft.confidence_scores?.shipper_address as Record<string, number> | undefined}
                  onCorrections={addCorrections}
                />
                <AddressForm
                  label="Receiver"
                  address={data.receiver_address}
                  basePath="receiver_address"
                  confidence={draft.confidence_scores?.receiver_address as Record<string, number> | undefined}
                  onCorrections={addCorrections}
                />
                <AddressForm
                  label="Billing (Consignee)"
                  address={data.billing_address}
                  basePath="billing_address"
                  confidence={draft.confidence_scores?.billing_address as Record<string, number> | undefined}
                  sellerDefault={sellerDefaults.billing_address as ShipmentAddress | undefined}
                  onCorrections={addCorrections}
                />
                <AddressForm
                  label="Importer of Record"
                  address={data.ior_address}
                  basePath="ior_address"
                  confidence={draft.confidence_scores?.ior_address as Record<string, number> | undefined}
                  sellerDefault={sellerDefaults.ior_address as ShipmentAddress | undefined}
                  onCorrections={addCorrections}
                />
              </div>
            </TabsContent>

            {/* ── Boxes tab ─────────────────────────────────── */}
            <TabsContent value="boxes" className="mt-0 px-6 py-4">
              <div className="mb-3 rounded-md border border-blue-200/50 bg-blue-50/50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-300">
                Each box contains physical items with dimensions. Items here map to <code className="font-semibold">shipment_box_items</code> in the Xindus API.
              </div>
              {boxesModified && (
                <Badge variant="outline" className="mb-2 text-[10px] text-primary">
                  Modified (unsaved)
                </Badge>
              )}
              <BoxEditor boxes={boxes} onChange={setLocalBoxes} />
            </TabsContent>

            {/* ── Customs Products tab ──────────────────────── */}
            <TabsContent value="products" className="mt-0 px-6 py-4">
              <div className="mb-3 rounded-md border border-amber-200/50 bg-amber-50/50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300">
                Customs declaration summary. These are <code className="font-semibold">product_details</code> for the shipment, separate from box items.
              </div>
              {productsModified && (
                <Badge variant="outline" className="mb-2 text-[10px] text-primary">
                  Modified (unsaved)
                </Badge>
              )}
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2 w-28">HSN Code</th>
                      <th className="px-3 py-2 w-24 text-right">Value</th>
                      <th className="px-3 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <ProductRow
                        key={i}
                        product={p}
                        index={i}
                        onChange={(idx, updated) => {
                          const next = [...products];
                          next[idx] = updated;
                          setLocalProducts(next);
                        }}
                        onRemove={(idx) => {
                          setLocalProducts(products.filter((_, j) => j !== idx));
                        }}
                      />
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                          No customs products added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full gap-1.5"
                onClick={() => {
                  setLocalProducts([
                    ...products,
                    { product_description: "", hsn_code: "", value: 0 },
                  ]);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Product
              </Button>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* ── Footer ────────────────────────────────────────── */}
        <div className="border-t px-6 py-3">
          <div className="flex items-center gap-2">
            {isActionable && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={loading}
                  onClick={() => onApprove(draft.id)}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                  onClick={() => onReject(draft.id)}
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            )}
            <div className="flex-1" />
            {totalPending > 0 && (
              <Button onClick={saveAll} disabled={loading} size="sm">
                Save {totalPending} change{totalPending !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
