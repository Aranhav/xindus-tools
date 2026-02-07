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
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ErrorDisplay } from "@/components/error-display";
import { useB2BExtraction } from "@/hooks/use-b2b-extraction";
import type { ExtractionOptions, LineItem, PackingItem } from "@/types/b2b";

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
/*  Confidence badge helper                                            */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({ value }: { value?: number }) {
  if (value == null) return <span className="text-muted-foreground">--</span>;

  const pct = Math.round(value * 100);
  let colorClass: string;

  if (pct >= 90) {
    colorClass = "bg-emerald-500/15 text-emerald-600 border-emerald-500/25";
  } else if (pct >= 70) {
    colorClass = "bg-amber-500/15 text-amber-600 border-amber-500/25";
  } else {
    colorClass = "bg-red-500/15 text-red-600 border-red-500/25";
  }

  return (
    <Badge variant="outline" className={colorClass}>
      {pct}%
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Download card data                                                 */
/* ------------------------------------------------------------------ */

const downloadCards = [
  {
    type: "invoice" as const,
    title: "Invoice Sheet",
    description: "Download invoice data as Excel",
  },
  {
    type: "packing" as const,
    title: "Packing List",
    description: "Download packing data as Excel",
  },
  {
    type: "combined" as const,
    title: "Combined",
    description: "Download all data in one workbook",
  },
];

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
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
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState("");
  const [hsCodeSync, setHsCodeSync] = useState(false);

  const handleFiles = useCallback((selected: File[]) => {
    setFiles(selected);
  }, []);

  const handleExtract = () => {
    if (files.length === 0) return;

    const options: ExtractionOptions = { currency };
    if (exchangeRate) options.exchange_rate = parseFloat(exchangeRate);
    if (hsCodeSync) options.hs_code_sync = true;

    extract(files, options as unknown as Record<string, unknown>);
  };

  const handleJsonExport = () => {
    if (!job) return;
    const blob = new Blob([JSON.stringify(job, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `b2b-extraction-${job.job_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewExtraction = () => {
    setFiles([]);
    setCurrency("USD");
    setExchangeRate("");
    setHsCodeSync(false);
    reset();
  };

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
            {/* File upload zone */}
            <FileUploadZone
              accept=".pdf"
              multiple
              onFiles={handleFiles}
              label="Drop invoice/packing list PDFs here"
              description="Supports single or multiple PDF files up to 20MB each"
            />

            {/* Export options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {/* Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Exchange Rate */}
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

                  {/* HS Code Sync */}
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error display */}
            {error && <ErrorDisplay message={error} onRetry={handleNewExtraction} />}

            {/* Extract button */}
            <Button
              size="lg"
              disabled={files.length === 0}
              onClick={handleExtract}
              className="w-full sm:w-auto"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Extract Data
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
                {/* Animated spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-10 w-10 text-primary" />
                </motion.div>

                {/* Step indicators */}
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
                        {/* Step number / check */}
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                            isComplete
                              ? "bg-primary text-primary-foreground"
                              : isActive
                                ? "bg-primary/20 text-primary border border-primary/40"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isComplete ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            i + 1
                          )}
                        </div>

                        {/* Step label */}
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

                        {/* Active dot */}
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

                {/* Progress bar */}
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
            className="space-y-8"
          >
            {/* Summary stats */}
            {job.invoice_data && (
              <motion.div variants={fadeUp}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    { label: "Invoice #", value: job.invoice_data.invoice_number },
                    { label: "Date", value: job.invoice_data.invoice_date },
                    { label: "Seller", value: job.invoice_data.seller },
                    { label: "Buyer", value: job.invoice_data.buyer },
                    {
                      label: "Total Amount",
                      value:
                        job.invoice_data.total_amount != null
                          ? job.invoice_data.total_amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : undefined,
                    },
                    { label: "Currency", value: job.invoice_data.currency },
                  ].map((stat) => (
                    <Card key={stat.label} className="py-4">
                      <CardContent className="px-4 py-0">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="mt-1 truncate text-sm font-semibold">
                          {stat.value || "--"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Line Items table */}
            {job.invoice_data && job.invoice_data.line_items.length > 0 && (
              <motion.div variants={fadeUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Line Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>HS Code</TableHead>
                          <TableHead>Country of Origin</TableHead>
                          <TableHead className="text-center">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.invoice_data.line_items.map(
                          (item: LineItem, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="max-w-[200px] truncate font-medium">
                                {item.description}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.unit_price.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.total_price.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell>
                                {item.hs_code || "--"}
                              </TableCell>
                              <TableCell>
                                {item.country_of_origin || "--"}
                              </TableCell>
                              <TableCell className="text-center">
                                <ConfidenceBadge value={item.confidence} />
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Packing List table */}
            {job.packing_data && job.packing_data.items.length > 0 && (
              <motion.div variants={fadeUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Packing List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Net Weight</TableHead>
                          <TableHead className="text-right">Gross Weight</TableHead>
                          <TableHead>Carton #</TableHead>
                          <TableHead>Dimensions</TableHead>
                          <TableHead className="text-center">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.packing_data.items.map(
                          (item: PackingItem, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="max-w-[200px] truncate font-medium">
                                {item.description}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.net_weight != null ? item.net_weight : "--"}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.gross_weight != null ? item.gross_weight : "--"}
                              </TableCell>
                              <TableCell>
                                {item.carton_number || "--"}
                              </TableCell>
                              <TableCell>
                                {item.dimensions || "--"}
                              </TableCell>
                              <TableCell className="text-center">
                                <ConfidenceBadge value={item.confidence} />
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Download section */}
            <motion.div variants={fadeUp}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {downloadCards.map((card) => (
                  <Card
                    key={card.type}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() =>
                      window.open(
                        `/api/b2b/download/${job.job_id}/${card.type}`,
                      )
                    }
                  >
                    <CardContent className="flex items-center gap-4 px-5 py-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Download className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{card.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-3"
            >
              <Button variant="outline" onClick={handleJsonExport}>
                <FileJson className="h-4 w-4" />
                JSON Export
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
