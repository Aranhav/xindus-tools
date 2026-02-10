import { NextRequest } from "next/server";
import { queryMetabase, rowsToObjects, MetabaseError } from "@/lib/metabase";
import { jsonResponse } from "@/lib/api";

export interface XindusAddress {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const { customerId } = await params;
  const idNum = parseInt(customerId, 10);
  if (isNaN(idNum)) {
    return jsonResponse({ addresses: [] });
  }

  const type = req.nextUrl.searchParams.get("type") || "P";

  const sql = `
SELECT id, name, address, city, district, state, zip, country, phone, email
FROM addresses
WHERE customer_id = ${idNum}
  AND type = '${type}'
  AND is_active = 1
ORDER BY modified_on DESC`;

  try {
    const result = await queryMetabase(sql);
    const addresses = rowsToObjects<XindusAddress>(result);
    return jsonResponse({ addresses });
  } catch (err) {
    if (err instanceof MetabaseError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
