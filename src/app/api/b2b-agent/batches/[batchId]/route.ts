import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    const { batchId } = await params;
    const res = await proxyFetch("b2b", `/api/agent/batches/${batchId}`);
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
