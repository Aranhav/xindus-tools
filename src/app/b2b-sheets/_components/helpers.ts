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
/*  Download card data                                                 */
/* ------------------------------------------------------------------ */

export const downloadCards = [
  {
    type: "multi",
    title: "Multi Address Sheet",
    description: "XpressB2B flat format with receivers inline",
  },
  {
    type: "simplified",
    title: "Simplified Template",
    description: "Multi-sheet format (Items, Receivers, Boxes)",
  },
  {
    type: "b2b_shipment",
    title: "B2B Shipment",
    description: "Grouped by destination with address headers",
  },
];
