import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> },
) {
  try {
    const { draftId } = await params;
    const body = await req.json();
    const res = await proxyFetch("b2b", `/api/agent/drafts/${draftId}/submit-xindus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeout: 90_000,
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
