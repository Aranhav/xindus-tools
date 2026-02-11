import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  try {
    const { submissionId } = await params;
    const res = await proxyFetch("b2b", `/api/agent/submissions/${submissionId}/label`);
    const blob = await res.arrayBuffer();
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="label_${submissionId}.pdf"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
