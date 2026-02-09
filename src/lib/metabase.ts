/** Metabase API client for querying the Xindus production database.
 *  Uses session-based auth (username/password → X-Metabase-Session),
 *  matching the pattern used by the xindus-db MCP server.
 */

const METABASE_URL = (process.env.METABASE_URL || "").replace(/\/$/, "");
const METABASE_USERNAME = process.env.METABASE_USERNAME || "";
const METABASE_PASSWORD = process.env.METABASE_PASSWORD || "";
const METABASE_DB_ID = parseInt(process.env.METABASE_DB_ID || "2");

export class MetabaseError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "MetabaseError";
  }
}

interface MetabaseColumn {
  name: string;
  display_name: string;
  base_type: string;
}

export interface MetabaseResult {
  data: {
    rows: unknown[][];
    cols: MetabaseColumn[];
    rows_truncated?: number;
  };
  error?: string;
}

/* ── Session management (cached, 12-day refresh) ─────────── */

let sessionToken: string | null = null;
let sessionExpiry: number | null = null;

async function getSession(): Promise<string> {
  if (sessionToken && sessionExpiry && Date.now() < sessionExpiry) {
    return sessionToken;
  }

  if (!METABASE_URL || !METABASE_USERNAME || !METABASE_PASSWORD) {
    throw new MetabaseError(
      500,
      "Metabase credentials not configured. Set METABASE_URL, METABASE_USERNAME, METABASE_PASSWORD.",
    );
  }

  const res = await fetch(`${METABASE_URL}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: METABASE_USERNAME,
      password: METABASE_PASSWORD,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new MetabaseError(res.status, `Metabase auth failed: ${text}`);
  }

  const data: { id: string } = await res.json();
  sessionToken = data.id;
  // Metabase sessions last 14 days; refresh after 12
  sessionExpiry = Date.now() + 12 * 24 * 60 * 60 * 1000;
  return sessionToken;
}

/* ── SQL escaping ────────────────────────────────────────── */

/** Escape a string for safe use in MySQL single-quoted literals. */
export function escapeSql(value: string): string {
  return value.replace(/[\0\x08\x09\x1a\n\r"'\\%_]/g, (ch) => {
    switch (ch) {
      case "\0": return "\\0";
      case "\x08": return "\\b";
      case "\x09": return "\\t";
      case "\x1a": return "\\z";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\"": return '\\"';
      case "'": return "\\'";
      case "\\": return "\\\\";
      case "%": return "\\%";
      case "_": return "\\_";
      default: return ch;
    }
  });
}

/* ── Query execution ─────────────────────────────────────── */

/**
 * Execute a native SQL query against Metabase.
 * Uses direct SQL (same pattern as the xindus-db MCP server).
 * Use `escapeSql()` to sanitize any user-provided values before embedding.
 */
export async function queryMetabase(sql: string): Promise<MetabaseResult> {
  const session = await getSession();

  const body = {
    database: METABASE_DB_ID,
    type: "native",
    native: { query: sql },
  };

  const res = await fetch(`${METABASE_URL}/api/dataset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    if (res.status === 401) {
      sessionToken = null;
      sessionExpiry = null;
      throw new MetabaseError(401, "Metabase session expired. Please retry.");
    }
    const text = await res.text().catch(() => "Unknown error");
    throw new MetabaseError(res.status, `Metabase query failed: ${text}`);
  }

  const result = (await res.json()) as MetabaseResult;

  if (result.error) {
    throw new MetabaseError(400, `Metabase query error: ${result.error}`);
  }

  return result;
}

/* ── Helpers ──────────────────────────────────────────────── */

/** Convert Metabase {rows, cols} result into an array of typed objects. */
export function rowsToObjects<T>(result: MetabaseResult): T[] {
  const { rows, cols } = result.data;
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      obj[col.name] = row[i];
    });
    return obj as T;
  });
}
