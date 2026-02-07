import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.toString();
    const res = await proxyFetch("address", `/api/autocomplete?${search}`);
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
