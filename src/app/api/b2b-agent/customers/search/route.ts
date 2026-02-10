import { NextRequest } from "next/server";
import { queryMetabase, rowsToObjects, escapeSql, MetabaseError } from "@/lib/metabase";
import { jsonResponse } from "@/lib/api";
import type { XindusCustomer } from "@/types/agent";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const idParam = req.nextUrl.searchParams.get("id")?.trim();

  // Exact lookup by Xindus customer ID
  if (idParam) {
    const idNum = parseInt(idParam, 10);
    if (isNaN(idNum)) {
      return jsonResponse({ customers: [] });
    }

    const sql = `
SELECT
  id, crn_number, company, contact_name, email, phone,
  iec, gstn, status, shipment_count, city, state
FROM customers
WHERE id = ${idNum}
LIMIT 1`;

    try {
      const result = await queryMetabase(sql);
      const customers = rowsToObjects<XindusCustomer>(result);
      return jsonResponse({ customers });
    } catch (err) {
      if (err instanceof MetabaseError) {
        return jsonResponse({ error: err.message }, err.status);
      }
      return jsonResponse({ error: "Internal server error" }, 500);
    }
  }

  // Fuzzy search by company name
  if (!q || q.length < 2) {
    return jsonResponse({ customers: [] });
  }

  const escaped = escapeSql(q);

  const sql = `
SELECT
  id, crn_number, company, contact_name, email, phone,
  iec, gstn, status, shipment_count, city, state
FROM customers
WHERE status = 'APPROVED'
  AND company IS NOT NULL
  AND company LIKE '%${escaped}%'
ORDER BY
  CASE WHEN company LIKE '${escaped}%' THEN 0 ELSE 1 END,
  COALESCE(shipment_count, 0) DESC
LIMIT 10`;

  try {
    const result = await queryMetabase(sql);
    const customers = rowsToObjects<XindusCustomer>(result);
    return jsonResponse({ customers });
  } catch (err) {
    if (err instanceof MetabaseError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
