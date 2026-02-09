"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
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

/* ── Props ────────────────────────────────────────────────── */

interface ProductsTabProps {
  products: ProductDetail[];
  productsModified: boolean;
  setLocalProducts: (products: ProductDetail[] | null) => void;
}

/* ── Component ────────────────────────────────────────────── */

export function ProductsTab({
  products,
  productsModified,
  setLocalProducts,
}: ProductsTabProps) {
  return (
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
  );
}
