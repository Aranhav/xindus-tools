import { NextRequest } from "next/server";
import { proxyFetch, jsonResponse, errorResponse } from "@/lib/api";

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

  try {
    const res = await proxyFetch(
      "b2b",
      `/api/agent/xindus/customers/${idNum}/addresses?type=${encodeURIComponent(type)}`,
    );
    const data = await res.json();
    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
}
