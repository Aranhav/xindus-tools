"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "./use-debounce";
import type { AutocompleteSuggestion } from "@/types/address";

const CACHE_KEY = "us-address-cache";
const MAX_CACHE = 200;
const MIN_CHARS = 6;

export interface CachedAddress {
  street_line: string;
  secondary: string;
  city: string;
  state: string;
  zipcode: string;
}

function getCache(): CachedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveToCache(addr: CachedAddress) {
  const cache = getCache();
  const key = `${addr.street_line}|${addr.secondary}|${addr.zipcode}`;
  const filtered = cache.filter(
    (c) => `${c.street_line}|${c.secondary}|${c.zipcode}` !== key,
  );
  filtered.unshift(addr);
  if (filtered.length > MAX_CACHE) filtered.length = MAX_CACHE;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
  } catch {
    /* localStorage full — ignore */
  }
}

function searchCache(query: string): CachedAddress[] {
  const q = query.toLowerCase();
  return getCache()
    .filter((a) =>
      `${a.street_line} ${a.secondary} ${a.city} ${a.state} ${a.zipcode}`
        .toLowerCase()
        .includes(q),
    )
    .slice(0, 5);
}

export function useAddressAutocomplete(inputValue: string, enabled: boolean) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [localResults, setLocalResults] = useState<CachedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedValue = useDebounce(inputValue, 300);
  const abortRef = useRef<AbortController | null>(null);

  // Search on debounced value change
  useEffect(() => {
    if (!enabled || !debouncedValue || debouncedValue.length < MIN_CHARS) {
      setSuggestions([]);
      setLocalResults([]);
      return;
    }

    // Local cache search (instant)
    setLocalResults(searchCache(debouncedValue));

    // Smarty API call
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    const params = new URLSearchParams({ search: debouncedValue });

    fetch(`/api/address/autocomplete?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!ctrl.signal.aborted) setSuggestions(data.suggestions || []);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setSuggestions([]);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [debouncedValue, enabled]);

  /** Drill into a multi-unit address (entries > 0). Makes an immediate API call. */
  const drillDown = useCallback(async (suggestion: AutocompleteSuggestion) => {
    const selected = `${suggestion.street_line} ${suggestion.secondary} (${suggestion.entries}) ${suggestion.city} ${suggestion.state} ${suggestion.zipcode}`;
    const search = `${suggestion.street_line} ${suggestion.secondary}`;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    try {
      const params = new URLSearchParams({ search, selected });
      const res = await fetch(`/api/address/autocomplete?${params}`, {
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!ctrl.signal.aborted) setSuggestions(data.suggestions || []);
    } catch {
      if (!ctrl.signal.aborted) setSuggestions([]);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setLocalResults([]);
    abortRef.current?.abort();
  }, []);

  return { suggestions, localResults, loading, drillDown, clear };
}
