"use client";

import { useState, useCallback, useRef } from "react";
import type { JobStatus } from "@/types/b2b";

export type B2BState = "upload" | "processing" | "results";

const PROGRESS_STEPS = [
  { label: "Uploading files", progress: 15 },
  { label: "Extracting text from PDF", progress: 40 },
  { label: "Analyzing with AI", progress: 70 },
  { label: "Generating spreadsheet", progress: 95 },
];

export function useB2BExtraction() {
  const [state, setState] = useState<B2BState>("upload");
  const [job, setJob] = useState<JobStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const stopProgress = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = undefined;
    }
  }, []);

  const startProgress = useCallback(() => {
    let prog = 5;
    let step = 0;

    progressRef.current = setInterval(() => {
      prog += Math.random() * 3 + 1;
      if (prog >= 95) prog = 95;

      if (prog > 70 && step < 3) step = 3;
      else if (prog > 40 && step < 2) step = 2;
      else if (prog > 15 && step < 1) step = 1;

      setProgress(Math.round(prog));
      setCurrentStep(step);
    }, 800);
  }, []);

  const extract = useCallback(
    async (files: File[], options?: Record<string, unknown>) => {
      setError(null);
      setState("processing");
      setProgress(5);
      setCurrentStep(0);
      startProgress();

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
        stopProgress();
        const data: JobStatus = await res.json();
        if (!res.ok) throw new Error(data.message || "Extraction failed");

        if (data.status === "failed") {
          throw new Error(
            data.result?.errors?.join(", ") || data.message || "Extraction failed",
          );
        }

        setProgress(100);
        setCurrentStep(PROGRESS_STEPS.length - 1);
        setJob(data);
        setTimeout(() => setState("results"), 500);
      } catch (err) {
        stopProgress();
        setError((err as Error).message);
        setState("upload");
      }
    },
    [startProgress, stopProgress],
  );

  const reset = useCallback(() => {
    stopProgress();
    setState("upload");
    setJob(null);
    setProgress(0);
    setCurrentStep(0);
    setError(null);
  }, [stopProgress]);

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
