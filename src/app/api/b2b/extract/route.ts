import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const res = await proxyFetch("b2b", "/api/extract", {
      method: "POST",
      body: formData,
      timeout: 180000,
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
