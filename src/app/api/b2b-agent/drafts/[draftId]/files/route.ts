import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> },
) {
  try {
    const { draftId } = await params;
    const formData = await req.formData();
    const res = await proxyFetch("b2b", `/api/agent/drafts/${draftId}/files`, {
      method: "POST",
      body: formData,
      timeout: 120000,
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
