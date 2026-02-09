"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CopyCode — click-to-copy code badge                                */
/* ------------------------------------------------------------------ */

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold transition-colors hover:bg-muted/80"
    >
      {code}
      {copied ? (
        <Check className="h-3 w-3 text-success" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  formatCurrency                                                      */
/* ------------------------------------------------------------------ */

export function formatCurrency(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
