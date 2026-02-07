"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  ArrowRight,
  Info,
  GitCompareArrows,
  Bot,
  Zap,
} from "lucide-react";
import * as XLSX from "xlsx";

import { PageHeader } from "@/components/page-header";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ErrorDisplay } from "@/components/error-display";
import { StatusBadge } from "@/components/status-badge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import {
  useAutocomplete,
  useAddressValidation,
  useCompareValidation,
} from "@/hooks/use-address-validation";
import type { ValidationMode } from "@/hooks/use-address-validation";

import type {
  AutocompleteSuggestion,
  AddressInput,
  AddressValidationResult,
  BulkValidationResult,
} from "@/types/address";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.45, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/* ------------------------------------------------------------------ */
/*  DPV helpers                                                        */
/* ------------------------------------------------------------------ */

const dpvMatchLabels: Record<string, { label: string; color: string }> = {
  Y: { label: "Confirmed", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  N: { label: "Not Confirmed", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  S: { label: "Secondary Missing", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  D: { label: "Default", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
};

function dpvBoolLabel(value: string) {
  if (value === "Y") return { text: "Yes", className: "text-emerald-600 dark:text-emerald-400" };
  if (value === "N") return { text: "No", className: "text-red-600 dark:text-red-400" };
  return { text: value || "--", className: "text-muted-foreground" };
}

const dpvFootnoteDescriptions: Record<string, { meaning: string; category: "success" | "warning" | "error" }> = {
  AA: { meaning: "Street, city, state, and ZIP are all valid", category: "success" },
  A1: { meaning: "Address not found in USPS data", category: "error" },
  BB: { meaning: "Entire address is valid and deliverable", category: "success" },
  CC: { meaning: "Secondary (apt/suite) not recognized, but not required", category: "warning" },
  C1: { meaning: "Secondary required but not recognized", category: "error" },
  F1: { meaning: "Military address", category: "success" },
  G1: { meaning: "General delivery address", category: "success" },
  M1: { meaning: "Primary number missing", category: "error" },
  M3: { meaning: "Primary number invalid", category: "error" },
  N1: { meaning: "Secondary required but missing", category: "error" },
  PB: { meaning: "PO Box street address", category: "warning" },
  P1: { meaning: "PO Box missing or invalid", category: "warning" },
  P3: { meaning: "PO Box number invalid", category: "error" },
  RR: { meaning: "Rural route/highway contract matched", category: "warning" },
  R1: { meaning: "Rural route/highway contract not matched", category: "warning" },
  R7: { meaning: "Phantom carrier route", category: "warning" },
  TA: { meaning: "Primary number matched with range", category: "warning" },
  U1: { meaning: "Unique ZIP code match", category: "warning" },
};

const smartyFootnoteDescriptions: Record<string, string> = {
  "A#": "Corrected ZIP Code",
  "B#": "Fixed city/state spelling",
  "C#": "Invalid city/state/ZIP, corrected",
  "D#": "No ZIP+4 assigned",
  "E#": "Multiple ZIP+4 matches",
  "F#": "Address not found",
  "G#": "Used firm data",
  "H#": "Missing secondary address",
  "I#": "Insufficient data",
  "J#": "Dual address detected",
  "K#": "Multiple response from cardinal rule",
  "L#": "Address matched to CMRA",
  "LL": "Used LACS Link",
  "LI": "LACS Link indicator",
  "M#": "Street corrected",
  "N#": "Fixed abbreviations",
  "O#": "Multiple ZIP match, used default",
  "P#": "Better address exists",
  "Q#": "Unique ZIP match",
  "R#": "No match, EWS data",
  "S#": "Incorrect secondary",
  "T#": "Multiple matches, first used",
  "U#": "Unusual identifier, suppressed",
  "V#": "Unverifiable city/state",
  "W#": "Invalid delivery address",
  "X#": "Unique ZIP, no city/state match",
  "Y#": "Military match",
  "Z#": "Multiple record match found",
};

/* ------------------------------------------------------------------ */
/*  Mode selector                                                      */
/* ------------------------------------------------------------------ */

const modeOptions: { value: ValidationMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "compare", label: "Compare", icon: <GitCompareArrows className="h-4 w-4" />, desc: "Run both workflows and compare" },
  { value: "claude_smarty", label: "Claude + Smarty", icon: <Bot className="h-4 w-4" />, desc: "AI normalization then validation" },
  { value: "smarty_only", label: "Smarty Only", icon: <Zap className="h-4 w-4" />, desc: "Direct Smarty validation" },
];

/* ------------------------------------------------------------------ */
/*  Address form (shared across modes)                                 */
/* ------------------------------------------------------------------ */

function AddressForm({
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

/* ------------------------------------------------------------------ */
/*  Single Validate Tab                                                */
/* ------------------------------------------------------------------ */

function SingleValidateTab() {
  const [mode, setMode] = useState<ValidationMode>("compare");
  const singleHook = useAddressValidation();
  const compareHook = useCompareValidation();

  const loading = mode === "compare" ? compareHook.loading : singleHook.loading;
  const error = mode === "compare" ? compareHook.error : singleHook.error;

  function handleValidate(address: AddressInput) {
    if (mode === "compare") {
      compareHook.compare(address);
    } else {
      singleHook.validate(address, mode === "smarty_only");
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible">
        <div className="flex flex-wrap gap-2">
          {modeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {modeOptions.find((m) => m.value === mode)?.desc}
        </p>
      </motion.div>

      {/* Address form */}
      <motion.div custom={1} variants={fadeInUp} initial="hidden" animate="visible">
        <AddressForm onValidate={handleValidate} loading={loading} />
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <ErrorDisplay message={error} />
        </motion.div>
      )}

      {/* Compare mode results */}
      <AnimatePresence mode="wait">
        {mode === "compare" && compareHook.result && (
          <CompareResults key="compare-results" result={compareHook.result} />
        )}

        {/* Single mode results */}
        {mode !== "compare" && singleHook.result && (
          <SingleResult
            key="single-result"
            result={singleHook.result}
            mode={mode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compare results                                                    */
/* ------------------------------------------------------------------ */

function CompareResults({
  result,
}: {
  result: { claudeSmarty: AddressValidationResult; smartyOnly: AddressValidationResult; addressesMatch: boolean };
}) {
  const cs = result.claudeSmarty;
  const so = result.smartyOnly;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Quick summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard
          title="Claude + Smarty"
          icon={<Bot className="h-4 w-4" />}
          result={cs}
          showBreakdown
        />
        <SummaryCard
          title="Smarty Only"
          icon={<Zap className="h-4 w-4" />}
          result={so}
        />
      </div>

      {/* Match indicator */}
      <div
        className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
          result.addressesMatch
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
        }`}
      >
        {result.addressesMatch ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Info className="h-4 w-4" />
        )}
        {result.addressesMatch
          ? "Both workflows returned the same validated address"
          : "Workflows returned different validated addresses"}
      </div>

      {/* Side-by-side address comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input address */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Entered
            </p>
            <p className="text-sm">
              {formatAddress(cs.input_address)}
            </p>
          </div>

          {/* Side-by-side */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Bot className="h-3.5 w-3.5" />
                Claude + Smarty
              </p>
              {cs.normalized_address && (
                <div>
                  <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Normalized (Claude)</p>
                  <p className="text-sm">{formatAddress(cs.normalized_address)}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Validated (Smarty)</p>
                <p className="text-sm font-medium">
                  {cs.delivery_line ? `${cs.delivery_line}, ${cs.last_line || ""}` : formatAddress(cs.validated_address)}
                </p>
              </div>
              {cs.dpv_analysis && <DPVFootnoteBadges footnotes={cs.dpv_analysis.dpv_footnotes} />}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                Smarty Only
              </p>
              <div>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Validated (Smarty)</p>
                <p className="text-sm font-medium">
                  {so.delivery_line ? `${so.delivery_line}, ${so.last_line || ""}` : formatAddress(so.validated_address)}
                </p>
              </div>
              {so.dpv_analysis && <DPVFootnoteBadges footnotes={so.dpv_analysis.dpv_footnotes} />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DPV Analysis (from Claude+Smarty result) */}
      {cs.dpv_analysis && <DPVAnalysisSection dpv={cs.dpv_analysis} />}

      {/* Metadata */}
      {cs.metadata && <MetadataSection metadata={cs.metadata} />}

      {/* Footnotes */}
      {cs.footnotes && cs.footnotes.length > 0 && <FootnotesSection footnotes={cs.footnotes} />}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single mode result                                                 */
/* ------------------------------------------------------------------ */

function SingleResult({
  result,
  mode,
}: {
  result: AddressValidationResult;
  mode: ValidationMode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Status + timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              {result.is_valid ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Validation Result
            </span>
            <StatusBadge status={result.is_valid ? "Valid" : "Invalid"} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timing */}
          {result.timings && <TimingBar timings={result.timings} />}

          {/* Address progression */}
          <div className="space-y-3">
            <AddressStep label="Entered" address={result.input_address} />
            {mode === "claude_smarty" && result.normalized_address && (
              <AddressStep label="Normalized (Claude)" address={result.normalized_address} color="text-blue-600 dark:text-blue-400" />
            )}
            {result.validated_address && (
              <AddressStep label="Validated (Smarty)" address={result.validated_address} color="text-emerald-600 dark:text-emerald-400" highlight />
            )}
          </div>
        </CardContent>
      </Card>

      {/* DPV Analysis */}
      {result.dpv_analysis && <DPVAnalysisSection dpv={result.dpv_analysis} />}

      {/* Metadata */}
      {result.metadata && <MetadataSection metadata={result.metadata} />}

      {/* Footnotes */}
      {result.footnotes && result.footnotes.length > 0 && <FootnotesSection footnotes={result.footnotes} />}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared display components                                          */
/* ------------------------------------------------------------------ */

function SummaryCard({
  title,
  icon,
  result,
  showBreakdown,
}: {
  title: string;
  icon: React.ReactNode;
  result: AddressValidationResult;
  showBreakdown?: boolean;
}) {
  const dpvCode = result.dpv_analysis?.dpv_match_code;
  const dpvInfo = dpvCode ? dpvMatchLabels[dpvCode] : null;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </div>

        {/* Timing */}
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold">
            {result.timings?.total_ms ?? "--"}
          </span>
          <span className="text-sm text-muted-foreground">ms</span>
        </div>

        {showBreakdown && result.timings && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            {result.timings.claude_ms != null && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Claude {result.timings.claude_ms}ms
              </span>
            )}
            {result.timings.smarty_ms != null && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Smarty {result.timings.smarty_ms}ms
              </span>
            )}
          </div>
        )}

        {!showBreakdown && (
          <p className="text-xs text-muted-foreground">Direct API call</p>
        )}

        {/* DPV status */}
        {dpvInfo && (
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                dpvCode === "Y" ? "bg-emerald-500" : dpvCode === "N" ? "bg-red-500" : "bg-amber-500"
              }`}
            />
            <span className="text-sm font-medium">{dpvInfo.label}</span>
            <span className="text-xs text-muted-foreground">({dpvCode})</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimingBar({ timings }: { timings: NonNullable<AddressValidationResult["timings"]> }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">API Response:</span>
        <span className="font-mono font-semibold">{timings.total_ms}ms</span>
      </div>
      {timings.claude_ms != null && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          Claude {timings.claude_ms}ms
        </div>
      )}
      {timings.smarty_ms != null && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Smarty {timings.smarty_ms}ms
        </div>
      )}
    </div>
  );
}

function AddressStep({
  label,
  address,
  color,
  highlight,
}: {
  label: string;
  address?: AddressInput;
  color?: string;
  highlight?: boolean;
}) {
  if (!address) return null;
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-primary/30 bg-primary/5" : ""}`}>
      <p className={`mb-1 text-[11px] font-semibold uppercase tracking-wider ${color || "text-muted-foreground"}`}>
        {label}
      </p>
      <p className={`text-sm ${highlight ? "font-medium" : ""}`}>
        {formatAddress(address)}
      </p>
    </div>
  );
}

function DPVFootnoteBadges({ footnotes }: { footnotes: string }) {
  if (!footnotes) return null;
  const codes: string[] = [];
  for (let i = 0; i < footnotes.length; i += 2) {
    codes.push(footnotes.substring(i, i + 2));
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {codes.map((code) => {
        const info = dpvFootnoteDescriptions[code];
        const colorClass = info
          ? info.category === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
            : info.category === "warning"
              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
          : "bg-muted text-muted-foreground";
        return (
          <span
            key={code}
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${colorClass}`}
            title={info?.meaning || code}
          >
            {code}
          </span>
        );
      })}
    </div>
  );
}

function DPVAnalysisSection({ dpv }: { dpv: NonNullable<AddressValidationResult["dpv_analysis"]> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">DPV Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <DPVItem
            label="Match Code"
            value={
              <Badge
                variant="secondary"
                className={`border-0 font-medium ${
                  dpvMatchLabels[dpv.dpv_match_code]?.color || "bg-muted text-muted-foreground"
                }`}
              >
                {dpv.dpv_match_code} - {dpvMatchLabels[dpv.dpv_match_code]?.label || "Unknown"}
              </Badge>
            }
          />
          <DPVItem label="CMRA" value={<span className={dpvBoolLabel(dpv.dpv_cmra).className}>{dpvBoolLabel(dpv.dpv_cmra).text}</span>} />
          <DPVItem label="Vacant" value={<span className={dpvBoolLabel(dpv.dpv_vacant).className}>{dpvBoolLabel(dpv.dpv_vacant).text}</span>} />
          <DPVItem label="Active" value={<span className={dpvBoolLabel(dpv.active).className}>{dpvBoolLabel(dpv.active).text}</span>} />
          <DPVItem label="No Stat" value={<span className={dpvBoolLabel(dpv.dpv_no_stat).className}>{dpvBoolLabel(dpv.dpv_no_stat).text}</span>} />
          {dpv.enhanced_match && (
            <DPVItem label="Match Type" value={<span className="text-sm capitalize">{dpv.enhanced_match.replace("-", " ")}</span>} />
          )}
        </div>

        {/* DPV Footnotes with descriptions */}
        {dpv.dpv_footnotes && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Info className="h-3 w-3" />
              DPV Footnotes
            </p>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const codes: string[] = [];
                for (let i = 0; i < dpv.dpv_footnotes.length; i += 2) {
                  codes.push(dpv.dpv_footnotes.substring(i, i + 2));
                }
                return codes.map((code) => {
                  const info = dpvFootnoteDescriptions[code];
                  const colorClass = info
                    ? info.category === "success"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                      : info.category === "warning"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                    : "bg-muted text-muted-foreground";
                  return (
                    <div key={code} className={`rounded-md border px-2.5 py-1.5 text-xs ${colorClass}`} title={info?.meaning || code}>
                      <span className="font-mono font-semibold">{code}</span>
                      {info && <span className="ml-1.5">{info.meaning}</span>}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetadataSection({ metadata }: { metadata: NonNullable<AddressValidationResult["metadata"]> }) {
  const items: { label: string; value: string }[] = [];
  if (metadata.county_name) items.push({ label: "County", value: metadata.county_name });
  if (metadata.record_type) items.push({ label: "Record Type", value: metadata.record_type });
  if (metadata.zip_type) items.push({ label: "ZIP Type", value: metadata.zip_type });
  if (metadata.carrier_route) items.push({ label: "Carrier Route", value: metadata.carrier_route });
  if (metadata.rdi) items.push({ label: "RDI", value: metadata.rdi });
  if (metadata.congressional_district) items.push({ label: "Congressional District", value: metadata.congressional_district });
  if (metadata.time_zone) items.push({ label: "Time Zone", value: metadata.time_zone });
  if (metadata.precision) items.push({ label: "Precision", value: metadata.precision });
  if (metadata.latitude != null && metadata.longitude != null) {
    items.push({ label: "Lat / Lng", value: `${metadata.latitude.toFixed(5)}, ${metadata.longitude.toFixed(5)}` });
  }
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <MetaItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FootnotesSection({ footnotes }: { footnotes: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Analysis Footnotes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {footnotes.map((fn, i) => {
            const desc = smartyFootnoteDescriptions[fn];
            return (
              <div key={i} className="flex items-baseline gap-2 text-sm">
                <span className="font-mono font-semibold text-muted-foreground">{fn}</span>
                <span className="text-muted-foreground">{desc || "Unknown footnote code"}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Small sub-components                                               */
/* ------------------------------------------------------------------ */

function DPVItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function formatAddress(addr?: AddressInput): string {
  if (!addr) return "--";
  const parts = [addr.street];
  if (addr.secondary) parts.push(addr.secondary);
  parts.push(`${addr.city}, ${addr.state} ${addr.zipcode}`);
  return parts.join(", ");
}

/* ------------------------------------------------------------------ */
/*  Bulk Upload Tab                                                    */
/* ------------------------------------------------------------------ */

interface BulkRow {
  street: string;
  city: string;
  state: string;
  zipcode: string;
}

function BulkUploadTab() {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [results, setResults] = useState<AddressValidationResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    if (files.length === 0) {
      setRows([]);
      setResults([]);
      setSummary(null);
      setError(null);
      return;
    }

    setResults([]);
    setSummary(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
        const parsed: BulkRow[] = json
          .map((row) => ({
            street: (row.street || row.Street || row.address || row.Address || "").trim(),
            city: (row.city || row.City || "").trim(),
            state: (row.state || row.State || "").trim(),
            zipcode: (row.zipcode || row.Zipcode || row.zip || row.Zip || row.zip_code || row.ZipCode || "").toString().trim(),
          }))
          .filter((r) => r.street && r.city && r.state && r.zipcode);
        if (parsed.length === 0) {
          setError("No valid rows found. Ensure your file has columns: street, city, state, zipcode");
          setRows([]);
          return;
        }
        setRows(parsed);
      } catch {
        setError("Failed to parse the uploaded file.");
        setRows([]);
      }
    };
    reader.readAsArrayBuffer(files[0]);
  }, []);

  async function handleBulkValidate() {
    if (rows.length === 0) return;
    setLoading(true);
    setProgress(10);
    setError(null);
    setResults([]);
    setSummary(null);
    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 85));
      }, 500);
      const res = await fetch("/api/address/bulk-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addresses: rows.map((r) => ({ street: r.street, city: r.city, state: r.state, zipcode: r.zipcode })),
        }),
      });
      clearInterval(progressInterval);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Validation failed (${res.status})`);
      }
      const data: BulkValidationResult = await res.json();
      setProgress(100);
      setResults(data.results);
      setSummary(data.summary);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 600);
    }
  }

  function handleExport() {
    if (results.length === 0) return;
    const exportData = results.map((r) => ({
      Street: r.input_address.street,
      City: r.input_address.city,
      State: r.input_address.state,
      Zipcode: r.input_address.zipcode,
      Status: r.is_valid ? "Valid" : "Invalid",
      Validated_Street: r.validated_address?.street || r.input_address.street,
      Validated_City: r.validated_address?.city || r.input_address.city,
      Validated_State: r.validated_address?.state || r.input_address.state,
      Validated_Zip: r.validated_address?.zipcode || r.input_address.zipcode,
      DPV_Match: r.dpv_analysis?.dpv_match_code || "",
      DPV_CMRA: r.dpv_analysis?.dpv_cmra || "",
      DPV_Vacant: r.dpv_analysis?.dpv_vacant || "",
      County: r.metadata?.county_name || "",
      RDI: r.metadata?.rdi || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Validation Results");
    XLSX.writeFile(wb, "address-validation-results.xlsx");
  }

  return (
    <div className="space-y-6">
      <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              Upload Addresses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUploadZone
              accept=".csv,.xlsx,.xls"
              onFiles={handleFiles}
              label="Drop your file here or click to browse"
              description="Upload a CSV or Excel file with columns: street, city, state, zipcode"
            />
            {rows.length > 0 && (
              <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {rows.length} address{rows.length !== 1 ? "es" : ""} found
                </p>
                <Button onClick={handleBulkValidate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Validate All
                    </>
                  )}
                </Button>
              </motion.div>
            )}
            {loading && (
              <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <ErrorDisplay message={error} onRetry={rows.length > 0 ? handleBulkValidate : undefined} />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {summary && results.length > 0 && (
          <motion.div
            key="bulk-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-4">
              <BulkSummaryCard label="Total" value={summary.total} color="text-foreground" />
              <BulkSummaryCard label="Valid" value={summary.valid} color="text-emerald-600 dark:text-emerald-400" />
              <BulkSummaryCard label="Invalid" value={summary.invalid} color="text-red-600 dark:text-red-400" />
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Results</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Street</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Zip</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>DPV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {r.validated_address?.street || r.input_address.street}
                        </TableCell>
                        <TableCell>{r.validated_address?.city || r.input_address.city}</TableCell>
                        <TableCell>{r.validated_address?.state || r.input_address.state}</TableCell>
                        <TableCell>{r.validated_address?.zipcode || r.input_address.zipcode}</TableCell>
                        <TableCell><StatusBadge status={r.is_valid ? "Valid" : "Invalid"} /></TableCell>
                        <TableCell>
                          {r.dpv_analysis?.dpv_match_code ? (
                            <Badge
                              variant="secondary"
                              className={`border-0 font-medium ${dpvMatchLabels[r.dpv_analysis.dpv_match_code]?.color || "bg-muted text-muted-foreground"}`}
                            >
                              {r.dpv_analysis.dpv_match_code}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BulkSummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AddressValidationPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        icon={<MapPin className="h-5 w-5" />}
        title="Address Validation"
        description="Validate and normalize US addresses with Smarty API and Claude AI."
      />

      <Tabs defaultValue="single" className="mt-2">
        <TabsList>
          <TabsTrigger value="single">Single Validate</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-6">
          <SingleValidateTab />
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <BulkUploadTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
