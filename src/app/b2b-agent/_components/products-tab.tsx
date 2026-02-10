"use client";

import { Plus, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { currencySymbol } from "./editable-fields";
import type { ProductDetail } from "@/types/agent";

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
  const set = (field: keyof ProductDetail, value: unknown) => {
    onChange(index, { ...product, [field]: value });
  };

  return (
    <tr className="group border-b border-border/40 last:border-0">
      <td className="py-1.5 pr-2">
        <Input
          value={product.product_description}
          onChange={(e) => set("product_description", e.target.value)}
          className="h-7 text-xs"
          placeholder="Product description"
        />
      </td>
      <td className="py-1.5 pr-2">
        <Input
          value={product.hsn_code}
          onChange={(e) => set("hsn_code", e.target.value)}
          className="h-7 font-mono text-xs"
          placeholder="HSN code"
        />
      </td>
      <td className="py-1.5 pr-2">
        <Input
          type="number"
          value={product.value ?? ""}
          onChange={(e) => set("value", Number(e.target.value) || 0)}
          className="h-7 text-right text-xs"
          placeholder="0"
        />
      </td>
      <td className="py-1.5 pr-2">
        <Input
          value={product.country_of_origin ?? ""}
          onChange={(e) => set("country_of_origin", e.target.value)}
          className="h-7 text-xs"
          placeholder="IN"
        />
      </td>
      <td className="py-1.5 pr-2">
        <Input
          type="number"
          value={product.unit_price ?? ""}
          onChange={(e) => set("unit_price", e.target.value ? Number(e.target.value) : null)}
          className="h-7 text-right text-xs"
          placeholder="0"
        />
      </td>
      <td className="py-1.5 pr-2">
        <Input
          type="number"
          value={product.duty_rate ?? ""}
          onChange={(e) => set("duty_rate", e.target.value ? Number(e.target.value) : null)}
          className="h-7 text-right text-xs"
          placeholder="%"
        />
      </td>
      <td className="py-1.5 pr-2">
        <Input
          type="number"
          value={product.igst_percent ?? ""}
          onChange={(e) => set("igst_percent", e.target.value ? Number(e.target.value) : null)}
          className="h-7 text-right text-xs"
          placeholder="%"
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

/* ── Props ────────────────────────────────────────────────── */

interface ProductsTabProps {
  products: ProductDetail[];
  productsModified: boolean;
  setLocalProducts: (products: ProductDetail[] | null) => void;
  previousProducts?: ProductDetail[];
  currency?: string;
}

/* ── Component ────────────────────────────────────────────── */

export function ProductsTab({
  products,
  productsModified,
  setLocalProducts,
  previousProducts,
  currency,
}: ProductsTabProps) {
  const sym = currencySymbol(currency);
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

  return (
    <TabsContent value="products" className="mt-0 px-6 py-4">
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
              <th className="px-3 py-2 w-20 text-right">Value {sym && <span className="normal-case">({sym})</span>}</th>
              <th className="px-3 py-2 w-16">Origin</th>
              <th className="px-3 py-2 w-20 text-right">Unit Price {sym && <span className="normal-case">({sym})</span>}</th>
              <th className="px-3 py-2 w-16 text-right">Duty %</th>
              <th className="px-3 py-2 w-16 text-right">IGST %</th>
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
                <td colSpan={8} className="px-3 py-6 text-center text-xs text-muted-foreground">
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
                <span className="max-w-[180px] truncate">{p.product_description}</span>
                {p.hsn_code && (
                  <span className="font-mono text-[10px] text-muted-foreground">{p.hsn_code}</span>
                )}
                {p.country_of_origin && (
                  <span className="text-[10px] text-muted-foreground">{p.country_of_origin}</span>
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
