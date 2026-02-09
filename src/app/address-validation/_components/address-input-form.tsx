"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  Loader2,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useAutocomplete } from "@/hooks/use-address-validation";
import type { AutocompleteSuggestion, AddressInput } from "@/types/address";
import { fadeIn } from "./helpers";

/* ------------------------------------------------------------------ */
/*  Address form (shared across modes)                                 */
/* ------------------------------------------------------------------ */

export function AddressInputForm({
  onValidate,
  loading,
}: {
  onValidate: (address: AddressInput) => void;
  loading: boolean;
}) {
  const { query, setQuery, suggestions, loading: acLoading } = useAutocomplete();
  const [street, setStreet] = useState("");
  const [secondary, setSecondary] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [country, setCountry] = useState("US");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        streetInputRef.current &&
        !streetInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleStreetChange(value: string) {
    setStreet(value);
    setQuery(value);
    setShowSuggestions(true);
  }

  function handleSuggestionClick(suggestion: AutocompleteSuggestion) {
    setStreet(suggestion.street_line);
    setSecondary(suggestion.secondary || "");
    setCity(suggestion.city);
    setState(suggestion.state);
    setZipcode(suggestion.zipcode);
    setShowSuggestions(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!street || !city || !state || !zipcode) return;
    onValidate({ street, secondary, city, state, zipcode, country });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4" />
          Enter Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Street with autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="street">Street</Label>
            <div className="relative">
              <Input
                ref={streetInputRef}
                id="street"
                placeholder="123 Main St"
                value={street}
                onChange={(e) => handleStreetChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />
              {acLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-popover shadow-lg"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.street_line}-${s.zipcode}-${i}`}
                        type="button"
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                        onClick={() => handleSuggestionClick(s)}
                      >
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div>
                          <span className="font-medium">{s.street_line}</span>
                          {s.secondary && (
                            <span className="text-muted-foreground"> {s.secondary}</span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {s.city}, {s.state} {s.zipcode}
                          </p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary">Secondary (Apt, Suite, etc.)</Label>
            <Input
              id="secondary"
              placeholder="Apt 4B"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="New York" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="NY" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipcode">Zip</Label>
              <Input id="zipcode" placeholder="10001" value={zipcode} onChange={(e) => setZipcode(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" placeholder="US" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={2} className="w-24" />
          </div>

          <Button type="submit" disabled={loading || !street || !city || !state || !zipcode}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Validate
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
