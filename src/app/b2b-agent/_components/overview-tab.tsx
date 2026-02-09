"use client";

import {
  FileText,
  Settings2,
  Truck,
  Scale,
  Paperclip,
  Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import {
  EditableField,
  SelectField,
  ToggleField,
  SectionHeader,
  PURPOSE_OPTIONS,
  TERMS_OPTIONS,
  DEST_CLEARANCE_OPTIONS,
  TAX_OPTIONS,
  CURRENCY_OPTIONS,
  MARKETPLACE_OPTIONS,
  EXPORTER_CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
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
}

/* ── Component ────────────────────────────────────────────── */

export function OverviewTab({
  data,
  fieldProps,
  addFieldCorrection,
  isActionable,
  draft,
  sellerDefaults,
}: OverviewTabProps) {
  return (
    <TabsContent value="overview" className="mt-0 px-6 py-4">
      {/* Shipment Configuration */}
      <SectionHeader icon={Settings2} title="Shipment Configuration" />
      <div className="grid grid-cols-3 gap-x-4 gap-y-3">
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
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Shipping Method</Label>
          <p className="text-sm font-medium">Xindus Express B2B</p>
        </div>
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
        <SelectField
          label="Destination Country"
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
        <SelectField
          label="Exporter Category"
          value={data.exporter_category}
          fieldPath="exporter_category"
          options={EXPORTER_CATEGORY_OPTIONS}
          onChanged={addFieldCorrection}
          sellerDefault={sellerDefaults?.exporter_category as string | undefined}
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
  );
}
