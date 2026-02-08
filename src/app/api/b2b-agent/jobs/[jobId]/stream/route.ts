import { NextRequest } from "next/server";

const B2B_URL = process.env.B2B_SHEET_GENERATOR_URL!;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const upstream = `${B2B_URL}/api/agent/jobs/${jobId}/stream`;

  // Stream SSE from backend to client
  const backendRes = await fetch(upstream, {
    headers: { Accept: "text/event-stream" },
  });

  if (!backendRes.ok || !backendRes.body) {
    return new Response(
      JSON.stringify({ error: "Failed to connect to job stream" }),
      { status: backendRes.status || 502, headers: { "Content-Type": "application/json" } },
    );
  }

  // Pass through the SSE stream
  return new Response(backendRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
