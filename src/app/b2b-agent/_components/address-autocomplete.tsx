"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useAddressAutocomplete,
  saveToCache,
  type CachedAddress,
} from "@/hooks/use-address-autocomplete";
import type { AutocompleteSuggestion } from "@/types/address";

export interface AutocompleteSelection {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (fields: AutocompleteSelection) => void;
  className?: string;
}

function suggestionToFields(
  s: Pick<AutocompleteSuggestion, "street_line" | "secondary" | "city" | "state" | "zipcode">,
): AutocompleteSelection {
  const street = s.secondary
    ? `${s.street_line} ${s.secondary}`
    : s.street_line;
  return {
    address: street,
    city: s.city,
    state: s.state,
    zip: s.zipcode,
    country: "United States",
  };
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  className,
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { suggestions, localResults, loading, drillDown, clear } =
    useAddressAutocomplete(value, open);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dedup: hide local results that also appear in Smarty results
  const smartyKeys = new Set(
    suggestions.map(
      (s) => `${s.street_line}|${s.city}|${s.state}|${s.zipcode}`,
    ),
  );
  const filteredLocal = localResults.filter(
    (l) => !smartyKeys.has(`${l.street_line}|${l.city}|${l.state}|${l.zipcode}`),
  );

  const hasResults = filteredLocal.length > 0 || suggestions.length > 0;
  const showDropdown = open && (hasResults || loading);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setOpen(true);
    },
    [onChange],
  );

  const handleSelectSuggestion = useCallback(
    (s: AutocompleteSuggestion) => {
      if (s.entries > 0) {
        // Multi-unit: drill down for secondary addresses
        onChange(`${s.street_line} ${s.secondary}`);
        drillDown(s);
        return;
      }
      saveToCache({
        street_line: s.street_line,
        secondary: s.secondary,
        city: s.city,
        state: s.state,
        zipcode: s.zipcode,
      });
      onSelect(suggestionToFields(s));
      clear();
      setOpen(false);
    },
    [onChange, onSelect, drillDown, clear],
  );

  const handleSelectCached = useCallback(
    (addr: CachedAddress) => {
      onSelect(suggestionToFields(addr));
      clear();
      setOpen(false);
    },
    [onSelect, clear],
  );

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={handleInputChange}
        onFocus={() => value.length >= 6 && setOpen(true)}
        className={className}
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-[200px] overflow-y-auto py-1">
            {/* Local / recent addresses */}
            {filteredLocal.length > 0 && (
              <>
                <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Recent
                </div>
                {filteredLocal.map((addr, i) => (
                  <button
                    key={`local-${i}`}
                    type="button"
                    className="flex w-full items-start gap-2 px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectCached(addr)}
                  >
                    <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60" />
                    <span className="min-w-0">
                      <span className="font-medium">{addr.street_line}</span>
                      {addr.secondary && (
                        <span className="text-muted-foreground">
                          {" "}
                          {addr.secondary}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        , {addr.city}, {addr.state} {addr.zipcode}
                      </span>
                    </span>
                  </button>
                ))}
              </>
            )}

            {/* Smarty suggestions */}
            {suggestions.length > 0 && (
              <>
                {filteredLocal.length > 0 && (
                  <div className="mx-2 my-1 border-t" />
                )}
                <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Suggestions
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={`smarty-${i}`}
                    type="button"
                    className="flex w-full items-start gap-2 px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60" />
                    <span className="min-w-0">
                      <span className="font-medium">{s.street_line}</span>
                      {s.secondary && (
                        <span className="text-muted-foreground">
                          {" "}
                          {s.secondary}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        , {s.city}, {s.state} {s.zipcode}
                      </span>
                      {s.entries > 0 && (
                        <span className="ml-1 text-[11px] font-medium text-primary">
                          ({s.entries} units)
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </>
            )}

            {/* Loading state */}
            {loading && !hasResults && (
              <div className="flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
