import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ job_id: string; type: string }> },
) {
  try {
    const { job_id, type } = await params;
    const res = await proxyFetch("b2b", `/api/download/${job_id}/${type}`, {
      timeout: 60000,
    });

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = res.headers.get("content-disposition") || "";
    const body = res.body;

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        ...(contentDisposition && { "Content-Disposition": contentDisposition }),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
