"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Settings2,
  Truck,
  Paperclip,
  Receipt,
  Sparkles,
  Download,
  X,
  Plus,
  Loader2,
  Globe,
  Package,
  Weight,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadZone } from "@/components/file-upload-zone";
import {
  EditableField,
  SelectField,
  ToggleField,
  PURPOSE_OPTIONS,
  TERMS_OPTIONS,
  DEST_CLEARANCE_OPTIONS,
  TAX_OPTIONS,
  CURRENCY_OPTIONS,
  MARKETPLACE_OPTIONS,
  COUNTRY_OPTIONS,
  PORT_OF_ENTRY_OPTIONS,
} from "./editable-fields";
import type { ShipmentData, DraftDetail } from "@/types/agent";

/* ── Field props shared by EditableField ──────────────────── */

export interface FieldProps {
  editingField: string | null;
  editValue: string;
  onStartEdit: (path: string, val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onEditValueChange: (val: string) => void;
}

/* ── Props ────────────────────────────────────────────────── */

interface OverviewTabProps {
  data: ShipmentData;
  fieldProps: FieldProps;
  addFieldCorrection: (path: string, oldVal: unknown, newVal: unknown) => void;
  isActionable: boolean;
  draft: DraftDetail;
  sellerDefaults?: Record<string, unknown>;
  onAddFiles: (draftId: string, files: File[]) => Promise<DraftDetail | null>;
  onRemoveFile: (draftId: string, fileId: string) => Promise<DraftDetail | null>;
  onDownloadFile: (draftId: string, fileId: string) => void;
  loading: boolean;
}

/* ── Section Card ─────────────────────────────────────────── */

function SectionCard({
  icon: Icon,
  title,
  iconColor,
  bgColor,
  borderColor,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  iconColor: string;
  bgColor: string;
  borderColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-4 ${bgColor} ${borderColor ?? ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`rounded-md p-1 ${iconColor.replace("text-", "bg-").replace("600", "500/10").replace("400", "500/10")}`}>
          <Icon className={`h-3 w-3 ${iconColor}`} />
        </div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

/* ── Summary Stat ─────────────────────────────────────────── */

function SummaryStat({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`rounded-md p-1.5 ${iconColor.replace("text-", "bg-").replace("600", "500/10").replace("400", "500/10")}`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value || "---"}</p>
      </div>
    </div>
  );
}

/* ── Add Files Dialog ─────────────────────────────────────── */

function AddFilesDialog({
  open,
  onOpenChange,
  draftId,
  onAddFiles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId: string;
  onAddFiles: (draftId: string, files: File[]) => Promise<DraftDetail | null>;
}) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleConfirm = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    try {
      await onAddFiles(draftId, pendingFiles);
      onOpenChange(false);
      setPendingFiles([]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Files to Draft</DialogTitle>
          <DialogDescription>
            Upload additional documents. The draft will re-extract automatically.
          </DialogDescription>
        </DialogHeader>
        <FileUploadZone
          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
          multiple
          maxFiles={10}
          onFiles={setPendingFiles}
          label="Drop files here or click to browse"
          description="PDF, images, or spreadsheets"
        />
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={pendingFiles.length === 0 || uploading}>
            {uploading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Upload {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Files Button (wraps dialog state) ───────────────── */

function AddFilesButton({
  draftId,
  onAddFiles,
}: {
  draftId: string;
  onAddFiles: (draftId: string, files: File[]) => Promise<DraftDetail | null>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 h-7 text-xs"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-3 w-3" />
        Add Files
      </Button>
      <AddFilesDialog
        open={open}
        onOpenChange={setOpen}
        draftId={draftId}
        onAddFiles={onAddFiles}
      />
    </>
  );
}

/* ── Component ────────────────────────────────────────────── */

export function OverviewTab({
  data,
  fieldProps,
  addFieldCorrection,
  isActionable,
  draft,
  sellerDefaults,
  onAddFiles,
  onRemoveFile,
  onDownloadFile,
  loading,
}: OverviewTabProps) {
  const [shippingMethods, setShippingMethods] = useState<{code: string; name: string}[]>([]);

  useEffect(() => {
    fetch("/api/b2b-agent/shipping-methods")
      .then((r) => r.json())
      .then(setShippingMethods)
      .catch(() => {});
  }, []);

  return (
    <TabsContent value="overview" className="mt-0 px-6 py-4 space-y-4">
      {/* ── Shipment Summary (top) ───────────────────────── */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="grid grid-cols-4 gap-4">
          <SummaryStat
            icon={Package}
            label="Boxes"
            value={data.total_boxes ?? 0}
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <SummaryStat
            icon={Weight}
            label="Gross Weight"
            value={data.total_gross_weight_kg != null ? `${data.total_gross_weight_kg} kg` : "---"}
            iconColor="text-slate-600 dark:text-slate-400"
          />
          <SummaryStat
            icon={DollarSign}
            label="Total Value"
            value={data.total_amount != null ? `${data.shipping_currency || ""} ${data.total_amount}`.trim() : "---"}
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <SummaryStat
            icon={Paperclip}
            label="Documents"
            value={draft.files.length}
            iconColor="text-rose-600 dark:text-rose-400"
          />
        </div>
      </div>

      {/* ── Source Documents ──────────────────────────────── */}
      {(draft.files.length > 0 || isActionable) && (
        <SectionCard
          icon={Paperclip}
          title={`Source Documents (${draft.files.length})`}
          iconColor="text-rose-600 dark:text-rose-400"
          bgColor="bg-rose-50/30 dark:bg-rose-950/20"
          borderColor="border-rose-200/50 dark:border-rose-900/40"
        >
          <div className="flex flex-wrap gap-2">
            {draft.files.map((f) => (
              <Badge key={f.id} variant="outline" className="gap-1.5 pr-1 font-normal bg-background/80">
                <FileText className="h-3 w-3" />
                {f.filename}
                {f.file_type && (
                  <span className="text-muted-foreground">({f.file_type})</span>
                )}
                <button
                  type="button"
                  className="ml-0.5 rounded p-0.5 hover:bg-muted"
                  onClick={() => onDownloadFile(draft.id, f.id)}
                  title="Download"
                >
                  <Download className="h-3 w-3 text-muted-foreground" />
                </button>
                {isActionable && draft.files.length > 1 && (
                  <button
                    type="button"
                    className="rounded p-0.5 hover:bg-destructive/10"
                    onClick={() => onRemoveFile(draft.id, f.id)}
                    title="Remove file (auto re-extracts)"
                    disabled={loading}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {isActionable && (
            <AddFilesButton draftId={draft.id} onAddFiles={onAddFiles} />
          )}
        </SectionCard>
      )}

      {/* ── Clearance & Shipping ─────────────────────────── */}
      <SectionCard
        icon={Settings2}
        title="Clearance & Shipping"
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-50/40 dark:bg-blue-950/20"
        borderColor="border-blue-200/60 dark:border-blue-900/40"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Origin Clearance</Label>
            <p className="text-sm font-medium">Commercial</p>
          </div>
          <SelectField
            label="Dest. Clearance"
            value={data.destination_clearance_type}
            fieldPath="destination_clearance_type"
            options={DEST_CLEARANCE_OPTIONS}
            onChanged={addFieldCorrection}
            sellerDefault={sellerDefaults?.destination_clearance_type as string | undefined}
          />
          <div className="col-span-2 space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Shipping Method</Label>
            <Select
              value={data.shipping_method || undefined}
              onValueChange={(v) => {
                if (v !== data.shipping_method) addFieldCorrection("shipping_method", data.shipping_method, v);
              }}
            >
              <SelectTrigger className="h-7 w-full text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {shippingMethods.map((m) => (
                  <SelectItem key={m.code} value={m.code}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sellerDefaults?.shipping_method != null && sellerDefaults.shipping_method !== data.shipping_method ? (
              <button
                type="button"
                className="mt-1 flex items-center gap-1.5 rounded-md bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
                onClick={() => addFieldCorrection("shipping_method", data.shipping_method, sellerDefaults.shipping_method as string)}
              >
                <Sparkles className="h-2.5 w-2.5" />
                Default: {shippingMethods.find(m => m.code === sellerDefaults.shipping_method)?.name || String(sellerDefaults.shipping_method)}
              </button>
            ) : null}
          </div>
        </div>
      </SectionCard>

      {/* ── Trade Configuration ──────────────────────────── */}
      <SectionCard
        icon={FileText}
        title="Trade Configuration"
        iconColor="text-violet-600 dark:text-violet-400"
        bgColor="bg-violet-50/30 dark:bg-violet-950/20"
        borderColor="border-violet-200/50 dark:border-violet-900/40"
      >
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Purpose"
            value={data.purpose_of_booking}
            fieldPath="purpose_of_booking"
            options={PURPOSE_OPTIONS}
            onChanged={addFieldCorrection}
            sellerDefault={sellerDefaults?.purpose_of_booking as string | undefined}
          />
          <SelectField
            label="Terms of Trade"
            value={data.terms_of_trade}
            fieldPath="terms_of_trade"
            options={TERMS_OPTIONS}
            onChanged={addFieldCorrection}
            sellerDefault={sellerDefaults?.terms_of_trade as string | undefined}
          />
          <SelectField
            label="Tax Type"
            value={data.tax_type}
            fieldPath="tax_type"
            options={TAX_OPTIONS}
            onChanged={addFieldCorrection}
            sellerDefault={sellerDefaults?.tax_type as string | undefined}
          />
        </div>
      </SectionCard>

      {/* ── Destination ──────────────────────────────────── */}
      <SectionCard
        icon={Globe}
        title="Destination"
        iconColor="text-emerald-600 dark:text-emerald-400"
        bgColor="bg-emerald-50/30 dark:bg-emerald-950/20"
        borderColor="border-emerald-200/50 dark:border-emerald-900/40"
      >
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Country"
            value={data.country}
            fieldPath="country"
            options={COUNTRY_OPTIONS}
            onChanged={addFieldCorrection}
            sellerDefault={sellerDefaults?.country as string | undefined}
          />
          <SelectField
            label="Marketplace"
            value={data.marketplace}
            fieldPath="marketplace"
            options={MARKETPLACE_OPTIONS}
            onChanged={addFieldCorrection}
            sellerDefault={sellerDefaults?.marketplace as string | undefined}
          />
        </div>
      </SectionCard>

      {/* ── Invoice & References ─────────────────────────── */}
      <SectionCard
        icon={Receipt}
        title="Invoice & References"
        iconColor="text-amber-600 dark:text-amber-400"
        bgColor="bg-amber-50/30 dark:bg-amber-950/20"
        borderColor="border-amber-200/50 dark:border-amber-900/40"
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
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
            sellerDefault={sellerDefaults?.shipping_currency as string | undefined}
          />
          <SelectField
            label="Billing Currency"
            value={data.billing_currency}
            fieldPath="billing_currency"
            options={CURRENCY_OPTIONS}
            onChanged={addFieldCorrection}
            sellerDefault={sellerDefaults?.billing_currency as string | undefined}
          />
          <EditableField
            label="Export Reference"
            value={data.export_reference}
            fieldPath="export_reference"
            {...fieldProps}
          />
        </div>
        <div className="mt-3">
          <EditableField
            label="Shipment References"
            value={data.shipment_references}
            fieldPath="shipment_references"
            {...fieldProps}
          />
        </div>
      </SectionCard>

      {/* ── Logistics & Handling ─────────────────────────── */}
      <SectionCard
        icon={Truck}
        title="Logistics & Handling"
        iconColor="text-orange-600 dark:text-orange-400"
        bgColor="bg-orange-50/30 dark:bg-orange-950/20"
        borderColor="border-orange-200/50 dark:border-orange-900/40"
      >
        <div className="grid grid-cols-2 gap-2">
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
          <ToggleField
            label="Multi Address Delivery"
            value={data.multi_address_destination_delivery}
            fieldPath="multi_address_destination_delivery"
            onChanged={addFieldCorrection}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <SelectField
            label="Port of Entry"
            value={data.port_of_entry}
            fieldPath="port_of_entry"
            options={PORT_OF_ENTRY_OPTIONS}
            onChanged={addFieldCorrection}
            sellerDefault={sellerDefaults?.port_of_entry as string | undefined}
          />
          <EditableField
            label="Destination CHA"
            value={data.destination_cha}
            fieldPath="destination_cha"
            {...fieldProps}
          />
        </div>
      </SectionCard>

    </TabsContent>
  );
}
