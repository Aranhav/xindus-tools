"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { XindusCustomer } from "@/types/agent";

interface CustomerSearchState {
  query: string;
  setQuery: (q: string) => void;
  results: XindusCustomer[];
  loading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  clear: () => void;
}

export function useCustomerSearch(debounceMs = 300): CustomerSearchState {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<XindusCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSearch = useCallback(async (q: string) => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/b2b-agent/customers/search?q=${encodeURIComponent(q)}`,
        { signal: controller.signal },
      );
      if (!res.ok) throw new Error("Search failed");
      const data: { customers: XindusCustomer[] } = await res.json();
      setResults(data.customers);
      setIsOpen(data.customers.length > 0);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => doSearch(query.trim()), debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs, doSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setLoading(false);
  }, []);

  return { query, setQuery, results, loading, isOpen, setIsOpen, clear };
}
