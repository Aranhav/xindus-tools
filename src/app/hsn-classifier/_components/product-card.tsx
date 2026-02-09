"use client";

import { ConfidenceBadge } from "@/components/confidence-badge";
import type { ClassificationItem, Alternative } from "@/types/hsn";

import { CopyCode } from "./helpers";
import { DutyCalculator } from "./duty-calculator";

/* ------------------------------------------------------------------ */
/*  Product Card                                                        */
/* ------------------------------------------------------------------ */

export function ProductCard({ item }: { item: ClassificationItem }) {
  return (
    <div className="space-y-5">
      {/* Codes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            HSN Code (India)
          </p>
          <CopyCode code={item.classifications.IN.code.fullCode} />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            HTS Code (US)
          </p>
          <CopyCode code={item.classifications.US.code.fullCode} />
        </div>
      </div>

      {/* Alternatives */}
      {item.alternatives.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Alternatives
          </p>
          <div className="space-y-2">
            {item.alternatives.map((alt: Alternative, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">
                    {alt.classifications.IN.code.fullCode}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    HTS: {alt.classifications.US.code.fullCode}
                  </span>
                </div>
                <ConfidenceBadge value={alt.confidence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duty Calculator */}
      <DutyCalculator htsCode={item.classifications.US.code.fullCode} />
    </div>
  );
}
