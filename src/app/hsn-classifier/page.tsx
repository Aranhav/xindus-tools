"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanSearch,
  Upload,
  Loader2,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ErrorDisplay } from "@/components/error-display";
import { useHSNClassifier } from "@/hooks/use-hsn-classifier";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { ProductClassification, HSNClassification } from "@/types/hsn";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  let colorClass: string;

  if (pct >= 80) {
    colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (pct >= 60) {
    colorClass = "bg-amber-100 text-amber-700 border-amber-200";
  } else {
    colorClass = "bg-red-100 text-red-700 border-red-200";
  }

  return (
    <Badge variant="outline" className={colorClass}>
      {pct}%
    </Badge>
  );
}

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
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Card                                                        */
/* ------------------------------------------------------------------ */

function ProductCard({
  product,
  index,
  total,
}: {
  product: ProductClassification;
  index: number;
  total: number;
}) {
  const c = product.classification;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              {total > 1 && (
                <Badge variant="secondary" className="text-xs">
                  Product {index + 1}
                </Badge>
              )}
              {c.description || "Classification Result"}
            </span>
            <ConfidenceBadge value={c.confidence} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Codes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                HSN Code (India)
              </p>
              <CopyCode code={c.hsn_code} />
            </div>
            {c.hts_code && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  HTS Code (US)
                </p>
                <CopyCode code={c.hts_code} />
              </div>
            )}
          </div>

          {/* Alternatives */}
          {product.alternatives && product.alternatives.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Alternatives
              </p>
              <div className="space-y-2">
                {product.alternatives.map((alt: HSNClassification, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">{alt.hsn_code}</span>
                      {alt.hts_code && (
                        <span className="text-xs text-muted-foreground">
                          HTS: {alt.hts_code}
                        </span>
                      )}
                      {alt.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {alt.description}
                        </span>
                      )}
                    </div>
                    <ConfidenceBadge value={alt.confidence} />
                  </div>
                ))}
              </div>
            </div>
          )}
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
    classify(file || undefined, description || undefined);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setDescription("");
    reset();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
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
              {/* Image upload */}
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

              {/* Text description */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Or describe the product (e.g., 'Cotton t-shirt with printed design', 'laptop with charger')"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Provide an image, description, or both. Multiple products in one description are supported.
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
          {result && result.products && result.products.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {result.products.length > 1 && (
                <p className="text-sm text-muted-foreground">
                  {result.products.length} products identified
                </p>
              )}
              {result.products.map((product, i) => (
                <ProductCard
                  key={i}
                  product={product}
                  index={i}
                  total={result.products.length}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
