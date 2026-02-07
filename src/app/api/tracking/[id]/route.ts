import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Transform the backend response to match the frontend TrackingResult type.
 *
 * Backend returns:
 *   tracking_number, status, events[]{date,time,office,event,location}, origin, destination, ...
 *
 * Frontend expects:
 *   tracking_id, status, events[]{date,time,office,event}, origin, destination, ...
 */
function transformTrackingResponse(data: any) {
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await proxyFetch("tracking", `/track/${id}`);
    const data = await res.json();
    return Response.json(transformTrackingResponse(data));
  } catch (err) {
    return errorResponse(err);
  }
}
