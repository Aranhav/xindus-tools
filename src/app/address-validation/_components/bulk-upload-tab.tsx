"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Download,
  Upload,
  ArrowRight,
} from "lucide-react";
import * as XLSX from "xlsx";

import { FileUploadZone } from "@/components/file-upload-zone";
import { ErrorDisplay } from "@/components/error-display";
import { StatusBadge } from "@/components/status-badge";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import type { AddressValidationResult, BulkValidationResult } from "@/types/address";
import { fadeInUp, fadeIn, dpvMatchLabels } from "./helpers";

/* ------------------------------------------------------------------ */
/*  Bulk Summary Card                                                  */
/* ------------------------------------------------------------------ */

export function BulkSummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
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
/*  Bulk Upload Tab                                                    */
/* ------------------------------------------------------------------ */

interface BulkRow {
  street: string;
  city: string;
  state: string;
  zipcode: string;
}

export function BulkUploadTab() {
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
              <BulkSummaryCard label="Valid" value={summary.valid} color="text-success" />
              <BulkSummaryCard label="Invalid" value={summary.invalid} color="text-destructive" />
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
