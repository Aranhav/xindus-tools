import { NextRequest } from "next/server";
import { proxyFetch, jsonResponse, errorResponse } from "@/lib/api";

// Backend returns company_name; frontend expects company
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCustomer(c: any) {
  const { company_name, ...rest } = c;
  return { ...rest, company: company_name ?? c.company };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const idParam = req.nextUrl.searchParams.get("id")?.trim();

  // Exact lookup by Xindus customer ID
  if (idParam) {
    const idNum = parseInt(idParam, 10);
    if (isNaN(idNum)) {
      return jsonResponse({ customers: [] });
    }
    try {
      const res = await proxyFetch("b2b", `/api/agent/xindus/customers/${idNum}`);
      const customer = await res.json();
      return jsonResponse({ customers: [mapCustomer(customer)] });
    } catch (err) {
      return errorResponse(err);
    }
  }

  // Fuzzy search by company name
  if (!q || q.length < 2) {
    return jsonResponse({ customers: [] });
  }

  try {
    const res = await proxyFetch(
      "b2b",
      `/api/agent/xindus/customers/search?q=${encodeURIComponent(q)}&limit=10`,
    );
    const data = await res.json();
    const customers = (data.customers || []).map(mapCustomer);
    return jsonResponse({ customers });
  } catch (err) {
    return errorResponse(err);
  }
}
