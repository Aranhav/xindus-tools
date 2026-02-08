"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Pencil,
  Check,
  X,
  User,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { AddressForm } from "./address-form";
import { DraftStatusBadge } from "./draft-row";
import { formatAddress, getNestedValue } from "./helpers";
import type {
  DraftDetail,
  CorrectionItem,
  ShipmentAddress,
  SellerProfile,
} from "@/types/agent";

/* ── Editable field (inline click-to-edit for invoice fields) ─ */

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
}) {
  const isEditing = editingField === fieldPath;
  const showDefault = sellerDefault && sellerDefault !== value && !isEditing;

  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      {isEditing ? (
        <div className="mt-0.5 flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm();
              if (e.key === "Escape") onCancel();
            }}
          />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onConfirm}>
            <Check className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <p
            className="group mt-0.5 flex cursor-pointer items-center gap-1 font-medium hover:text-primary"
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

  const data = draft ? draft.corrected_data || draft.shipment_data : null;
  const sellerDefaults = (sellerProfile?.defaults ?? {}) as Record<string, unknown>;
  const isActionable = draft?.status === "pending_review";

  const startEdit = useCallback((fieldPath: string, currentValue: string) => {
    setEditingField(fieldPath);
    setEditValue(currentValue);
  }, []);

  const confirmEdit = useCallback(() => {
    if (!editingField || !data) return;
    const oldValue = getNestedValue(data, editingField);
    if (String(oldValue) !== editValue) {
      setPendingCorrections((prev) => [
        ...prev,
        { field_path: editingField, old_value: oldValue, new_value: editValue },
      ]);
    }
    setEditingField(null);
  }, [editingField, editValue, data]);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
  }, []);

  const saveAll = useCallback(() => {
    if (!draft || pendingCorrections.length === 0) return;
    onCorrect(draft.id, pendingCorrections);
    setPendingCorrections([]);
  }, [draft, pendingCorrections, onCorrect]);

  const addCorrections = useCallback((corrections: CorrectionItem[]) => {
    setPendingCorrections((prev) => [...prev, ...corrections]);
  }, []);

  // Reset pending corrections when sheet closes or draft changes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setPendingCorrections([]);
        setEditingField(null);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  if (!draft || !data) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="sm:max-w-[55vw]"
        />
      </Sheet>
    );
  }

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
          {isActionable && (
            <div className="flex gap-2">
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
            </div>
          )}
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
        <ScrollArea className="flex-1 px-4">
          <Accordion type="multiple" defaultValue={["addresses", "invoice"]}>
            {/* Addresses */}
            <AccordionItem value="addresses">
              <AccordionTrigger>Addresses (4)</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AddressForm
                    label="Shipper"
                    address={data.shipper_address}
                    basePath="shipper_address"
                    confidence={
                      draft.confidence_scores?.shipper_address as Record<string, number> | undefined
                    }
                    onCorrections={addCorrections}
                  />
                  <AddressForm
                    label="Receiver"
                    address={data.receiver_address}
                    basePath="receiver_address"
                    confidence={
                      draft.confidence_scores?.receiver_address as Record<string, number> | undefined
                    }
                    onCorrections={addCorrections}
                  />
                  <AddressForm
                    label="Billing (Consignee)"
                    address={data.billing_address}
                    basePath="billing_address"
                    confidence={
                      draft.confidence_scores?.billing_address as Record<string, number> | undefined
                    }
                    sellerDefault={sellerDefaults.billing_address as ShipmentAddress | undefined}
                    onCorrections={addCorrections}
                  />
                  <AddressForm
                    label="Importer of Record"
                    address={data.ior_address}
                    basePath="ior_address"
                    confidence={
                      draft.confidence_scores?.ior_address as Record<string, number> | undefined
                    }
                    sellerDefault={sellerDefaults.ior_address as ShipmentAddress | undefined}
                    onCorrections={addCorrections}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Invoice Details */}
            <AccordionItem value="invoice">
              <AccordionTrigger>Invoice Details</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <EditableField
                    label="Invoice #"
                    value={data.invoice_number}
                    fieldPath="invoice_number"
                    editingField={editingField}
                    editValue={editValue}
                    onStartEdit={startEdit}
                    onConfirm={confirmEdit}
                    onCancel={cancelEdit}
                    onEditValueChange={setEditValue}
                  />
                  <EditableField
                    label="Date"
                    value={data.invoice_date}
                    fieldPath="invoice_date"
                    editingField={editingField}
                    editValue={editValue}
                    onStartEdit={startEdit}
                    onConfirm={confirmEdit}
                    onCancel={cancelEdit}
                    onEditValueChange={setEditValue}
                  />
                  <EditableField
                    label="Currency"
                    value={data.shipping_currency}
                    fieldPath="shipping_currency"
                    editingField={editingField}
                    editValue={editValue}
                    onStartEdit={startEdit}
                    onConfirm={confirmEdit}
                    onCancel={cancelEdit}
                    onEditValueChange={setEditValue}
                    sellerDefault={sellerDefaults.shipping_currency as string | undefined}
                  />
                  <EditableField
                    label="Total"
                    value={data.total_amount != null ? String(data.total_amount) : ""}
                    fieldPath="total_amount"
                    editingField={editingField}
                    editValue={editValue}
                    onStartEdit={startEdit}
                    onConfirm={confirmEdit}
                    onCancel={cancelEdit}
                    onEditValueChange={setEditValue}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Products */}
            {data.product_details && data.product_details.length > 0 && (
              <AccordionItem value="products">
                <AccordionTrigger>Products ({data.product_details.length})</AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2 pr-3">Description</th>
                          <th className="pb-2 pr-3">HSN Code</th>
                          <th className="pb-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.product_details.map((p, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 pr-3">{p.product_description || "\u2014"}</td>
                            <td className="py-2 pr-3 font-mono text-xs">{p.hsn_code || "\u2014"}</td>
                            <td className="py-2 text-right">${p.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Boxes */}
            {data.shipment_boxes && data.shipment_boxes.length > 0 && (
              <AccordionItem value="boxes">
                <AccordionTrigger>Boxes ({data.shipment_boxes.length})</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {data.shipment_boxes.map((box, i) => (
                      <div key={i} className="rounded-lg border border-border/50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Box #{box.box_id}</span>
                          <span className="text-xs text-muted-foreground">
                            {box.length}x{box.width}x{box.height} {box.uom} | {box.weight} kg
                          </span>
                        </div>
                        {box.receiver_address?.name && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            To: {formatAddress(box.receiver_address)}
                          </p>
                        )}
                        {box.shipment_box_items.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {box.shipment_box_items.map((item, j) => (
                              <Badge key={j} variant="outline" className="text-xs font-normal">
                                {item.description} x{item.quantity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Files */}
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
        {pendingCorrections.length > 0 && (
          <SheetFooter className="border-t pt-3">
            <Button onClick={saveAll} disabled={loading} className="w-full">
              Save {pendingCorrections.length} correction{pendingCorrections.length !== 1 ? "s" : ""}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
