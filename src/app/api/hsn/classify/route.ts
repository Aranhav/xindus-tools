import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Transform the HSN classifier backend response to match frontend types.
 *
 * Backend returns:
 *   { ok, data: { kind, humanTitle, classifications: { US: { code: { fullCode } }, IN: { code: { fullCode } } },
 *     confidence: { top1 }, alternatives: [...] } }
 *
 * Frontend expects:
 *   { classification: { hsn_code, hts_code, description, confidence }, alternatives: [...] }
 */
function transformClassifyResponse(raw: any) {
  if (!raw.ok || !raw.data) {
    return { error: raw.error || "Classification failed" };
  }

  const d = raw.data;

  const classification = {
    hsn_code: d.classifications?.IN?.code?.fullCode || "",
    hts_code: d.classifications?.US?.code?.fullCode || "",
    description: d.humanTitle || "",
    confidence: d.confidence?.top1 ?? 0,
  };

  const alternatives = (d.alternatives || []).map((alt: any) => ({
    hsn_code: alt.classifications?.IN?.code?.fullCode || "",
    hts_code: alt.classifications?.US?.code?.fullCode || "",
    description: alt.humanTitle || "",
    confidence: alt.confidence ?? 0,
  }));

  return {
    classification,
    alternatives,
    product_description: d.humanTitle || undefined,
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
