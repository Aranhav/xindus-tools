import type { ShipmentAddress } from "@/types/agent";

/* ── Framer Motion variants ─────────────────────────────── */

export const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] as const },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

/* ── Format address as one-liner ─────────────────────────── */

export function formatAddress(addr: ShipmentAddress | undefined): string {
  if (!addr) return "\u2014";
  const parts = [addr.name, addr.address, addr.city, addr.state, addr.zip, addr.country].filter(
    Boolean,
  );
  return parts.join(", ") || "\u2014";
}

/* ── Relative date formatting ──────────────────────────── */

export function formatRelativeDate(dateStr: string | undefined): string {
  if (!dateStr) return "\u2014";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "\u2014";

  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffHr < 48) return "Yesterday";

  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Get nested value by dot-path ────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNestedValue(obj: any, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
