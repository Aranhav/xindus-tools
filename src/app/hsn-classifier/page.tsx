"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanSearch,
  Upload,
  Loader2,
  ArrowRight,
  RotateCcw,
  Calculator,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ErrorDisplay } from "@/components/error-display";
import { useHSNClassifier, useDutyCalculation } from "@/hooks/use-hsn-classifier";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/*  Confidence badge                                                    */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  let colorClass: string;

  if (pct >= 90) {
    colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (pct >= 70) {
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

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

export default function HSNClassifierPage() {
  const { result, loading, error, classify, reset } = useHSNClassifier();
  const {
    result: dutyResult,
    loading: dutyLoading,
    error: dutyError,
    calculate,
  } = useDutyCalculation();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [dutyAmount, setDutyAmount] = useState("");
  const [dutyCountry, setDutyCountry] = useState("US");

  const handleFiles = useCallback((files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      // Generate preview for images
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

  const handleDutyCalc = () => {
    if (!result?.classification?.hts_code || !dutyAmount) return;
    calculate(result.classification.hts_code, parseFloat(dutyAmount), dutyCountry);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setDescription("");
    setDutyAmount("");
    setDutyCountry("US");
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
              <div className="space-y-2">
                <Label>Product Image</Label>
                <FileUploadZone
                  accept="image/*"
                  onFiles={handleFiles}
                  label="Drop a product image here"
                  description="Upload an image of the product to classify (JPG, PNG, WebP)"
                />
                {preview && (
                  <div className="mt-3">
                    <img
                      src={preview}
                      alt="Product preview"
                      className="h-32 w-32 rounded-lg border object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Text description */}
              <div className="space-y-2">
                <Label htmlFor="description">Product Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the product (e.g., 'Cotton t-shirt with printed design')"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  You can provide an image, description, or both for better accuracy.
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
                {result && (
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

        {/* Classification Result */}
        <AnimatePresence mode="wait">
          {result && result.classification && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Primary classification */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Classification Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">HSN Code</p>
                      <p className="mt-1 font-mono text-lg font-bold">
                        {result.classification.hsn_code}
                      </p>
                    </div>
                    {result.classification.hts_code && (
                      <div>
                        <p className="text-xs text-muted-foreground">HTS Code</p>
                        <p className="mt-1 font-mono text-lg font-bold">
                          {result.classification.hts_code}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <div className="mt-1">
                        <ConfidenceBadge value={result.classification.confidence} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="mt-1 text-sm">{result.classification.description}</p>
                  </div>

                  {(result.classification.chapter || result.classification.section) && (
                    <div className="grid grid-cols-2 gap-4">
                      {result.classification.chapter && (
                        <div>
                          <p className="text-xs text-muted-foreground">Chapter</p>
                          <p className="mt-1 text-sm">{result.classification.chapter}</p>
                        </div>
                      )}
                      {result.classification.section && (
                        <div>
                          <p className="text-xs text-muted-foreground">Section</p>
                          <p className="mt-1 text-sm">{result.classification.section}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alternatives */}
              {result.alternatives && result.alternatives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Alternative Classifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.alternatives.map((alt, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold">
                                {alt.hsn_code}
                              </span>
                              {alt.hts_code && (
                                <span className="text-xs text-muted-foreground">
                                  HTS: {alt.hts_code}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground truncate">
                              {alt.description}
                            </p>
                          </div>
                          <ConfidenceBadge value={alt.confidence} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Duty Calculator */}
              {result.classification.hts_code && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calculator className="h-4 w-4" />
                      Duty Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="duty-code">HTS Code</Label>
                        <Input
                          id="duty-code"
                          value={result.classification.hts_code}
                          readOnly
                          className="font-mono bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duty-amount">Amount (USD)</Label>
                        <Input
                          id="duty-amount"
                          type="number"
                          placeholder="1000"
                          value={dutyAmount}
                          onChange={(e) => setDutyAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duty-country">Destination</Label>
                        <Input
                          id="duty-country"
                          placeholder="US"
                          value={dutyCountry}
                          onChange={(e) => setDutyCountry(e.target.value)}
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleDutyCalc}
                      disabled={dutyLoading || !dutyAmount}
                      variant="outline"
                    >
                      {dutyLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4" />
                          Calculate Duty
                        </>
                      )}
                    </Button>

                    {dutyError && (
                      <p className="text-sm text-destructive">{dutyError}</p>
                    )}

                    {dutyResult && (
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {dutyResult.duty_rate && (
                            <div>
                              <p className="text-xs text-muted-foreground">Duty Rate</p>
                              <p className="mt-1 text-sm font-semibold">{dutyResult.duty_rate}</p>
                            </div>
                          )}
                          {dutyResult.duty_amount != null && (
                            <div>
                              <p className="text-xs text-muted-foreground">Duty Amount</p>
                              <p className="mt-1 text-sm font-semibold">
                                ${dutyResult.duty_amount.toFixed(2)}
                              </p>
                            </div>
                          )}
                          {dutyResult.tariff_description && (
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground">Tariff Description</p>
                              <p className="mt-1 text-sm">{dutyResult.tariff_description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
