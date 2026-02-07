import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Forward the multipart form data to the backend
    const res = await proxyFetch("hsn", "/api/classify", {
      method: "POST",
      body: formData,
      timeout: 60000,
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
