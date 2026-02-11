import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await proxyFetch("b2b", "/api/agent/tariff-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeout: 30000,
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    return errorResponse(err);
  }
}
