"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { useB2BExtraction } from "@/hooks/use-b2b-extraction";
import type { ExtractionOptions } from "@/types/b2b";

import { UploadSection } from "./_components/upload-section";
import { ProcessingView } from "./_components/processing-view";
import { ResultsView } from "./_components/results-view";

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function B2BSheetsPage() {
  const {
    state,
    job,
    progress,
    currentStep,
    currentStepLabel,
    steps,
    error,
    extract,
    reset,
  } = useB2BExtraction();

  const [files, setFiles] = useState<File[]>([]);
  const [currency, setCurrency] = useState("auto");
  const [exchangeRate, setExchangeRate] = useState("");
  const [hsCodeSync, setHsCodeSync] = useState(true);

  const handleFiles = useCallback((selected: File[]) => {
    setFiles(selected);
  }, []);

  const handleExtract = () => {
    if (files.length === 0) return;
    const options: ExtractionOptions = {};
    if (currency !== "auto") options.currency = currency;
    if (exchangeRate) options.exchange_rate = parseFloat(exchangeRate);
    options.hs_code_sync = hsCodeSync;
    extract(files, options as unknown as Record<string, unknown>);
  };

  const handleJsonExport = () => {
    if (!job) return;
    const blob = new Blob([JSON.stringify(job, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `b2b-extraction-${job.job_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewExtraction = () => {
    setFiles([]);
    setCurrency("auto");
    setExchangeRate("");
    setHsCodeSync(true);
    reset();
  };

  return (
    <PageContainer wide>
      <PageHeader
        icon={<FileSpreadsheet className="h-5 w-5" />}
        title="B2B Sheet Generator"
        description="Extract invoice and packing data from PDFs into formatted Excel sheets."
      />

      <AnimatePresence mode="wait">
        {state === "upload" && (
          <UploadSection
            files={files}
            currency={currency}
            exchangeRate={exchangeRate}
            hsCodeSync={hsCodeSync}
            error={error}
            onFiles={handleFiles}
            onCurrencyChange={setCurrency}
            onExchangeRateChange={setExchangeRate}
            onHsCodeSyncChange={setHsCodeSync}
            onExtract={handleExtract}
            onRetry={handleNewExtraction}
          />
        )}

        {state === "processing" && (
          <ProcessingView
            progress={progress}
            currentStep={currentStep}
            currentStepLabel={currentStepLabel}
            steps={steps}
          />
        )}

        {state === "results" && job && (
          <ResultsView
            job={job}
            onJsonExport={handleJsonExport}
            onNewExtraction={handleNewExtraction}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
