"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  ArrowLeft,
  FileJson,
  AlertTriangle,
  XCircle,
  ChevronDown,
} from "lucide-react";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { StatusAlert } from "@/components/status-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JobStatus, LineItem, Box } from "@/types/b2b";

import { cv, fmtNum, staggerContainer, fadeUp, downloadCards } from "./helpers";
import { AddressCard, StatCard, ResultBanner } from "./address-card";

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

interface ResultsViewProps {
  job: JobStatus;
  onJsonExport: () => void;
  onNewExtraction: () => void;
}

export function ResultsView({ job, onJsonExport, onNewExtraction }: ResultsViewProps) {
  const result = job.result;
  const invoice = result?.invoice;
  const packing = result?.packing_list;

  return (
    <motion.div
      key="results"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <ResultBanner job={job} />
      </motion.div>
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
      {result && (result.warnings?.length > 0 || result.errors?.length > 0) && (
        <motion.div variants={fadeUp} className="space-y-3">
          {result.errors?.map((err, i) => (
            <StatusAlert
              key={`err-${i}`}
              variant="error"
              icon={<XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              title={err}
            />
          ))}
          {result.warnings?.map((w, i) => (
            <StatusAlert
              key={`warn-${i}`}
              variant="warning"
              icon={<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
              title={w}
            />
          ))}
        </motion.div>
      )}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onJsonExport}>
          <FileJson className="h-4 w-4" />
          Raw JSON
        </Button>
        <Button variant="outline" onClick={onNewExtraction}>
          <ArrowLeft className="h-4 w-4" />
          New Extraction
        </Button>
      </motion.div>
    </motion.div>
  );
}
