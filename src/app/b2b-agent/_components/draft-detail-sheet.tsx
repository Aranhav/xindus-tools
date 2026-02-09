"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Download,
  ArrowRight,
  Package,
  Receipt,
  MapPin,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stat } from "./editable-fields";
import { OverviewTab } from "./overview-tab";
import { ProductsTab } from "./products-tab";
import { AddressForm } from "./address-form";
import { BoxEditor } from "./box-editor";
import { SellerMatch } from "./seller-match";
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
} from "@/types/agent";

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
  onSearchSeller: (name: string) => Promise<SellerMatchResult | null>;
  onLinkSeller: (draftId: string, sellerId: string) => Promise<unknown>;
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
  onSearchSeller,
  onLinkSeller,
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
  useEffect(() => {
    setLocalBoxes(null);
    setLocalProducts(null);
    setPendingCorrections([]);
  }, [draft?.id]);

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

          {/* Seller match */}
          <div className="mt-2">
            <SellerMatch
              shipperName={data.shipper_address?.name}
              currentSeller={sellerProfile}
              isActionable={isActionable}
              onSearch={onSearchSeller}
              onLink={(sellerId) => onLinkSeller(draft.id, sellerId)}
              onApplyDefaults={(corrections) => {
                if (corrections.length > 0) {
                  setPendingCorrections((prev) => [...prev, ...corrections]);
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
                Customs ({products.length})
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
            />

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
            <ProductsTab
              products={products}
              productsModified={productsModified}
              setLocalProducts={setLocalProducts}
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
