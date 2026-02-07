import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Missing tracking ID" }, { status: 400 });
    }
    const res = await proxyFetch("tracking", `/track?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
