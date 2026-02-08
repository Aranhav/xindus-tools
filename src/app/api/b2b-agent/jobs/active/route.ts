import { proxyFetch, errorResponse } from "@/lib/api";

export async function GET() {
  try {
    const res = await proxyFetch("b2b", "/api/agent/batches/active");
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
