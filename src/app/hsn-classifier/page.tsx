"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import {
  ScanSearch,
  Upload,
  Loader2,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Calculator,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ErrorDisplay } from "@/components/error-display";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { useHSNClassifier, useDutyCalculation } from "@/hooks/use-hsn-classifier";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClassificationItem, Alternative, DutyData } from "@/types/hsn";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold transition-colors hover:bg-muted/80"
    >
      {code}
      {copied ? (
        <Check className="h-3 w-3 text-success" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

function formatCurrency(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ------------------------------------------------------------------ */
/*  Duty Result Display                                                */
/* ------------------------------------------------------------------ */

function DutyResult({ data }: { data: DutyData }) {
  const sym = data.destination_currency_symbol || "$";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-success-muted p-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">Duty</p>
          <p className="text-lg font-semibold text-success-foreground">
            {formatCurrency(data.duty_in_destination_currency, sym)}
          </p>
          <p className="text-xs text-muted-foreground">{data.duty_percentage}%</p>
        </div>
        <div className="rounded-lg border bg-info-muted p-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">Tax</p>
          <p className="text-lg font-semibold text-info-foreground">
            {formatCurrency(data.tax_in_destination_currency, sym)}
          </p>
          <p className="text-xs text-muted-foreground">{data.tax_percentage}%</p>
        </div>
        <div className="rounded-lg border bg-accent p-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">Total Cost</p>
          <p className="text-lg font-semibold text-accent-foreground">
            {formatCurrency(data.total_cost, sym)}
          </p>
        </div>
      </div>

      {data.duty_breakdown.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Duty Breakdown
          </p>
          <div className="space-y-1">
            {data.duty_breakdown.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{b.type}</span>
                <span className="font-medium">{b.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.tax_breakdown.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tax Breakdown
          </p>
          <div className="space-y-1">
            {data.tax_breakdown.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{b.type}</span>
                <span className="font-medium">{b.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.source && (
        <a
          href={data.source}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Tariff source
        </a>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Duty Calculator (inline in product card)                           */
/* ------------------------------------------------------------------ */

function DutyCalculator({ htsCode }: { htsCode: string }) {
  const { result, loading, error, calculate, reset } = useDutyCalculation();
  const [amount, setAmount] = useState("100");
  const [country, setCountry] = useState("");

  const handleCalculate = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    calculate(htsCode, amt, country || undefined);
  };

  return (
    <div className="border-t pt-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Calculator className="h-3.5 w-3.5" />
        Import Duty Calculator
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Goods Value (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCalculate();
                }}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Destination Country
            </label>
            <Input
              placeholder="United States Of America"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCalculate();
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleCalculate}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-3.5 w-3.5" />
                Calculate Duty
              </>
            )}
          </Button>
          {result && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                reset();
                setAmount("100");
                setCountry("");
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && result.ok && <DutyResult data={result.data} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Card                                                        */
/* ------------------------------------------------------------------ */

function ProductCard({ item }: { item: ClassificationItem }) {
  return (
    <div className="space-y-5">
      {/* Codes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            HSN Code (India)
          </p>
          <CopyCode code={item.classifications.IN.code.fullCode} />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            HTS Code (US)
          </p>
          <CopyCode code={item.classifications.US.code.fullCode} />
        </div>
      </div>

      {/* Alternatives */}
      {item.alternatives.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Alternatives
          </p>
          <div className="space-y-2">
            {item.alternatives.map((alt: Alternative, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">
                    {alt.classifications.IN.code.fullCode}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    HTS: {alt.classifications.US.code.fullCode}
                  </span>
                </div>
                <ConfidenceBadge value={alt.confidence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duty Calculator */}
      <DutyCalculator htsCode={item.classifications.US.code.fullCode} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Swipeable Product Tabs                                              */
/* ------------------------------------------------------------------ */

const SWIPE_THRESHOLD = 50;

function ProductTabs({ items }: { items: ClassificationItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const goTo = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD && activeIndex < items.length - 1) {
      goTo(activeIndex + 1);
    } else if (info.offset.x > SWIPE_THRESHOLD && activeIndex > 0) {
      goTo(activeIndex - 1);
    }
  };

  // Single product — no tabs needed
  if (items.length === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{items[0].humanTitle}</span>
              <ConfidenceBadge value={items[0].confidence.top1} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductCard item={items[0]} />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const current = items[activeIndex];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card>
        {/* Tab header */}
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 overflow-x-auto">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    i === activeIndex
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-xs opacity-70">{i + 1}</span>
                  <span className="max-w-[140px] truncate">{item.humanTitle}</span>
                </button>
              ))}
            </div>
            <ConfidenceBadge value={current.confidence.top1} />
          </div>

          {/* Navigation arrows + swipe hint */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs text-muted-foreground">
              {activeIndex + 1} of {items.length} products &middot; swipe or tap to switch
            </p>
            <button
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === items.length - 1}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        {/* Swipeable content area */}
        <CardContent className="pt-4" ref={constraintsRef}>
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] as const }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                className="cursor-grab active:cursor-grabbing"
              >
                <ProductCard item={current} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicators */}
          <div className="mt-4 flex justify-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

export default function HSNClassifierPage() {
  const { result, loading, error, classify, reset } = useHSNClassifier();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const handleFiles = useCallback((files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      if (selected.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selected);
      }
    } else {
      setFile(null);
      setPreview(null);
    }
  }, []);

  const handleClassify = () => {
    if (!file && !description) return;
    classify(file || undefined, description || undefined);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setDescription("");
    reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleClassify();
    }
  };

  // Extract items from the response (handles both single and multi)
  const items: ClassificationItem[] = (() => {
    if (!result || !result.ok) return [];
    const d = result.data;
    if (d.kind === "multi") return d.items;
    return [d];
  })();

  return (
    <PageContainer>
      <PageHeader
        icon={<ScanSearch className="h-5 w-5" />}
        title="HSN Classifier"
        description="Classify products by image or description to get HSN/HTS codes with AI-powered confidence scoring."
      />

      <div className="space-y-6">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4" />
                Product Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadZone
                accept="image/*"
                onFiles={handleFiles}
                label="Drop a product image here"
                description="Upload an image of the product to classify (JPG, PNG, WebP)"
              />
              {preview && (
                <div className="mt-2">
                  <img
                    src={preview}
                    alt="Product preview"
                    className="h-32 w-32 rounded-lg border object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Textarea
                  placeholder="Or describe the product (e.g., 'Cotton t-shirt', 'laptop with charger')"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Provide an image, description, or both. Press Enter to classify. Shift+Enter for new line.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleClassify}
                  disabled={loading || (!file && !description)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Classifying...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Classify
                    </>
                  )}
                </Button>
                {(result || file || description) && (
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error */}
        {error && <ErrorDisplay message={error} onRetry={handleClassify} />}

        {/* Results */}
        <AnimatePresence mode="wait">
          {items.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProductTabs items={items} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  );
}
