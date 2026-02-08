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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressForm } from "./address-form";
import { BoxEditor } from "./box-editor";
import { DraftStatusBadge } from "./draft-table";
import { getNestedValue } from "./helpers";
import type {
  DraftDetail,
  CorrectionItem,
  ShipmentAddress,
  ShipmentData,
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

/* ── Editable field (inline click-to-edit) ────────────────── */

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
    <div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      {isEditing ? (
        <div className="mt-0.5 flex items-center gap-1">
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
            className="group mt-0.5 flex cursor-pointer items-center gap-1 text-sm font-medium hover:text-primary"
            onClick={() => onStartEdit(fieldPath, value || "")}
          >
            {value || "\u2014"}
            <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </p>
          {showDefault && (
            <button
              type="button"
              className="mt-0.5 flex items-center gap-1 text-xs text-primary/70 hover:text-primary"
              onClick={() => onStartEdit(fieldPath, sellerDefault)}
            >
              <Sparkles className="h-2.5 w-2.5" />
              Seller default: {sellerDefault}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ── Editable select (inline click-to-edit with dropdown) ── */

function EditableSelect({
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
  return (
    <div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <Select
        value={value || ""}
        onValueChange={(v) => {
          if (v !== value) onChanged(fieldPath, value, v);
        }}
      >
        <SelectTrigger className="mt-0.5 h-7 text-xs">
          <SelectValue placeholder="\u2014" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ── Editable toggle (switch for booleans) ────────────────── */

function EditableToggle({
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
    <div className="flex items-center justify-between gap-2">
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

/* ── Product row editor ───────────────────────────────────── */

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
    <tr className="group border-b border-border/50">
      <td className="py-1.5 pr-2">
        <Input
          value={product.product_description}
          onChange={(e) => onChange(index, { ...product, product_description: e.target.value })}
          className="h-7 text-xs"
        />
      </td>
      <td className="py-1.5 pr-2">
        <Input
          value={product.hsn_code}
          onChange={(e) => onChange(index, { ...product, hsn_code: e.target.value })}
          className="h-7 font-mono text-xs"
        />
      </td>
      <td className="py-1.5 pr-2">
        <Input
          type="number"
          value={product.value ?? ""}
          onChange={(e) => onChange(index, { ...product, value: Number(e.target.value) || 0 })}
          className="h-7 text-right text-xs"
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

/* ── Draft Detail Sheet ──────────────────────────────────── */

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

  // Track whether boxes/products have been locally modified
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

  // For select/toggle fields
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

  // Count total pending changes
  const totalPending = useMemo(() => {
    let count = pendingCorrections.length;
    if (boxesModified) count++;
    if (productsModified) count++;
    return count;
  }, [pendingCorrections.length, boxesModified, productsModified]);

  const saveAll = useCallback(() => {
    if (!draft || !data) return;

    const allCorrections = [...pendingCorrections];

    // If boxes were locally modified, add a correction for the full array
    if (localBoxes !== null) {
      allCorrections.push({
        field_path: "shipment_boxes",
        old_value: data.shipment_boxes,
        new_value: localBoxes,
      });
    }

    // If products were locally modified
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

  // Reset state when sheet closes or draft changes
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

  // Reset local state when draft changes
  const prevDraftId = useMemo(() => draft?.id, [draft?.id]);
  useMemo(() => {
    setLocalBoxes(null);
    setLocalProducts(null);
    setPendingCorrections([]);
  }, [prevDraftId]);

  if (!draft || !data) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="sm:max-w-[55vw]" />
      </Sheet>
    );
  }

  // Shared editable field props
  const fieldProps = {
    editingField,
    editValue,
    onStartEdit: startEdit,
    onConfirm: confirmEdit,
    onCancel: cancelEdit,
    onEditValueChange: setEditValue,
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col sm:max-w-[55vw]"
        showCloseButton
      >
        {/* ── Sticky header ───────────────────────────────── */}
        <SheetHeader className="border-b pb-3">
          <div className="flex items-center gap-2 pr-8">
            <SheetTitle className="truncate">
              {data.invoice_number ? `Invoice ${data.invoice_number}` : "Shipment Draft"}
            </SheetTitle>
            <DraftStatusBadge status={draft.status} />
          </div>
          <SheetDescription className="sr-only">
            Draft shipment detail view
          </SheetDescription>
          <div className="flex items-center gap-2">
            {isActionable && (
              <>
                <Button
                  size="sm"
                  className="bg-success text-white hover:bg-success/90"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/b2b-agent/drafts/${draft.id}/download`, "_blank")}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Excel
            </Button>
          </div>
        </SheetHeader>

        {/* ── Seller banner ───────────────────────────────── */}
        {sellerProfile && sellerProfile.shipment_count > 0 && (
          <div className="mx-4 flex items-center gap-2 rounded-md border border-primary/15 bg-primary/5 px-3 py-2 text-sm">
            <User className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{sellerProfile.name}</span>
            <span className="text-xs text-muted-foreground">
              {sellerProfile.shipment_count} past shipment{sellerProfile.shipment_count !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* ── Scrollable body ─────────────────────────────── */}
        <ScrollArea className="flex-1 min-h-0 px-4">
          <Accordion
            type="multiple"
            defaultValue={["config", "addresses", "invoice", "boxes"]}
            className="pb-4"
          >
            {/* ── Shipment Configuration ────────────────────── */}
            <AccordionItem value="config">
              <AccordionTrigger>Shipment Configuration</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <EditableSelect
                    label="Origin Clearance"
                    value={data.origin_clearance_type}
                    fieldPath="origin_clearance_type"
                    options={ORIGIN_CLEARANCE_OPTIONS}
                    onChanged={addFieldCorrection}
                  />
                  <EditableSelect
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
                  <EditableSelect
                    label="Purpose"
                    value={data.purpose_of_booking}
                    fieldPath="purpose_of_booking"
                    options={PURPOSE_OPTIONS}
                    onChanged={addFieldCorrection}
                  />
                  <EditableSelect
                    label="Terms of Trade"
                    value={data.terms_of_trade}
                    fieldPath="terms_of_trade"
                    options={TERMS_OPTIONS}
                    onChanged={addFieldCorrection}
                  />
                  <EditableSelect
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
                  <EditableSelect
                    label="Marketplace"
                    value={data.marketplace}
                    fieldPath="marketplace"
                    options={["AMAZON_FBA", "WALMART_WFS", "FAIRE", "OTHER", ""]}
                    onChanged={addFieldCorrection}
                  />
                  <EditableField
                    label="Exporter Category"
                    value={data.exporter_category}
                    fieldPath="exporter_category"
                    {...fieldProps}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                  <EditableToggle
                    label="Amazon FBA"
                    value={data.amazon_fba}
                    fieldPath="amazon_fba"
                    onChanged={addFieldCorrection}
                  />
                  <EditableToggle
                    label="Multi-Address Delivery"
                    value={data.multi_address_destination_delivery}
                    fieldPath="multi_address_destination_delivery"
                    onChanged={addFieldCorrection}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Addresses ─────────────────────────────────── */}
            <AccordionItem value="addresses">
              <AccordionTrigger>Addresses (4)</AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>

            {/* ── Invoice & References ──────────────────────── */}
            <AccordionItem value="invoice">
              <AccordionTrigger>Invoice & References</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <EditableField
                    label="Invoice #"
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
                  <EditableSelect
                    label="Shipping Currency"
                    value={data.shipping_currency}
                    fieldPath="shipping_currency"
                    options={CURRENCY_OPTIONS}
                    onChanged={addFieldCorrection}
                  />
                  <EditableSelect
                    label="Billing Currency"
                    value={data.billing_currency}
                    fieldPath="billing_currency"
                    options={CURRENCY_OPTIONS}
                    onChanged={addFieldCorrection}
                  />
                  <EditableField
                    label="Total Amount"
                    value={data.total_amount != null ? String(data.total_amount) : ""}
                    fieldPath="total_amount"
                    type="number"
                    {...fieldProps}
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
              </AccordionContent>
            </AccordionItem>

            {/* ── Logistics & Handling ──────────────────────── */}
            <AccordionItem value="logistics">
              <AccordionTrigger>Logistics & Handling</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                  <EditableToggle
                    label="Self Drop"
                    value={data.self_drop}
                    fieldPath="self_drop"
                    onChanged={addFieldCorrection}
                  />
                  <EditableToggle
                    label="Self Origin Clearance"
                    value={data.self_origin_clearance}
                    fieldPath="self_origin_clearance"
                    onChanged={addFieldCorrection}
                  />
                  <EditableToggle
                    label="Self Dest. Clearance"
                    value={data.self_destination_clearance}
                    fieldPath="self_destination_clearance"
                    onChanged={addFieldCorrection}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
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
              </AccordionContent>
            </AccordionItem>

            {/* ── Weight Summary ────────────────────────────── */}
            <AccordionItem value="weights">
              <AccordionTrigger>Weight Summary</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-3">
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
              </AccordionContent>
            </AccordionItem>

            {/* ── Boxes (CRUD) ──────────────────────────────── */}
            <AccordionItem value="boxes">
              <AccordionTrigger>
                Boxes ({boxes.length})
                {boxesModified && (
                  <Badge variant="outline" className="ml-2 text-[10px] text-primary">modified</Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <BoxEditor
                  boxes={boxes}
                  onChange={setLocalBoxes}
                />
              </AccordionContent>
            </AccordionItem>

            {/* ── Products (editable) ──────────────────────── */}
            <AccordionItem value="products">
              <AccordionTrigger>
                Products ({products.length})
                {productsModified && (
                  <Badge variant="outline" className="ml-2 text-[10px] text-primary">modified</Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-[10px] text-muted-foreground">
                        <th className="pb-1.5 pr-2">Description</th>
                        <th className="pb-1.5 pr-2 w-28">HSN Code</th>
                        <th className="pb-1.5 pr-2 w-24 text-right">Value</th>
                        <th className="pb-1.5 w-8" />
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
              </AccordionContent>
            </AccordionItem>

            {/* ── Files ─────────────────────────────────────── */}
            <AccordionItem value="files">
              <AccordionTrigger>Files ({draft.files.length})</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {draft.files.map((f) => (
                    <Badge key={f.id} variant="outline" className="gap-1.5">
                      <FileText className="h-3 w-3" />
                      {f.filename}
                      {f.file_type && (
                        <span className="text-muted-foreground">({f.file_type})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>

        {/* ── Sticky footer ───────────────────────────────── */}
        {totalPending > 0 && (
          <SheetFooter className="border-t pt-3">
            <Button onClick={saveAll} disabled={loading} className="w-full">
              Save {totalPending} change{totalPending !== 1 ? "s" : ""}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
