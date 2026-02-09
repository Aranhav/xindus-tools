import { NextRequest } from "next/server";
import { queryMetabase, rowsToObjects, MetabaseError } from "@/lib/metabase";
import { jsonResponse } from "@/lib/api";
import type { XindusCustomer } from "@/types/agent";

const SEARCH_SQL = `
SELECT
  id, crn_number, company, contact_name, email, phone,
  iec, gstn, status, shipment_count, city, state
FROM customers
WHERE status = 'APPROVED'
  AND company IS NOT NULL
  AND company LIKE CONCAT('%', {{search_term}}, '%')
ORDER BY
  CASE WHEN company LIKE CONCAT({{search_term}}, '%') THEN 0 ELSE 1 END,
  COALESCE(shipment_count, 0) DESC
LIMIT 10
`;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return jsonResponse({ customers: [] });
  }

  try {
    const result = await queryMetabase(SEARCH_SQL, {
      search_term: { type: "text", value: q },
    });
    const customers = rowsToObjects<XindusCustomer>(result);
    return jsonResponse({ customers });
  } catch (err) {
    if (err instanceof MetabaseError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
