"use client";

import { useState, useCallback, useRef } from "react";
import type { ExtractionJob } from "@/types/b2b";

export type B2BState = "upload" | "processing" | "results";

const PROGRESS_STEPS = [
  { label: "Uploading files", progress: 15 },
  { label: "Extracting text from PDF", progress: 40 },
  { label: "Analyzing with AI", progress: 70 },
  { label: "Generating spreadsheet", progress: 95 },
];

export function useB2BExtraction() {
  const [state, setState] = useState<B2BState>("upload");
  const [job, setJob] = useState<ExtractionJob | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const pollJob = useCallback((jobId: string) => {
    let stepIndex = 0;

    // Simulate progress between polls
    const progressTimer = setInterval(() => {
      if (stepIndex < PROGRESS_STEPS.length) {
        setCurrentStep(stepIndex);
        setProgress(PROGRESS_STEPS[stepIndex].progress);
        stepIndex++;
      }
    }, 3000);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/b2b/jobs/${jobId}`);
        const data: ExtractionJob = await res.json();

        if (data.status === "completed") {
          clearInterval(pollingRef.current);
          clearInterval(progressTimer);
          setProgress(100);
          setCurrentStep(PROGRESS_STEPS.length - 1);
          setJob(data);
          setTimeout(() => setState("results"), 500);
        } else if (data.status === "failed") {
          clearInterval(pollingRef.current);
          clearInterval(progressTimer);
          setError(data.error || "Extraction failed");
          setState("upload");
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 2000);

    return () => {
      clearInterval(pollingRef.current);
      clearInterval(progressTimer);
    };
  }, []);

  const extract = useCallback(
    async (files: File[], options?: Record<string, unknown>) => {
      setError(null);
      setState("processing");
      setProgress(5);
      setCurrentStep(0);

      try {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        if (options) {
          Object.entries(options).forEach(([k, v]) =>
            formData.append(k, String(v)),
          );
        }

        const res = await fetch("/api/b2b/extract", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        if (data.job_id) {
          pollJob(data.job_id);
        } else {
          // Direct result (no polling needed)
          setProgress(100);
          setJob(data);
          setState("results");
        }
      } catch (err) {
        setError((err as Error).message);
        setState("upload");
      }
    },
    [pollJob],
  );

  const reset = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setState("upload");
    setJob(null);
    setProgress(0);
    setCurrentStep(0);
    setError(null);
  }, []);

  return {
    state,
    job,
    progress,
    currentStep,
    currentStepLabel: PROGRESS_STEPS[currentStep]?.label || "",
    steps: PROGRESS_STEPS,
    error,
    extract,
    reset,
  };
}
