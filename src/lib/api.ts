const BACKEND_URLS = {
  tracking: process.env.INDIAPOST_TRACKER_URL!,
  address: process.env.ADDRESS_VALIDATION_URL!,
  b2b: process.env.B2B_SHEET_GENERATOR_URL!,
} as const;

type BackendService = keyof typeof BACKEND_URLS;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function proxyFetch(
  service: BackendService,
  path: string,
  init?: RequestInit & { timeout?: number },
): Promise<Response> {
  const { timeout = 30000, ...fetchInit } = init ?? {};
  const baseUrl = BACKEND_URLS[service];

  if (!baseUrl) {
    throw new ApiError(500, `Backend URL not configured for ${service}`);
  }

  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...fetchInit,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      throw new ApiError(res.status, text);
    }

    return res;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new ApiError(504, `Request to ${service} timed out`);
    }
    throw new ApiError(502, `Failed to reach ${service}: ${(err as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return jsonResponse({ error: err.message }, err.status);
  }
  return jsonResponse({ error: "Internal server error" }, 500);
}
