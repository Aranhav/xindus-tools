import { NextResponse } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function GET() {
  try {
    const res = await proxyFetch("b2b", "/api/agent/shipping-methods?b2b=true");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
