import { NextRequest } from "next/server";
import { proxyFetch, errorResponse } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const format = req.nextUrl.searchParams.get("format") || "single";
    const body = await req.json();

    const res = await proxyFetch(
      "b2b",
      `/api/download/generate-xindus?format=${format}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        timeout: 60000,
      },
    );

    const contentType =
      res.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = res.headers.get("content-disposition") || "";
    const arrayBuffer = await res.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        ...(contentDisposition && {
          "Content-Disposition": contentDisposition,
        }),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
