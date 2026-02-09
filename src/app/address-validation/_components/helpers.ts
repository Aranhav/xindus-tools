import type { ValidationMode } from "@/hooks/use-address-validation";
import type { AddressInput } from "@/types/address";
import { GitCompareArrows, Bot, Zap } from "lucide-react";
import { createElement } from "react";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.45, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/* ------------------------------------------------------------------ */
/*  DPV helpers                                                        */
/* ------------------------------------------------------------------ */

export const dpvMatchLabels: Record<string, { label: string; color: string }> = {
  Y: { label: "Confirmed", color: "bg-success-muted text-success-foreground" },
  N: { label: "Not Confirmed", color: "bg-destructive/10 text-destructive" },
  S: { label: "Secondary Missing", color: "bg-warning-muted text-warning-foreground" },
  D: { label: "Default", color: "bg-info-muted text-info-foreground" },
};

export function dpvBoolLabel(value: string) {
  if (value === "Y") return { text: "Yes", className: "text-success" };
  if (value === "N") return { text: "No", className: "text-destructive" };
  return { text: value || "--", className: "text-muted-foreground" };
}

export const dpvFootnoteDescriptions: Record<string, { meaning: string; category: "success" | "warning" | "error" }> = {
  AA: { meaning: "Street, city, state, and ZIP are all valid", category: "success" },
  A1: { meaning: "Address not found in USPS data", category: "error" },
  BB: { meaning: "Entire address is valid and deliverable", category: "success" },
  CC: { meaning: "Secondary (apt/suite) not recognized, but not required", category: "warning" },
  C1: { meaning: "Secondary required but not recognized", category: "error" },
  F1: { meaning: "Military address", category: "success" },
  G1: { meaning: "General delivery address", category: "success" },
  M1: { meaning: "Primary number missing", category: "error" },
  M3: { meaning: "Primary number invalid", category: "error" },
  N1: { meaning: "Secondary required but missing", category: "error" },
  PB: { meaning: "PO Box street address", category: "warning" },
  P1: { meaning: "PO Box missing or invalid", category: "warning" },
  P3: { meaning: "PO Box number invalid", category: "error" },
  RR: { meaning: "Rural route/highway contract matched", category: "warning" },
  R1: { meaning: "Rural route/highway contract not matched", category: "warning" },
  R7: { meaning: "Phantom carrier route", category: "warning" },
  TA: { meaning: "Primary number matched with range", category: "warning" },
  U1: { meaning: "Unique ZIP code match", category: "warning" },
};

export const smartyFootnoteDescriptions: Record<string, string> = {
  "A#": "Corrected ZIP Code",
  "B#": "Fixed city/state spelling",
  "C#": "Invalid city/state/ZIP, corrected",
  "D#": "No ZIP+4 assigned",
  "E#": "Multiple ZIP+4 matches",
  "F#": "Address not found",
  "G#": "Used firm data",
  "H#": "Missing secondary address",
  "I#": "Insufficient data",
  "J#": "Dual address detected",
  "K#": "Multiple response from cardinal rule",
  "L#": "Address matched to CMRA",
  "LL": "Used LACS Link",
  "LI": "LACS Link indicator",
  "M#": "Street corrected",
  "N#": "Fixed abbreviations",
  "O#": "Multiple ZIP match, used default",
  "P#": "Better address exists",
  "Q#": "Unique ZIP match",
  "R#": "No match, EWS data",
  "S#": "Incorrect secondary",
  "T#": "Multiple matches, first used",
  "U#": "Unusual identifier, suppressed",
  "V#": "Unverifiable city/state",
  "W#": "Invalid delivery address",
  "X#": "Unique ZIP, no city/state match",
  "Y#": "Military match",
  "Z#": "Multiple record match found",
};

/* ------------------------------------------------------------------ */
/*  Format address helper                                              */
/* ------------------------------------------------------------------ */

export function formatAddress(addr?: AddressInput): string {
  if (!addr) return "--";
  const parts = [addr.street];
  if (addr.secondary) parts.push(addr.secondary);
  parts.push(`${addr.city}, ${addr.state} ${addr.zipcode}`);
  return parts.join(", ");
}

/* ------------------------------------------------------------------ */
/*  Mode selector options                                              */
/* ------------------------------------------------------------------ */

export const modeOptions: { value: ValidationMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "compare", label: "Compare", icon: createElement(GitCompareArrows, { className: "h-4 w-4" }), desc: "Run both workflows and compare" },
  { value: "claude_smarty", label: "Claude + Smarty", icon: createElement(Bot, { className: "h-4 w-4" }), desc: "AI normalization then validation" },
  { value: "smarty_only", label: "Smarty Only", icon: createElement(Zap, { className: "h-4 w-4" }), desc: "Direct Smarty validation" },
];
