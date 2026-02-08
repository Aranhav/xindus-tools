"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Upload,
  Loader2,
  FileText,
  Package,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  ArrowLeft,
  Clock,
  CircleCheck,
  CircleX,
  User,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { useB2BAgent, type DraftTab } from "@/hooks/use-b2b-agent";
import type {
  DraftSummary,
  DraftDetail,
  ShipmentAddress,
  CorrectionItem,
  SellerProfile,
} from "@/types/agent";

/* ------------------------------------------------------------------ */
/*  Framer variants                                                    */
/* ------------------------------------------------------------------ */

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] as const },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

/* ------------------------------------------------------------------ */
/*  Helper: format address as one-liner                                */
/* ------------------------------------------------------------------ */

function formatAddress(addr: ShipmentAddress | undefined): string {
  if (!addr) return "—";
  const parts = [addr.name, addr.address, addr.city, addr.state, addr.zip, addr.country].filter(
    Boolean,
  );
  return parts.join(", ") || "—";
}

/* ------------------------------------------------------------------ */
/*  Processing banner                                                  */
/* ------------------------------------------------------------------ */

function ProcessingBanner({
  progress,
  label,
}: {
  progress: { completed: number; total: number; file?: string; shipments_found?: number } | null;
  label: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4 overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-4"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">{label || "Processing..."}</p>
          {progress && progress.total > 0 && (
            <div className="mt-1.5">
              <Progress
                value={(progress.completed / progress.total) * 100}
                className="h-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {progress.file && <span className="font-medium">{progress.file} — </span>}
                {progress.completed}/{progress.total} files
                {progress.shipments_found != null && (
                  <span> | {progress.shipments_found} shipment(s) found</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Draft card (shown in tab lists)                                    */
/* ------------------------------------------------------------------ */

function DraftCard({
  draft,
  onView,
  onApprove,
  onReject,
  loading,
}: {
  draft: DraftSummary;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const overall = (draft.confidence_scores as Record<string, number> | undefined)?._overall;
  const isActionable = draft.status === "pending_review";

  return (
    <motion.div variants={fadeIn}>
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {draft.invoice_number ? `Invoice ${draft.invoice_number}` : `Shipment Draft`}
                </span>
                <DraftStatusBadge status={draft.status} />
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">Shipper</span>
                  <p className="truncate font-medium">{draft.shipper_name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Receiver</span>
                  <p className="truncate font-medium">{draft.receiver_name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Boxes</span>
                  <p className="font-medium">{draft.box_count ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Value</span>
                  <p className="font-medium">
                    {draft.total_value != null ? `$${draft.total_value.toLocaleString()}` : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{draft.file_count} file(s)</span>
                {overall != null && (
                  <>
                    <span>|</span>
                    <span>Confidence: </span>
                    <ConfidenceBadge value={overall} />
                  </>
                )}
                {draft.grouping_reason && (
                  <>
                    <span>|</span>
                    <span className="truncate">{draft.grouping_reason}</span>
                  </>
                )}
                {draft.seller_id && draft.seller_shipment_count != null && draft.seller_shipment_count > 0 && (
                  <>
                    <span>|</span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      <User className="h-3 w-3" />
                      {draft.seller_shipment_count} past shipment{draft.seller_shipment_count !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={onView} disabled={loading}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Review
            </Button>
            {isActionable && (
              <>
                <Button
                  size="sm"
                  onClick={onApprove}
                  disabled={loading}
                  className="bg-success text-white hover:bg-success/90"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button variant="destructive" size="sm" onClick={onReject} disabled={loading}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DraftStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_review: "bg-warning-muted text-warning-foreground",
    approved: "bg-success-muted text-success-foreground",
    rejected: "bg-destructive/10 text-destructive",
    pushed: "bg-info-muted text-info-foreground",
  };
  return (
    <Badge
      variant="secondary"
      className={`border-0 text-xs ${styles[status] || "bg-muted text-muted-foreground"}`}
    >
      {status.replace("_", " ")}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Draft detail view (inline editing)                                 */
/* ------------------------------------------------------------------ */

function DraftDetailView({
  draft,
  onBack,
  onCorrect,
  loading,
  sellerProfile,
}: {
  draft: DraftDetail;
  onBack: () => void;
  onCorrect: (corrections: CorrectionItem[]) => void;
  loading: boolean;
  sellerProfile?: SellerProfile | null;
}) {
  const data = draft.corrected_data || draft.shipment_data;
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingCorrections, setPendingCorrections] = useState<CorrectionItem[]>([]);
  const sellerDefaults = (sellerProfile?.defaults ?? {}) as Record<string, unknown>;

  const startEdit = (fieldPath: string, currentValue: string) => {
    setEditingField(fieldPath);
    setEditValue(currentValue);
  };

  const confirmEdit = () => {
    if (!editingField) return;
    const oldValue = getNestedValue(data, editingField);
    if (String(oldValue) !== editValue) {
      setPendingCorrections((prev) => [
        ...prev,
        { field_path: editingField, old_value: oldValue, new_value: editValue },
      ]);
    }
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const saveAll = () => {
    if (pendingCorrections.length > 0) {
      onCorrect(pendingCorrections);
      setPendingCorrections([]);
    }
  };

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to drafts
        </Button>
        {pendingCorrections.length > 0 && (
          <Button size="sm" onClick={saveAll} disabled={loading}>
            Save {pendingCorrections.length} correction(s)
          </Button>
        )}
      </div>

      {/* Seller banner */}
      {sellerProfile && sellerProfile.shipment_count > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <User className="h-4 w-4 text-primary" />
          <div className="flex-1 text-sm">
            <span className="font-medium">{sellerProfile.name}</span>
            <span className="ml-2 text-muted-foreground">
              {sellerProfile.shipment_count} past shipment{sellerProfile.shipment_count !== 1 ? "s" : ""}
              {" — "}defaults will auto-fill blank fields
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Files */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Associated Files</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
          </CardContent>
        </Card>

        {/* Addresses */}
        <div className="grid gap-4 sm:grid-cols-2">
          <AddressCard
            label="Shipper"
            address={data.shipper_address}
            basePath="shipper_address"
            editingField={editingField}
            editValue={editValue}
            onStartEdit={startEdit}
            onConfirm={confirmEdit}
            onCancel={cancelEdit}
            onEditValueChange={setEditValue}
            confidence={
              draft.confidence_scores?.shipper_address as Record<string, number> | undefined
            }
          />
          <AddressCard
            label="Receiver"
            address={data.receiver_address}
            basePath="receiver_address"
            editingField={editingField}
            editValue={editValue}
            onStartEdit={startEdit}
            onConfirm={confirmEdit}
            onCancel={cancelEdit}
            onEditValueChange={setEditValue}
            confidence={
              draft.confidence_scores?.receiver_address as Record<string, number> | undefined
            }
          />
          <AddressCard
            label="Billing (Consignee)"
            address={data.billing_address}
            basePath="billing_address"
            editingField={editingField}
            editValue={editValue}
            onStartEdit={startEdit}
            onConfirm={confirmEdit}
            onCancel={cancelEdit}
            onEditValueChange={setEditValue}
            confidence={
              draft.confidence_scores?.billing_address as Record<string, number> | undefined
            }
            sellerDefault={sellerDefaults.billing_address as ShipmentAddress | undefined}
            onApplyDefault={(corrections) => {
              setPendingCorrections((prev) => [...prev, ...corrections]);
            }}
          />
          <AddressCard
            label="Importer of Record"
            address={data.ior_address}
            basePath="ior_address"
            editingField={editingField}
            editValue={editValue}
            onStartEdit={startEdit}
            onConfirm={confirmEdit}
            onCancel={cancelEdit}
            onEditValueChange={setEditValue}
            confidence={
              draft.confidence_scores?.ior_address as Record<string, number> | undefined
            }
            sellerDefault={sellerDefaults.ior_address as ShipmentAddress | undefined}
            onApplyDefault={(corrections) => {
              setPendingCorrections((prev) => [...prev, ...corrections]);
            }}
          />
        </div>

        {/* Invoice details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
                sellerDefault={
                  sellerDefaults.shipping_currency as string | undefined
                }
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
          </CardContent>
        </Card>

        {/* Products */}
        {data.product_details && data.product_details.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Products ({data.product_details.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
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
                        <td className="py-2 pr-3">{p.product_description || "—"}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{p.hsn_code || "—"}</td>
                        <td className="py-2 text-right">${p.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boxes summary */}
        {data.shipment_boxes && data.shipment_boxes.length > 0 && (
          <BoxesSection boxes={data.shipment_boxes} />
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editable field                                                     */
/* ------------------------------------------------------------------ */

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
  const showDefault =
    sellerDefault && sellerDefault !== value && !isEditing;

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
            {value || "—"}
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

/* ------------------------------------------------------------------ */
/*  Address card                                                       */
/* ------------------------------------------------------------------ */

function AddressCard({
  label,
  address,
  basePath,
  editingField,
  editValue,
  onStartEdit,
  onConfirm,
  onCancel,
  onEditValueChange,
  confidence,
  sellerDefault,
  onApplyDefault,
}: {
  label: string;
  address: ShipmentAddress;
  basePath: string;
  editingField: string | null;
  editValue: string;
  onStartEdit: (path: string, val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onEditValueChange: (val: string) => void;
  confidence?: Record<string, number>;
  sellerDefault?: ShipmentAddress;
  onApplyDefault?: (corrections: CorrectionItem[]) => void;
}) {
  const fields = [
    { key: "name", label: "Name" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zip", label: "ZIP" },
    { key: "country", label: "Country" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ];

  // Check if seller default differs from current
  const addrRecord = address as unknown as Record<string, string>;
  const defaultRecord = sellerDefault as unknown as Record<string, string> | undefined;
  const hasDiff =
    defaultRecord &&
    fields.some((f) => {
      const cur = addrRecord[f.key] || "";
      const def = defaultRecord[f.key] || "";
      return def && def !== cur;
    });

  const applyAllDefaults = () => {
    if (!defaultRecord || !onApplyDefault) return;
    const corrections: CorrectionItem[] = [];
    for (const f of fields) {
      const cur = addrRecord[f.key] || "";
      const def = defaultRecord[f.key] || "";
      if (def && def !== cur) {
        corrections.push({
          field_path: `${basePath}.${f.key}`,
          old_value: cur,
          new_value: def,
        });
      }
    }
    if (corrections.length > 0) onApplyDefault(corrections);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          {hasDiff && onApplyDefault && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary"
              onClick={applyAllDefaults}
            >
              <Sparkles className="h-3 w-3" />
              Use seller default
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1.5 text-sm">
          {fields.map((f) => {
            const val = addrRecord[f.key] || "";
            const fieldPath = `${basePath}.${f.key}`;
            const isEditing = editingField === fieldPath;
            const fieldConf = confidence?.[f.key];
            const defaultVal = defaultRecord?.[f.key] || "";
            const showHint = defaultVal && defaultVal !== val && !isEditing;

            return (
              <div key={f.key}>
                <div className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-xs text-muted-foreground">{f.label}</span>
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => onEditValueChange(e.target.value)}
                        className="h-6 flex-1 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onConfirm();
                          if (e.key === "Escape") onCancel();
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={onConfirm}
                      >
                        <Check className="h-2.5 w-2.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onCancel}>
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="group flex flex-1 cursor-pointer items-center gap-1 truncate text-xs hover:text-primary"
                      onClick={() => onStartEdit(fieldPath, val)}
                    >
                      {val || "—"}
                      <Pencil className="h-2.5 w-2.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                  )}
                  {fieldConf != null && fieldConf > 0 && <ConfidenceBadge value={fieldConf} />}
                </div>
                {showHint && (
                  <button
                    type="button"
                    className="ml-16 flex items-center gap-1 text-[10px] text-primary/60 hover:text-primary"
                    onClick={() => onStartEdit(fieldPath, defaultVal)}
                  >
                    <Sparkles className="h-2 w-2" />
                    {defaultVal}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Boxes section (collapsible)                                        */
/* ------------------------------------------------------------------ */

function BoxesSection({ boxes }: { boxes: DraftDetail["shipment_data"]["shipment_boxes"] }) {
  const [expanded, setExpanded] = useState(false);
  const showing = expanded ? boxes : boxes.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Boxes ({boxes.length})</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {showing.map((box, i) => (
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
        {boxes.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                Show all {boxes.length} boxes
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Nested value helper                                                */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

const TAB_CONFIG: { value: DraftTab; label: string; icon: typeof Clock }[] = [
  { value: "pending_review", label: "Pending Review", icon: Clock },
  { value: "approved", label: "Approved", icon: CircleCheck },
  { value: "rejected", label: "Rejected", icon: CircleX },
];

export default function B2BAgentPage() {
  const agent = useB2BAgent();
  const [files, setFiles] = useState<File[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  // Load drafts + check for in-flight jobs on mount
  useEffect(() => {
    agent.fetchDrafts();
    agent.checkActiveJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = useCallback(() => {
    if (files.length === 0) return;
    agent.upload(files);
    setFiles([]);
    setShowUpload(false);
  }, [files, agent]);

  const handleApprove = useCallback(
    async (draftId: string) => {
      await agent.approveDraft(draftId);
    },
    [agent],
  );

  return (
    <PageContainer>
        <PageHeader
          title="B2B Booking Agent"
          description="Upload shipment documents, AI extracts and groups into draft shipments for review."
          icon={<Bot className="h-5 w-5" />}
        />

        {/* ── Upload zone (toggle) ─────────────────────────── */}
        <div className="mb-6">
          {!showUpload ? (
            <Button variant="outline" onClick={() => setShowUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          ) : (
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <Card>
                <CardContent className="p-5">
                  <FileUploadZone
                    accept=".pdf"
                    multiple
                    maxFiles={20}
                    onFiles={setFiles}
                    label="Drop PDF files here"
                    description="Upload 1-20 invoices, packing lists, certificates, or other shipment documents"
                  />
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" disabled={files.length === 0} onClick={handleUpload}>
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Process {files.length} file{files.length !== 1 ? "s" : ""}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowUpload(false);
                        setFiles([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* ── Error banner ─────────────────────────────────── */}
        {agent.error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {agent.error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => agent.setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* ── Processing banner (non-blocking) ─────────────── */}
        <AnimatePresence>
          {agent.processing && (
            <ProcessingBanner progress={agent.progress} label={agent.progressLabel} />
          )}
        </AnimatePresence>

        {/* ── Draft detail view ─────────────────────────────── */}
        {agent.activeDraft ? (
          <DraftDetailView
            key={`detail-${agent.activeDraft.id}`}
            draft={agent.activeDraft}
            onBack={() => agent.setActiveDraft(null)}
            onCorrect={(corrections) =>
              agent.applyCorrections(agent.activeDraft!.id, corrections)
            }
            loading={agent.loading}
            sellerProfile={agent.sellerProfile}
          />
        ) : (
          <>
            {/* ── Tabs ───────────────────────────────────────── */}
            <Tabs
              value={agent.activeTab}
              onValueChange={(v) => agent.switchTab(v as DraftTab)}
              className="mb-4"
            >
              <TabsList>
                {TAB_CONFIG.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* ── Draft list ─────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {agent.loading && agent.drafts.length === 0 ? (
                <motion.div
                  key="loading"
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="py-12 text-center"
                >
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading drafts...</p>
                </motion.div>
              ) : agent.drafts.length === 0 ? (
                <motion.div
                  key="empty"
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No {agent.activeTab.replace("_", " ")} drafts found.
                      {agent.activeTab === "pending_review" &&
                        " Upload files above to create new drafts."}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key={agent.activeTab}
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <p className="text-xs text-muted-foreground">
                    {agent.draftsTotal} draft(s)
                  </p>
                  {agent.drafts.map((draft) => (
                    <DraftCard
                      key={draft.id}
                      draft={draft}
                      onView={() => agent.fetchDraft(draft.id)}
                      onApprove={() => handleApprove(draft.id)}
                      onReject={() => agent.rejectDraft(draft.id)}
                      loading={agent.loading}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
    </PageContainer>
  );
}
