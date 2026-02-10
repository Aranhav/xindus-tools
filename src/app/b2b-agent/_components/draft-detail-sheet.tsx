"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Download,
  ArrowRight,
  Package,
  Receipt,
  MapPin,
  Settings2,
  RefreshCw,
  ChevronDown,
  FileSpreadsheet,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { ProductsTab } from "./products-tab";
import { AddressForm } from "./address-form";
import { BoxEditor } from "./box-editor";
import { SellerMatch } from "./seller-match";
import { SelectField, CURRENCY_OPTIONS } from "./editable-fields";
import { DraftStatusBadge } from "./draft-table";
import { getNestedValue } from "./helpers";
import type {
  DraftDetail,
  CorrectionItem,
  ShipmentAddress,
  ShipmentBox,
  ProductDetail,
  SellerProfile,
  SellerMatchResult,
  SellerHistory,
} from "@/types/agent";

/* ── Main Component ───────────────────────────────────────── */

interface DraftDetailSheetProps {
  draft: DraftDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCorrect: (draftId: string, corrections: CorrectionItem[]) => void;
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
  onReExtract: (draftId: string) => Promise<void> | void;
  loading: boolean;
  sellerProfile?: SellerProfile | null;
  onSearchSeller: (name: string) => Promise<SellerMatchResult | null>;
  onLinkSeller: (draftId: string, sellerId: string) => Promise<unknown>;
  onAddFiles: (draftId: string, files: File[]) => Promise<DraftDetail | null>;
  onRemoveFile: (draftId: string, fileId: string) => Promise<DraftDetail | null>;
  onDownloadFile: (draftId: string, fileId: string) => void;
  sellerHistory?: SellerHistory | null;
  onFetchSellerHistory?: (sellerId: string) => Promise<SellerHistory | null>;
}

export function DraftDetailSheet({
  draft,
  open,
  onOpenChange,
  onCorrect,
  onApprove,
  onReject,
  onReExtract,
  loading,
  sellerProfile,
  onSearchSeller,
  onLinkSeller,
  onAddFiles,
  onRemoveFile,
  onDownloadFile,
  sellerHistory,
  onFetchSellerHistory,
}: DraftDetailSheetProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [localBoxes, setLocalBoxes] = useState<ShipmentBox[] | null>(null);
  const [localProducts, setLocalProducts] = useState<ProductDetail[] | null>(null);
  const [reExtracting, setReExtracting] = useState(false);

  // Refs for stable access inside debounced effects
  const draftRef = useRef(draft);
  const dataRef = useRef<ReturnType<() => typeof data>>(null);
  draftRef.current = draft;

  const data = draft ? draft.corrected_data || draft.shipment_data : null;
  dataRef.current = data;
  const sellerDefaults = (sellerProfile?.defaults ?? {}) as Record<string, unknown>;
  const isActionable = draft?.status === "pending_review";

  const boxes = localBoxes ?? data?.shipment_boxes ?? [];
  const products = localProducts ?? data?.product_details ?? [];

  // Live computation of multi_address — mirrors backend _check_multi_address
  const computedMultiAddress = useMemo(() => {
    if (boxes.length <= 1) return false;
    const first = boxes[0]?.receiver_address as unknown as Record<string, string> | undefined;
    const firstKey = `${first?.address ?? ""}|${first?.city ?? ""}|${first?.zip ?? ""}`;
    for (let i = 1; i < boxes.length; i++) {
      const addr = boxes[i]?.receiver_address as unknown as Record<string, string> | undefined;
      const key = `${addr?.address ?? ""}|${addr?.city ?? ""}|${addr?.zip ?? ""}`;
      if (key !== firstKey && (addr?.address || addr?.city || addr?.zip)) return true;
    }
    return false;
  }, [boxes]);

  /* ── Auto-save: inline field edits ─────────────────────── */

  const startEdit = useCallback((fieldPath: string, currentValue: string) => {
    setEditingField(fieldPath);
    setEditValue(currentValue);
  }, []);

  const confirmEdit = useCallback(() => {
    if (!editingField || !data || !draft) return;
    const oldValue = getNestedValue(data, editingField);
    if (String(oldValue ?? "") !== editValue) {
      onCorrect(draft.id, [
        { field_path: editingField, old_value: oldValue, new_value: editValue },
      ]);
    }
    setEditingField(null);
  }, [editingField, editValue, data, draft, onCorrect]);

  const cancelEdit = useCallback(() => setEditingField(null), []);

  /* ── Auto-save: dropdown / select field changes ────────── */

  const addFieldCorrection = useCallback(
    (fieldPath: string, oldVal: unknown, newVal: unknown) => {
      if (!draft) return;
      onCorrect(draft.id, [
        { field_path: fieldPath, old_value: oldVal, new_value: newVal },
      ]);
    },
    [draft, onCorrect],
  );

  /* ── Auto-save: address form changes ───────────────────── */

  const addCorrections = useCallback((corrections: CorrectionItem[]) => {
    if (!draft || corrections.length === 0) return;
    onCorrect(draft.id, corrections);
  }, [draft, onCorrect]);

  /* ── Auto-save: boxes (debounced 800ms) ────────────────── */

  useEffect(() => {
    if (!localBoxes) return;
    const timer = setTimeout(() => {
      const d = draftRef.current;
      const dd = dataRef.current;
      if (d && dd) {
        onCorrect(d.id, [{
          field_path: "shipment_boxes",
          old_value: dd.shipment_boxes,
          new_value: localBoxes,
        }]);
      }
      setLocalBoxes(null);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localBoxes]);

  /* ── Receiver sync: box[0] receiver → top-level receiver_address ── */

  useEffect(() => {
    if (!localBoxes || computedMultiAddress) return;
    const firstReceiver = localBoxes[0]?.receiver_address;
    if (!firstReceiver) return;
    const timer = setTimeout(() => {
      const d = draftRef.current;
      const dd = dataRef.current;
      if (!d || !dd) return;
      const current = dd.receiver_address as unknown as Record<string, string>;
      const corrections: CorrectionItem[] = [];
      for (const key of ["name", "address", "city", "state", "zip", "country", "phone", "email"] as const) {
        const newVal = (firstReceiver as unknown as Record<string, string>)[key] || "";
        const oldVal = String(current?.[key] ?? "");
        if (newVal !== oldVal) {
          corrections.push({ field_path: `receiver_address.${key}`, old_value: oldVal, new_value: newVal });
        }
      }
      if (corrections.length > 0) {
        onCorrect(d.id, corrections);
      }
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localBoxes]);

  /* ── Initialize: populate empty box receivers from top-level ── */

  useEffect(() => {
    if (!data || !draft) return;
    if (computedMultiAddress) return;
    const topReceiver = data.receiver_address;
    if (!topReceiver?.name) return;
    const currentBoxes = data.shipment_boxes;
    if (!currentBoxes?.length) return;
    // Check if any box has an empty receiver
    const needsInit = currentBoxes.some((b: ShipmentBox) => !b.receiver_address?.name);
    if (!needsInit) return;
    const updated = currentBoxes.map((b: ShipmentBox) =>
      b.receiver_address?.name ? b : { ...b, receiver_address: { ...topReceiver } }
    );
    setLocalBoxes(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id]);

  /* ── Auto-calculate multi_address_destination_delivery ──── */

  useEffect(() => {
    if (!data || !draft) return;
    if (computedMultiAddress === !!data.multi_address_destination_delivery) return;

    const timer = setTimeout(() => {
      const d = draftRef.current;
      const dd = dataRef.current;
      if (d && dd) {
        onCorrect(d.id, [{
          field_path: "multi_address_destination_delivery",
          old_value: dd.multi_address_destination_delivery,
          new_value: computedMultiAddress,
        }]);
      }
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedMultiAddress]);

  /* ── Auto-calculate amazon_fba from marketplace ─────────── */

  useEffect(() => {
    if (!data || !draft) return;
    const computedFba = data.marketplace === "AMAZON_FBA";
    if (computedFba === !!data.amazon_fba) return;

    const timer = setTimeout(() => {
      const d = draftRef.current;
      const dd = dataRef.current;
      if (d && dd) {
        onCorrect(d.id, [{
          field_path: "amazon_fba",
          old_value: dd.amazon_fba,
          new_value: computedFba,
        }]);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.marketplace]);

  /* ── Auto-save: products (debounced 800ms) ─────────────── */

  useEffect(() => {
    if (!localProducts) return;
    const timer = setTimeout(() => {
      const d = draftRef.current;
      const dd = dataRef.current;
      if (d && dd) {
        onCorrect(d.id, [{
          field_path: "product_details",
          old_value: dd.product_details,
          new_value: localProducts,
        }]);
      }
      setLocalProducts(null);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localProducts]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setEditingField(null);
        setLocalBoxes(null);
        setLocalProducts(null);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  // Reset when draft changes + fetch seller history
  useEffect(() => {
    setLocalBoxes(null);
    setLocalProducts(null);
    if (draft?.seller_id && onFetchSellerHistory) {
      onFetchSellerHistory(draft.seller_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id]);

  if (!draft || !data) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="sm:max-w-3xl" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Loading draft</SheetTitle>
        </SheetContent>
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

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-3xl" showCloseButton>
        {/* ── Header ────────────────────────────────────────── */}
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="truncate text-lg">
                  <span className="font-mono text-muted-foreground">
                    {draft.draft_number ? `B2B-${String(draft.draft_number).padStart(3, "0")}` : `#${draft.id.substring(0, 8)}`}
                  </span>
                  {data.invoice_number && <span className="ml-2">INV {data.invoice_number}</span>}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Download className="h-3.5 w-3.5" />
                    Excel
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => window.open(`/api/b2b-agent/drafts/${draft.id}/download?format=xpressb2b`, "_blank")}
                  >
                    <Table2 className="mr-2 h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">XpressB2B Sheet</p>
                      <p className="text-xs text-muted-foreground">Xindus bulk upload format</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.open(`/api/b2b-agent/drafts/${draft.id}/download?format=summary`, "_blank")}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">Summary Sheet</p>
                      <p className="text-xs text-muted-foreground">Full draft with all details</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Seller match */}
          <div className="mt-2">
            <SellerMatch
              shipperName={data.shipper_address?.name}
              currentSeller={sellerProfile}
              isActionable={isActionable}
              onSearch={onSearchSeller}
              onLink={(sellerId) => onLinkSeller(draft.id, sellerId)}
              onApplyCorrections={(corrections) => {
                if (corrections.length > 0 && draft) {
                  onCorrect(draft.id, corrections);
                }
              }}
              loading={loading}
            />
          </div>
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
                Products ({products.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {/* ── Overview tab ──────────────────────────────── */}
            <OverviewTab
              data={data}
              fieldProps={fieldProps}
              addFieldCorrection={addFieldCorrection}
              isActionable={isActionable}
              draft={draft}
              sellerDefaults={sellerDefaults}
              onAddFiles={onAddFiles}
              onRemoveFile={onRemoveFile}
              onDownloadFile={onDownloadFile}
              loading={loading}
            />

            {/* ── Addresses tab (Billing + IOR only) ────────── */}
            <TabsContent value="addresses" className="mt-0 px-6 py-4">
              <div className="relative space-y-0">
                {/* Billing card */}
                <AddressForm
                  label="Billing (Consignee)"
                  address={data.billing_address}
                  basePath="billing_address"
                  confidence={draft.confidence_scores?.billing_address as Record<string, number> | undefined}
                  sellerDefault={sellerDefaults.billing_address as ShipmentAddress | undefined}
                  onCorrections={addCorrections}
                  icon="billing"
                  previousAddresses={sellerHistory?.billing_addresses}
                />
                {/* Connector */}
                <div className="relative z-10 flex justify-center -my-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm">
                    <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground" />
                  </div>
                </div>
                {/* IOR card */}
                <AddressForm
                  label="Importer of Record"
                  address={data.ior_address}
                  basePath="ior_address"
                  confidence={draft.confidence_scores?.ior_address as Record<string, number> | undefined}
                  sellerDefault={sellerDefaults.ior_address as ShipmentAddress | undefined}
                  onCorrections={addCorrections}
                  icon="ior"
                  previousAddresses={sellerHistory?.ior_addresses}
                />
              </div>
            </TabsContent>

            {/* ── Boxes tab ─────────────────────────────────── */}
            <TabsContent value="boxes" className="mt-0 px-6 py-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="rounded-md border border-blue-200/50 bg-blue-50/50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/30 dark:text-blue-300">
                  Physical items with dimensions &mdash; maps to <code className="font-semibold">shipment_box_items</code>
                </div>
                <div className="w-36 shrink-0">
                  <SelectField
                    label="Billing Currency"
                    value={data.billing_currency}
                    fieldPath="billing_currency"
                    options={CURRENCY_OPTIONS}
                    onChanged={addFieldCorrection}
                    sellerDefault={sellerDefaults.billing_currency as string | undefined}
                  />
                </div>
              </div>
              {localBoxes !== null && (
                <Badge variant="outline" className="mb-2 text-[10px] text-primary">
                  Saving...
                </Badge>
              )}
              <BoxEditor boxes={boxes} onChange={setLocalBoxes} multiAddress={computedMultiAddress} previousReceiverAddresses={sellerHistory?.receiver_addresses} />
            </TabsContent>

            {/* ── Customs Products tab ──────────────────────── */}
            <ProductsTab
              products={products}
              productsModified={localProducts !== null}
              setLocalProducts={setLocalProducts}
              previousProducts={sellerHistory?.products}
            />
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
            {isActionable && (
              <Button
                variant="outline"
                size="sm"
                disabled={reExtracting || loading}
                onClick={async () => {
                  setReExtracting(true);
                  try {
                    await onReExtract(draft.id);
                  } finally {
                    setReExtracting(false);
                  }
                }}
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${reExtracting ? "animate-spin" : ""}`} />
                Re-extract
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
