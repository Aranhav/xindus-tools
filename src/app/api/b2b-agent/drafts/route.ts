import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";

    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    qs.set("limit", limit);
    qs.set("offset", offset);

    const res = await proxyFetch("b2b", `/api/agent/drafts?${qs.toString()}`);
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
