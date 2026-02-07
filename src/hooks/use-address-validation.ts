"use client";

import { useState, useCallback, useEffect } from "react";
import { useDebounce } from "./use-debounce";
import type {
  AutocompleteSuggestion,
  AddressInput,
  AddressValidationResult,
} from "@/types/address";

export type ValidationMode = "compare" | "claude_smarty" | "smarty_only";

export function useAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/address/autocomplete?search=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSuggestions(data.suggestions || data || []);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return { query, setQuery, suggestions, loading };
}

async function fetchValidation(
  address: AddressInput,
  skipNormalization: boolean,
): Promise<AddressValidationResult> {
  const res = await fetch("/api/address/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...address, skipNormalization }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Validation failed");
  return data;
}

export function useAddressValidation() {
  const [result, setResult] = useState<AddressValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    async (address: AddressInput, skipNormalization = false) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const data = await fetchValidation(address, skipNormalization);
        setResult(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { result, loading, error, validate };
}

export interface CompareResult {
  claudeSmarty: AddressValidationResult;
  smartyOnly: AddressValidationResult;
  addressesMatch: boolean;
}

export function useCompareValidation() {
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(async (address: AddressInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const [claudeSmarty, smartyOnly] = await Promise.all([
        fetchValidation(address, false),
        fetchValidation(address, true),
      ]);

      // Check if both workflows returned the same validated address
      const v1 = claudeSmarty.validated_address;
      const v2 = smartyOnly.validated_address;
      const addressesMatch =
        !!v1 &&
        !!v2 &&
        v1.street === v2.street &&
        v1.city === v2.city &&
        v1.state === v2.state &&
        v1.zipcode === v2.zipcode;

      setResult({ claudeSmarty, smartyOnly, addressesMatch });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, compare };
}
