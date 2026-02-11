"use client";

import { useState, useCallback } from "react";
import { Plus, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { currencySymbol } from "./editable-fields";
import { ProductRow } from "./product-row";
import type { ProductDetail, ShipmentBox, TariffLookupResult } from "@/types/agent";

/* ── Tariff lookup helper ────────────────────────────────── */

async function lookupTariff(
  tariffCode: string,
  destination: string,
  origin: string,
): Promise<TariffLookupResult | null> {
  try {
    const res = await fetch("/api/b2b-agent/tariff-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tariff_code: tariffCode,
        destination_country: destination,
        origin_country: origin,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ── Helpers: propagate product changes to matching box items ── */

function propagateProductToBoxItems(
  boxes: ShipmentBox[],
  oldProduct: ProductDetail,
  newProduct: ProductDetail,
): ShipmentBox[] | null {
  const matchDesc = oldProduct.product_description.toLowerCase().trim();
  if (!matchDesc) return null;

  // Build a patch of only changed fields
  const patch: Record<string, unknown> = {};
  if (oldProduct.product_description !== newProduct.product_description)
    patch.description = newProduct.product_description;
  if (oldProduct.ihsn !== newProduct.ihsn)
    patch.ihsn = newProduct.ihsn ?? "";
  if (oldProduct.hsn_code !== newProduct.hsn_code)
    patch.ehsn = newProduct.hsn_code ?? "";
  if (oldProduct.duty_rate !== newProduct.duty_rate)
    patch.duty_rate = newProduct.duty_rate;
  if (oldProduct.base_duty_rate !== newProduct.base_duty_rate)
    patch.base_duty_rate = newProduct.base_duty_rate;
  if (oldProduct.tariff_scenarios !== newProduct.tariff_scenarios)
    patch.tariff_scenarios = newProduct.tariff_scenarios;
  if (oldProduct.country_of_origin !== newProduct.country_of_origin)
    patch.country_of_origin = newProduct.country_of_origin ?? "";
  if (oldProduct.unit_price !== newProduct.unit_price)
    patch.unit_price = newProduct.unit_price;
  if (oldProduct.igst_percent !== newProduct.igst_percent)
    patch.igst_amount = newProduct.igst_percent;
  if (oldProduct.gaia_classified !== newProduct.gaia_classified)
    patch.gaia_classified = newProduct.gaia_classified;
  if (oldProduct.hsn_confidence !== newProduct.hsn_confidence)
    patch.hsn_confidence = newProduct.hsn_confidence;

  if (Object.keys(patch).length === 0) return null;

  let anyUpdated = false;
  const updated = boxes.map((box) => ({
    ...box,
    shipment_box_items: box.shipment_box_items.map((item) => {
      if (item.description.toLowerCase().trim() !== matchDesc) return item;
      anyUpdated = true;
      return { ...item, ...patch };
    }),
  }));
  return anyUpdated ? updated : null;
}

/* ── Props ────────────────────────────────────────────────── */

interface ProductsTabProps {
  products: ProductDetail[];
  productsModified: boolean;
  setLocalProducts: (products: ProductDetail[] | null) => void;
  previousProducts?: ProductDetail[];
  currency?: string;
  destinationCountry?: string;
  boxes?: ShipmentBox[];
  onBoxItemsUpdate?: (boxes: ShipmentBox[]) => void;
  onClassify?: () => Promise<unknown>;
}

/* ── Component ────────────────────────────────────────────── */

export function ProductsTab({
  products,
  productsModified,
  setLocalProducts,
  previousProducts,
  currency,
  destinationCountry,
  boxes,
  onBoxItemsUpdate,
  onClassify,
}: ProductsTabProps) {
  const sym = currencySymbol(currency);
  const [recalcIdx, setRecalcIdx] = useState<number | null>(null);
  const [classifying, setClassifying] = useState(false);

  // Filter out products that are already in the current list
  const currentKeys = new Set(
    products.map((p) => `${p.product_description.toLowerCase()}|${p.hsn_code.toLowerCase()}`),
  );
  const available = (previousProducts ?? []).filter(
    (p) => !currentKeys.has(`${p.product_description.toLowerCase()}|${p.hsn_code.toLowerCase()}`),
  );

  const addPrevious = (p: ProductDetail) => {
    setLocalProducts([...products, { ...p }]);
  };

  const handleRecalculate = useCallback(async (idx: number) => {
    const product = products[idx];
    if (!product?.ihsn) return;

    setRecalcIdx(idx);
    try {
      const result = await lookupTariff(
        product.ihsn,
        destinationCountry || "US",
        product.country_of_origin || "IN",
      );
      if (!result) {
        toast.error("Tariff lookup failed", {
          description: `No tariff data found for ${product.ihsn}`,
        });
        return;
      }

      // Update product
      const oldProduct = products[idx];
      const updatedProduct: ProductDetail = {
        ...oldProduct,
        duty_rate: result.duty_rate,
        base_duty_rate: result.base_duty_rate,
        tariff_scenarios: result.tariff_scenarios,
        gaia_classified: true,
      };
      const next = [...products];
      next[idx] = updatedProduct;
      setLocalProducts(next);

      // Propagate to matching box items
      if (boxes && onBoxItemsUpdate) {
        const updatedBoxes = propagateProductToBoxItems(boxes, oldProduct, updatedProduct);
        if (updatedBoxes) onBoxItemsUpdate(updatedBoxes);
      }

      toast.success("Duty recalculated", {
        description: `${result.duty_rate}% for ${product.ihsn}`,
      });
    } catch {
      toast.error("Tariff lookup failed");
    } finally {
      setRecalcIdx(null);
    }
  }, [products, destinationCountry, boxes, onBoxItemsUpdate, setLocalProducts]);

  /* ── Save handler from ProductRow edit mode ──────────────── */

  const handleProductSave = useCallback(async (
    idx: number,
    updated: ProductDetail,
    original: ProductDetail,
  ) => {
    const next = [...products];
    next[idx] = updated;
    setLocalProducts(next);

    // Propagate to box items — use ORIGINAL description for matching
    if (boxes && onBoxItemsUpdate) {
      const updatedBoxes = propagateProductToBoxItems(boxes, original, updated);
      if (updatedBoxes) onBoxItemsUpdate(updatedBoxes);
    }

    // Auto-recalculate duty if IHSN changed
    if (updated.ihsn && updated.ihsn !== original.ihsn) {
      setRecalcIdx(idx);
      try {
        const result = await lookupTariff(
          updated.ihsn,
          destinationCountry || "US",
          updated.country_of_origin || "IN",
        );
        if (result) {
          const withDuty: ProductDetail = {
            ...updated,
            duty_rate: result.duty_rate,
            base_duty_rate: result.base_duty_rate,
            tariff_scenarios: result.tariff_scenarios,
            gaia_classified: true,
          };
          const next2 = [...products];
          next2[idx] = withDuty;
          setLocalProducts(next2);

          if (boxes && onBoxItemsUpdate) {
            const dutyBoxes = propagateProductToBoxItems(boxes, original, withDuty);
            if (dutyBoxes) onBoxItemsUpdate(dutyBoxes);
          }

          toast.success("Duty recalculated", {
            description: `${result.duty_rate}% for ${updated.ihsn}`,
          });
        }
      } catch {
        // Tariff lookup failed — product changes still saved
      } finally {
        setRecalcIdx(null);
      }
    }
  }, [products, boxes, onBoxItemsUpdate, setLocalProducts, destinationCountry]);

  const handleClassify = useCallback(async () => {
    if (!onClassify) return;
    setClassifying(true);
    try {
      await onClassify();
    } finally {
      setClassifying(false);
    }
  }, [onClassify]);

  return (
    <TabsContent value="products" className="mt-0 px-6 py-4">
      <div className="mb-2 flex items-center gap-2">
        {productsModified && (
          <Badge variant="outline" className="text-[11px] text-primary">
            Modified (unsaved)
          </Badge>
        )}
        <div className="flex-1" />
        {onClassify && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            disabled={classifying}
            onClick={handleClassify}
          >
            <RefreshCw className={`h-3 w-3 ${classifying ? "animate-spin" : ""}`} />
            {classifying ? "Classifying..." : "Classify with Gaia"}
          </Button>
        )}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 w-28">Export HSN</th>
              <th className="px-3 py-2 w-28">Import HSN</th>
              <th className="px-3 py-2 w-20 text-right">Value {sym && <span className="normal-case">({sym})</span>}</th>
              <th className="px-3 py-2 w-16">Origin</th>
              <th className="px-3 py-2 w-20 text-right">Unit Price {sym && <span className="normal-case">({sym})</span>}</th>
              <th className="px-3 py-2 w-20 text-right">Duty %</th>
              <th className="px-3 py-2 w-16 text-right">IGST %</th>
              <th className="px-3 py-2 w-12" />
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <ProductRow
                key={i}
                product={p}
                index={i}
                onSave={handleProductSave}
                onRemove={(idx) => {
                  setLocalProducts(products.filter((_, j) => j !== idx));
                }}
                onRecalculate={handleRecalculate}
                recalculating={recalcIdx === i}
              />
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-xs text-muted-foreground">
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
            { product_description: "", hsn_code: "", value: 0, country_of_origin: "IN" },
          ]);
        }}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Product
      </Button>

      {/* Previous shipment products */}
      {available.length > 0 && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
            <History className="h-3.5 w-3.5" />
            From previous shipments
          </div>
          <div className="flex flex-wrap gap-1.5">
            {available.map((p, i) => (
              <button
                key={i}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-background px-2.5 py-1 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
                onClick={() => addPrevious(p)}
              >
                <span className="max-w-[240px] truncate">{p.product_description}</span>
                {p.hsn_code && (
                  <span className="font-mono text-[11px] text-muted-foreground">{p.hsn_code}</span>
                )}
                {p.country_of_origin && (
                  <span className="text-[11px] text-muted-foreground">{p.country_of_origin}</span>
                )}
                <Plus className="h-3 w-3 text-primary" />
              </button>
            ))}
          </div>
        </div>
      )}
    </TabsContent>
  );
}
