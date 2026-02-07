import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

/* eslint-disable @typescript-eslint/no-explicit-any */

function transformResult(data: any) {
  return {
    tracking_id: data.tracking_number || data.tracking_id || "",
    status: data.status || "Unknown",
    origin: data.origin || undefined,
    destination: data.destination || undefined,
    booked_on: data.booked_on || undefined,
    expected_delivery: data.expected_delivery || data.delivered_on || undefined,
    weight: data.weight || data.article_type || undefined,
    events: (data.events || []).map((ev: any) => ({
      date: ev.date || "",
      time: ev.time || "",
      office: ev.office || ev.location || "",
      event: ev.event || "",
    })),
    error: data.error || undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await proxyFetch("tracking", "/track/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeout: 60000,
    });
    const data = await res.json();

    // Backend may return { results: [...] } or an array
    const results = Array.isArray(data) ? data : data.results || [];
    return Response.json({
      results: results.map(transformResult),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
