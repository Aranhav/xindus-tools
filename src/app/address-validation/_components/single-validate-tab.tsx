"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { ErrorDisplay } from "@/components/error-display";

import {
  useAddressValidation,
  useCompareValidation,
} from "@/hooks/use-address-validation";
import type { ValidationMode } from "@/hooks/use-address-validation";
import type { AddressInput } from "@/types/address";

import { fadeInUp, fadeIn, modeOptions } from "./helpers";
import { AddressInputForm } from "./address-input-form";
import { CompareResults } from "./compare-results";
import { SingleResult } from "./single-result";

/* ------------------------------------------------------------------ */
/*  Single Validate Tab                                                */
/* ------------------------------------------------------------------ */

export function SingleValidateTab() {
  const [mode, setMode] = useState<ValidationMode>("compare");
  const singleHook = useAddressValidation();
  const compareHook = useCompareValidation();

  const loading = mode === "compare" ? compareHook.loading : singleHook.loading;
  const error = mode === "compare" ? compareHook.error : singleHook.error;

  function handleValidate(address: AddressInput) {
    if (mode === "compare") {
      compareHook.compare(address);
    } else {
      singleHook.validate(address, mode === "smarty_only");
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible">
        <div className="flex flex-wrap gap-2">
          {modeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {modeOptions.find((m) => m.value === mode)?.desc}
        </p>
      </motion.div>

      {/* Address form */}
      <motion.div custom={1} variants={fadeInUp} initial="hidden" animate="visible">
        <AddressInputForm onValidate={handleValidate} loading={loading} />
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <ErrorDisplay message={error} />
        </motion.div>
      )}

      {/* Compare mode results */}
      <AnimatePresence mode="wait">
        {mode === "compare" && compareHook.result && (
          <CompareResults key="compare-results" result={compareHook.result} />
        )}

        {/* Single mode results */}
        {mode !== "compare" && singleHook.result && (
          <SingleResult
            key="single-result"
            result={singleHook.result}
            mode={mode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
