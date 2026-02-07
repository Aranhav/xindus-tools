"use client";

import { useState, useCallback } from "react";
import type { ClassifyResponse, DutyResponse } from "@/types/hsn";

export function useHSNClassifier() {
  const [result, setResult] = useState<ClassifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classify = useCallback(
    async (file?: File, description?: string) => {
      if (!file && !description) return;

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const formData = new FormData();
        if (file) formData.append("file", file);
        if (description) formData.append("description", description);

        const res = await fetch("/api/hsn/classify", {
          method: "POST",
          body: formData,
        });
        const data: ClassifyResponse = await res.json();

        if (!res.ok) throw new Error("Classification failed");
        if (!data.ok) throw new Error(data.error);

        setResult(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, classify, reset };
}

export function useDutyCalculation() {
  const [result, setResult] = useState<DutyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(
    async (hts_code: string, amount: number, destination_country?: string) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch("/api/hsn/duty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hts_code,
            amount,
            ...(destination_country && { destination_country }),
          }),
        });
        const data: DutyResponse = await res.json();
        if (!res.ok) throw new Error("Duty calculation failed");
        if (!data.ok) throw new Error(data.error);
        setResult(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, calculate, reset };
}
