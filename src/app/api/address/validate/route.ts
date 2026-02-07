import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Transform the Smarty raw response to match the frontend AddressValidationResult type.
 *
 * Backend returns:
 *   { validation: [{ components, metadata, analysis, delivery_line_1, ... }], isValid, isUS }
 *
 * Frontend expects:
 *   { is_valid, input_address, normalized_address, dpv_analysis, metadata, footnotes }
 */
function transformValidationResponse(input: any, data: any) {
  const candidate = data.validation?.[0];

  // Construct input_address from the original request
  const input_address = {
    street: input.street || "",
    secondary: input.secondary || "",
    city: input.city || "",
    state: input.state || "",
    zipcode: input.zipcode || "",
    country: input.country || "US",
  };

  // Build normalized address from Smarty components
  let normalized_address = undefined;
  if (candidate?.components) {
    const c = candidate.components;
    const streetParts = [
      c.primary_number,
      c.street_predirection,
      c.street_name,
      c.street_suffix,
      c.street_postdirection,
    ]
      .filter(Boolean)
      .join(" ");

    const secondaryParts = [c.secondary_designator, c.secondary_number]
      .filter(Boolean)
      .join(" ");

    normalized_address = {
      street: streetParts || candidate.delivery_line_1 || input.street,
      secondary: secondaryParts || candidate.delivery_line_2 || "",
      city: c.city_name || input.city,
      state: c.state_abbreviation || input.state,
      zipcode: c.plus4_code ? `${c.zipcode}-${c.plus4_code}` : c.zipcode || input.zipcode,
      country: input.country || "US",
    };
  }

  // Map DPV analysis
  let dpv_analysis = undefined;
  if (candidate?.analysis) {
    const a = candidate.analysis;
    dpv_analysis = {
      dpv_match_code: a.dpv_match_code || "",
      dpv_footnotes: a.dpv_footnotes || "",
      dpv_cmra: a.dpv_cmra || "",
      dpv_vacant: a.dpv_vacant || "",
      dpv_no_stat: a.dpv_no_stat || "",
      active: a.active || "",
    };
  }

  // Map metadata
  let metadata = undefined;
  if (candidate?.metadata) {
    const m = candidate.metadata;
    metadata = {
      county_name: m.county_name || undefined,
      carrier_route: m.carrier_route || undefined,
      building_default_indicator: m.building_default_indicator || undefined,
      rdi: m.rdi || undefined,
      latitude: m.latitude ?? undefined,
      longitude: m.longitude ?? undefined,
    };
  }

  // Map footnotes
  const footnotes: string[] = [];
  if (candidate?.analysis?.footnotes) {
    // Smarty footnotes are 2-char codes concatenated, e.g. "N#"
    const fn = candidate.analysis.footnotes;
    for (let i = 0; i < fn.length; i += 2) {
      footnotes.push(fn.substring(i, i + 2));
    }
  }

  return {
    is_valid: data.isValid ?? false,
    input_address,
    normalized_address,
    dpv_analysis,
    metadata,
    footnotes: footnotes.length > 0 ? footnotes : undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await proxyFetch("address", "/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(transformValidationResponse(body, data));
  } catch (err) {
    return errorResponse(err);
  }
}
