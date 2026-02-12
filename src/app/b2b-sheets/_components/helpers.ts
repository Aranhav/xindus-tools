import type { ConfidenceValue } from "@/types/b2b";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Extract value from ConfidenceValue, returns null for missing data */
export function cv<T>(field?: ConfidenceValue<T>): T | null {
  if (!field) return null;
  return field.value;
}

export function fmtNum(val: number | null | undefined, decimals = 2): string {
  if (val == null) return "--";
  return val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25, ease: "easeIn" as const } },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ------------------------------------------------------------------ */
/*  Download helpers                                                    */
/* ------------------------------------------------------------------ */

export async function downloadXindusExcel(
  extractionResult: Record<string, unknown>,
  format: "single" | "multi",
) {
  const res = await fetch(
    `/api/b2b/download/generate-xindus?format=${format}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extraction_result: extractionResult }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Download failed (${res.status})`);
  }

  const blob = await res.blob();
  const suffix = format === "multi" ? "Multi" : "Single";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Xindus_${suffix}_Address.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
