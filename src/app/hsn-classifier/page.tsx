"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanSearch,
  Upload,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { FileUploadZone } from "@/components/file-upload-zone";
import { ErrorDisplay } from "@/components/error-display";
import { useHSNClassifier } from "@/hooks/use-hsn-classifier";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClassificationItem } from "@/types/hsn";

import { ProductTabs } from "./_components/product-tabs";

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
