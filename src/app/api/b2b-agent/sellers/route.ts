import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (name) {
      // Match a specific seller by name
      const qs = new URLSearchParams({ name });
      const res = await proxyFetch("b2b", `/api/agent/sellers/match?${qs.toString()}`);
      const data = await res.json();
      return Response.json(data);
    }

    // List all sellers
    const res = await proxyFetch("b2b", "/api/agent/sellers");
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
