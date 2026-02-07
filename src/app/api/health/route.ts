import { jsonResponse } from "@/lib/api";

export async function GET() {
  return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
}
