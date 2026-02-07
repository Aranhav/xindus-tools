import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Transform a single item from the backend into our frontend format.
 */
function transformItem(item: any) {
  return {
    classification: {
      hsn_code: item.classifications?.IN?.code?.fullCode || "",
      hts_code: item.classifications?.US?.code?.fullCode || "",
      description: item.humanTitle || "",
      confidence: item.confidence?.top1 ?? item.confidence ?? 0,
    },
    alternatives: (item.alternatives || []).map((alt: any) => ({
      hsn_code: alt.classifications?.IN?.code?.fullCode || "",
      hts_code: alt.classifications?.US?.code?.fullCode || "",
      description: alt.humanTitle || "",
      confidence: alt.confidence?.top1 ?? alt.confidence ?? 0,
    })),
  };
}

/**
 * Transform the HSN classifier backend response.
 *
 * Backend can return two formats:
 *   kind: "single" — one product with classifications directly on data
 *   kind: "multi"  — multiple products in data.items[]
 */
function transformClassifyResponse(raw: any) {
  if (!raw.ok || !raw.data) {
    return { error: raw.error || "Classification failed", products: [] };
  }

  const d = raw.data;
  let products;

  if (d.kind === "multi" && Array.isArray(d.items)) {
    products = d.items.map(transformItem);
  } else {
    // Single product — data itself has classifications
    products = [transformItem(d)];
  }

  return {
    products,
    source: d.modelVersion || undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const res = await proxyFetch("hsn", "/api/classify", {
      method: "POST",
      body: formData,
      timeout: 60000,
    });
    const data = await res.json();
    return Response.json(transformClassifyResponse(data));
  } catch (err) {
    return errorResponse(err);
  }
}
