"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Download,
  ArrowLeft,
  Loader2,
  Check,
  FileJson,
  AlertTriangle,
  XCircle,
  ChevronDown,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ErrorDisplay } from "@/components/error-display";
import { useB2BExtraction } from "@/hooks/use-b2b-extraction";
import type {
  ExtractionOptions,
  ConfidenceValue,
  LineItem,
  Box,
  B2BAddress,
  JobStatus,
} from "@/types/b2b";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Extract value from ConfidenceValue, returns null for missing data */
function cv<T>(field?: ConfidenceValue<T>): T | null {
  if (!field) return null;
  return field.value;
}

function fmtNum(val: number | null | undefined, decimals = 2): string {
  if (val == null) return "--";
  return val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25, ease: "easeIn" as const } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ------------------------------------------------------------------ */
/*  Confidence badge                                                   */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({ value }: { value?: number }) {
  if (value == null) return <span className="text-muted-foreground">--</span>;
  const pct = Math.round(value * 100);
  let colorClass: string;
  if (pct >= 90) colorClass = "bg-emerald-500/15 text-emerald-600 border-emerald-500/25";
  else if (pct >= 70) colorClass = "bg-amber-500/15 text-amber-600 border-amber-500/25";
  else colorClass = "bg-red-500/15 text-red-600 border-red-500/25";
  return (
    <Badge variant="outline" className={colorClass}>
      {pct}%
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Address card                                                       */
/* ------------------------------------------------------------------ */

function AddressCard({ title, address }: { title: string; address?: B2BAddress }) {
  if (!address) return null;
  const name = cv(address.name);
  const addr = cv(address.address);
  const city = cv(address.city);
  const state = cv(address.state);
  const zip = cv(address.zip_code);
  const country = cv(address.country);
  const phone = cv(address.phone);
  const email = cv(address.email);

  // Don't show card if all fields are empty
  if (!name && !addr && !city && !state && !country) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {name && <p className="font-semibold">{name}</p>}
        {addr && <p>{addr}</p>}
        {(city || state || zip) && (
          <p>
            {[city, state].filter(Boolean).join(", ")}
            {zip ? ` ${zip}` : ""}
          </p>
        )}
        {country && <p>{country}</p>}
        {phone && <p className="text-muted-foreground">Tel: {phone}</p>}
        {email && <p className="text-muted-foreground">{email}</p>}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Download card data                                                 */
/* ------------------------------------------------------------------ */

const downloadCards = [
  {
    type: "multi",
    title: "Multi Address Sheet",
    description: "XpressB2B flat format with receivers inline",
  },
  {
    type: "simplified",
    title: "Simplified Template",
    description: "Multi-sheet format (Items, Receivers, Boxes)",
  },
  {
    type: "b2b_shipment",
    title: "B2B Shipment",
    description: "Grouped by destination with address headers",
  },
];

/* ------------------------------------------------------------------ */
/*  Box row (expandable)                                               */
/* ------------------------------------------------------------------ */

function BoxRow({ box, index }: { box: Box; index: number }) {
  const [open, setOpen] = useState(false);
  const num = cv(box.box_number) ?? index + 1;
  const l = cv(box.length_cm);
  const w = cv(box.width_cm);
  const h = cv(box.height_cm);
  const dims = l != null && w != null && h != null ? `${l} x ${w} x ${h} cm` : "--";

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setOpen(!open)}
      >
        <TableCell className="font-medium">
          <span className="flex items-center gap-2">
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
            Box {num}
          </span>
        </TableCell>
        <TableCell>{dims}</TableCell>
        <TableCell className="text-right">{fmtNum(cv(box.net_weight_kg))}</TableCell>
        <TableCell className="text-right">{fmtNum(cv(box.gross_weight_kg))}</TableCell>
        <TableCell>{cv(box.destination_id) || "--"}</TableCell>
        <TableCell className="text-right">{box.items?.length || 0}</TableCell>
      </TableRow>
      {open && box.items?.map((item, j) => (
        <TableRow key={j} className="bg-muted/20">
          <TableCell className="pl-10 text-muted-foreground" colSpan={2}>
            {cv(item.description) || "--"}
          </TableCell>
          <TableCell className="text-right" colSpan={2}>
            Qty: {cv(item.quantity) ?? "--"}
          </TableCell>
          <TableCell colSpan={2} />
        </TableRow>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function B2BSheetsPage() {
  const {
    state,
    job,
    progress,
    currentStep,
    currentStepLabel,
    steps,
    error,
    extract,
    reset,
  } = useB2BExtraction();

  const [files, setFiles] = useState<File[]>([]);
  const [currency, setCurrency] = useState("auto");
  const [exchangeRate, setExchangeRate] = useState("");
  const [hsCodeSync, setHsCodeSync] = useState(true);

  const handleFiles = useCallback((selected: File[]) => {
    setFiles(selected);
  }, []);

  const handleExtract = () => {
    if (files.length === 0) return;
    const options: ExtractionOptions = {};
    if (currency !== "auto") options.currency = currency;
    if (exchangeRate) options.exchange_rate = parseFloat(exchangeRate);
    options.hs_code_sync = hsCodeSync;
    extract(files, options as unknown as Record<string, unknown>);
  };

  const handleJsonExport = () => {
    if (!job) return;
    const blob = new Blob([JSON.stringify(job, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `b2b-extraction-${job.job_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewExtraction = () => {
    setFiles([]);
    setCurrency("auto");
    setExchangeRate("");
    setHsCodeSync(true);
    reset();
  };

  const result = job?.result;
  const invoice = result?.invoice;
  const packing = result?.packing_list;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        icon={<FileSpreadsheet className="h-5 w-5" />}
        title="B2B Sheet Generator"
        description="Extract invoice and packing data from PDFs into formatted Excel sheets."
      />

      <AnimatePresence mode="wait">
        {/* ============================================================ */}
        {/*  UPLOAD STATE                                                 */}
        {/* ============================================================ */}
        {state === "upload" && (
          <motion.div
            key="upload"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <FileUploadZone
              accept=".pdf"
              multiple
              onFiles={handleFiles}
              label="Drop invoice/packing list PDFs here"
              description="Supports single or multiple PDF files up to 20 MB each"
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Output Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exchange-rate">Exchange Rate</Label>
                    <Input
                      id="exchange-rate"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Optional"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>HS Code Sync</Label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hsCodeSync}
                      onClick={() => setHsCodeSync(!hsCodeSync)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        hsCodeSync ? "bg-primary" : "bg-input"
                      }`}
                    >
                      <span
                        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                          hsCodeSync ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <p className="text-xs text-muted-foreground">
                      Copy origin HS codes to destination when missing
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && <ErrorDisplay message={error} onRetry={handleNewExtraction} />}

            <Button
              size="lg"
              disabled={files.length === 0}
              onClick={handleExtract}
              className="w-full sm:w-auto"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Extract &amp; Generate Sheets
            </Button>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/*  PROCESSING STATE                                             */}
        {/* ============================================================ */}
        {state === "processing" && (
          <motion.div
            key="processing"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="mx-auto max-w-lg">
              <CardContent className="flex flex-col items-center gap-8 py-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-10 w-10 text-primary" />
                </motion.div>

                <div className="w-full space-y-3">
                  {steps.map((step, i) => {
                    const isComplete = i < currentStep || (i === currentStep && progress === 100);
                    const isActive = i === currentStep && progress < 100;
                    return (
                      <motion.div
                        key={step.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
                          isActive
                            ? "bg-primary/10 border border-primary/20"
                            : isComplete
                              ? "bg-muted/50"
                              : "opacity-50"
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                            isComplete
                              ? "bg-primary text-primary-foreground"
                              : isActive
                                ? "bg-primary/20 text-primary border border-primary/40"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isComplete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            isActive
                              ? "text-primary"
                              : isComplete
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                        {isActive && (
                          <motion.div
                            className="ml-auto h-2 w-2 rounded-full bg-primary"
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <div className="w-full space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    {currentStepLabel}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/*  RESULTS STATE                                                */}
        {/* ============================================================ */}
        {state === "results" && job && (
          <motion.div
            key="results"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            {/* Status banner */}
            <motion.div variants={fadeUp}>
              <ResultBanner job={job} />
            </motion.div>

            {/* Invoice header stats */}
            {invoice && (
              <motion.div variants={fadeUp}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <StatCard label="Invoice #" value={cv(invoice.invoice_number)} />
                  <StatCard label="Date" value={cv(invoice.invoice_date)} />
                  <StatCard label="Currency" value={cv(invoice.currency)} />
                  <StatCard
                    label="Total Amount"
                    value={fmtNum(cv(invoice.total_amount))}
                  />
                  <StatCard
                    label="Confidence"
                    value={
                      result?.overall_confidence != null
                        ? `${Math.round(result.overall_confidence * 100)}%`
                        : null
                    }
                  />
                  <StatCard
                    label="Line Items"
                    value={String(invoice.line_items?.length || 0)}
                  />
                </div>
              </motion.div>
            )}

            {/* Addresses */}
            {invoice && (
              <motion.div variants={fadeUp}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <AddressCard title="Exporter" address={invoice.exporter} />
                  <AddressCard title="Consignee" address={invoice.consignee} />
                  <AddressCard title="Ship To" address={invoice.ship_to} />
                  <AddressCard title="Importer of Record" address={invoice.ior} />
                </div>
              </motion.div>
            )}

            {/* Line Items */}
            {invoice && invoice.line_items?.length > 0 && (
              <motion.div variants={fadeUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Line Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>HS Code (Origin)</TableHead>
                            <TableHead>HS Code (Dest)</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Weight (kg)</TableHead>
                            <TableHead className="text-center">Conf.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoice.line_items.map((item: LineItem, i: number) => {
                            const minConf = Math.min(
                              ...[
                                item.description?.confidence,
                                item.quantity?.confidence,
                                item.unit_price_usd?.confidence,
                                item.total_price_usd?.confidence,
                              ].filter((c): c is number => c != null),
                            );
                            return (
                              <TableRow key={i}>
                                <TableCell className="max-w-[200px] truncate font-medium">
                                  {cv(item.description) || "--"}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {cv(item.hs_code_origin) || "--"}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {cv(item.hs_code_destination) || "--"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {cv(item.quantity) ?? "--"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(cv(item.unit_price_usd))}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(cv(item.total_price_usd))}
                                </TableCell>
                                <TableCell className="text-right">
                                  {fmtNum(cv(item.unit_weight_kg))}
                                </TableCell>
                                <TableCell className="text-center">
                                  <ConfidenceBadge value={isFinite(minConf) ? minConf : undefined} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Packing List */}
            {packing && packing.boxes?.length > 0 && (
              <motion.div variants={fadeUp}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Packing List</CardTitle>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Boxes: {cv(packing.total_boxes) ?? packing.boxes.length}</span>
                        <span>Net: {fmtNum(cv(packing.total_net_weight_kg))} kg</span>
                        <span>Gross: {fmtNum(cv(packing.total_gross_weight_kg))} kg</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Box</TableHead>
                          <TableHead>Dimensions</TableHead>
                          <TableHead className="text-right">Net (kg)</TableHead>
                          <TableHead className="text-right">Gross (kg)</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead className="text-right">Items</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packing.boxes.map((box: Box, i: number) => (
                          <BoxRow key={i} box={box} index={i} />
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Warnings & Errors */}
            {result && (result.warnings?.length > 0 || result.errors?.length > 0) && (
              <motion.div variants={fadeUp} className="space-y-3">
                {result.errors?.map((err, i) => (
                  <div
                    key={`err-${i}`}
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {err}
                  </div>
                ))}
                {result.warnings?.map((w, i) => (
                  <div
                    key={`warn-${i}`}
                    className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {w}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Downloads */}
            <motion.div variants={fadeUp}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {downloadCards.map((card) => (
                  <Card
                    key={card.type}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() =>
                      window.open(`/api/b2b/download/${job.job_id}/${card.type}`)
                    }
                  >
                    <CardContent className="flex items-center gap-4 px-5 py-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Download className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{card.title}</p>
                        <p className="text-xs text-muted-foreground">{card.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={handleJsonExport}>
                <FileJson className="h-4 w-4" />
                Raw JSON
              </Button>
              <Button variant="outline" onClick={handleNewExtraction}>
                <ArrowLeft className="h-4 w-4" />
                New Extraction
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small sub-components                                               */
/* ------------------------------------------------------------------ */

function StatCard({ label, value }: { label: string; value: string | null }) {
  return (
    <Card className="py-4">
      <CardContent className="px-4 py-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold">{value || "--"}</p>
      </CardContent>
    </Card>
  );
}

function ResultBanner({ job }: { job: JobStatus }) {
  const isReview = job.status === "review_needed";
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        isReview
          ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
          : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30"
      }`}
    >
      {isReview ? (
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      ) : (
        <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      )}
      <div>
        <p
          className={`text-sm font-semibold ${
            isReview
              ? "text-amber-800 dark:text-amber-300"
              : "text-emerald-800 dark:text-emerald-300"
          }`}
        >
          {isReview ? "Review Needed" : "Extraction Complete"}
        </p>
        <p className="text-xs text-muted-foreground">
          {job.message || `Job ${job.job_id}`}
        </p>
      </div>
      {job.result?.overall_confidence != null && (
        <div className="ml-auto">
          <ConfidenceBadge value={job.result.overall_confidence} />
        </div>
      )}
    </div>
  );
}
