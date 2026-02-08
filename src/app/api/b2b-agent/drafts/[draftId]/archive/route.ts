import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> },
) {
  try {
    const { draftId } = await params;
    const res = await proxyFetch("b2b", `/api/agent/drafts/${draftId}/archive`, {
      method: "POST",
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
