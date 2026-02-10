"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Search, Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCustomerSearch } from "@/hooks/use-customer-search";
import type { XindusCustomer } from "@/types/agent";

interface CustomerComboboxProps {
  onSelect: (customer: XindusCustomer) => void;
  initialQuery?: string;
  placeholder?: string;
}

/** Highlight the matching portion of text. */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200/70 text-foreground dark:bg-yellow-900/50">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function CustomerCombobox({
  onSelect,
  initialQuery = "",
  placeholder = "Search Xindus customers...",
}: CustomerComboboxProps) {
  const { query, setQuery, results, loading, isOpen, setIsOpen } =
    useCustomerSearch(300);
  const [hlIndex, setHlIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Set initial query on mount
  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset highlight when results change
  useEffect(() => {
    setHlIndex(results.length > 0 ? 0 : -1);
  }, [results]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setIsOpen]);

  // Scroll highlighted into view
  useEffect(() => {
    if (hlIndex >= 0 && listRef.current) {
      const el = listRef.current.children[hlIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [hlIndex]);

  const handleSelect = useCallback(
    (customer: XindusCustomer) => {
      setQuery("");
      setIsOpen(false);
      onSelect(customer);
    },
    [onSelect, setQuery, setIsOpen],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) {
        if (e.key === "Escape") setIsOpen(false);
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHlIndex((i) => (i < results.length - 1 ? i + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHlIndex((i) => (i > 0 ? i - 1 : results.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (hlIndex >= 0 && results[hlIndex]) handleSelect(results[hlIndex]);
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [isOpen, results, hlIndex, handleSelect, setIsOpen],
  );

  return (
    <div ref={containerRef} className="relative" role="combobox" aria-expanded={isOpen}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className="h-7 pl-8 pr-8 text-xs"
          autoFocus
          role="searchbox"
          aria-autocomplete="list"
          aria-controls="customer-listbox"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={listRef}
          id="customer-listbox"
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border bg-popover shadow-lg"
        >
          <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground border-b">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
          {results.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={i === hlIndex}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs transition-colors ${
                i === hlIndex ? "bg-accent" : "hover:bg-accent/50"
              }`}
              onClick={() => handleSelect(c)}
              onMouseEnter={() => setHlIndex(i)}
            >
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  <HighlightMatch text={c.company} query={query} />
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  {c.crn_number && (
                    <span className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                      {c.crn_number}
                    </span>
                  )}
                  {c.city && <span>{c.city}</span>}
                  {c.shipment_count != null && c.shipment_count > 0 && (
                    <span>{c.shipment_count} shipments</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border bg-popover px-3 py-3 text-center text-xs text-muted-foreground shadow-lg">
          No customers found matching &ldquo;{query}&rdquo;
        </div>
      )}

      {/* Screen reader live region */}
      <div role="status" aria-live="polite" className="sr-only">
        {results.length > 0
          ? `${results.length} customers found`
          : query.length >= 2 && !loading
            ? "No customers found"
            : ""}
      </div>
    </div>
  );
}
