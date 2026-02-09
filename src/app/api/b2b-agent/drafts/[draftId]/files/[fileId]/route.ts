import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ draftId: string; fileId: string }> },
) {
  try {
    const { draftId, fileId } = await params;
    const res = await proxyFetch("b2b", `/api/agent/drafts/${draftId}/files/${fileId}`, {
      method: "DELETE",
      timeout: 120000,
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
