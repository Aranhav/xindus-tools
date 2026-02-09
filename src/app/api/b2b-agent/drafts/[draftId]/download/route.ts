import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> },
) {
  try {
    const { draftId } = await params;
    const format = req.nextUrl.searchParams.get("format") || "summary";
    const res = await proxyFetch("b2b", `/api/agent/drafts/${draftId}/download?format=${format}`, {
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
