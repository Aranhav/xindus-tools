"use client";

import { FileSpreadsheet } from "lucide-react";

import { FileUploadZone } from "@/components/file-upload-zone";
import { ErrorDisplay } from "@/components/error-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { pageVariants } from "./helpers";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  UploadSection                                                      */
/* ------------------------------------------------------------------ */

interface UploadSectionProps {
  files: File[];
  currency: string;
  exchangeRate: string;
  hsCodeSync: boolean;
  error: string | null;
  onFiles: (files: File[]) => void;
  onCurrencyChange: (value: string) => void;
  onExchangeRateChange: (value: string) => void;
  onHsCodeSyncChange: (value: boolean) => void;
  onExtract: () => void;
  onRetry: () => void;
}

export function UploadSection({
  files,
  currency,
  exchangeRate,
  hsCodeSync,
  error,
  onFiles,
  onCurrencyChange,
  onExchangeRateChange,
  onHsCodeSyncChange,
  onExtract,
  onRetry,
}: UploadSectionProps) {
  return (
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
        onFiles={onFiles}
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
              <Select value={currency} onValueChange={onCurrencyChange}>
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
                onChange={(e) => onExchangeRateChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>HS Code Sync</Label>
              <Switch checked={hsCodeSync} onCheckedChange={onHsCodeSyncChange} />
              <p className="text-xs text-muted-foreground">
                Copy origin HS codes to destination when missing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <ErrorDisplay message={error} onRetry={onRetry} />}

      <Button
        size="lg"
        disabled={files.length === 0}
        onClick={onExtract}
        className="w-full sm:w-auto"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Extract &amp; Generate Sheets
      </Button>
    </motion.div>
  );
}
