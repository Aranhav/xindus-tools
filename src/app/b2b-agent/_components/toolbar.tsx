"use client";

import { useState, useMemo } from "react";
import { Upload, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUploadZone } from "@/components/file-upload-zone";
import type { DraftSummary } from "@/types/agent";

export interface DraftFilters {
  dateRange: string;
  valueRange: string;
  shipper: string;
  receiver: string;
  boxCount: string;
  seller: string;
}

export const DEFAULT_FILTERS: DraftFilters = {
  dateRange: "all",
  valueRange: "all",
  shipper: "all",
  receiver: "all",
  boxCount: "all",
  seller: "all",
};

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: DraftFilters;
  onFiltersChange: (filters: DraftFilters) => void;
  allDrafts: DraftSummary[];
  onUpload: (files: File[]) => void;
}

export function Toolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  allDrafts,
  onUpload,
}: ToolbarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleProcess = () => {
    if (files.length === 0) return;
    onUpload(files);
    setFiles([]);
    setDialogOpen(false);
  };

  const update = (key: keyof DraftFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeCount = Object.values(filters).filter((v) => v !== "all").length;

  const clearFilters = () => onFiltersChange(DEFAULT_FILTERS);

  // Derive unique options from all drafts
  const shippers = useMemo(() => {
    const set = new Set<string>();
    for (const d of allDrafts) if (d.shipper_name) set.add(d.shipper_name);
    return [...set].sort();
  }, [allDrafts]);

  const receivers = useMemo(() => {
    const set = new Set<string>();
    for (const d of allDrafts) if (d.receiver_name) set.add(d.receiver_name);
    return [...set].sort();
  }, [allDrafts]);

  const sellers = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of allDrafts) {
      if (d.seller_id) map.set(d.seller_id, d.shipper_name || d.seller_id);
    }
    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ id, name }));
  }, [allDrafts]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {/* Upload */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Upload
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Upload Shipment Documents</DialogTitle>
          </DialogHeader>
          <FileUploadZone
            accept=".pdf"
            multiple
            maxFiles={20}
            onFiles={setFiles}
            label="Drop PDF files here"
            description="Upload 1-20 invoices, packing lists, certificates, or other shipment documents"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDialogOpen(false);
                setFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" disabled={files.length === 0} onClick={handleProcess}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Process {files.length} file{files.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search invoices, shippers, receivers..."
          className="h-8 pl-8 text-sm"
        />
      </div>

      {/* Filters popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium">Filters</h4>
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-1.5 py-0.5 text-xs text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date range */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Select value={filters.dateRange} onValueChange={(v) => update("dateRange", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Value range */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Value</Label>
              <Select value={filters.valueRange} onValueChange={(v) => update("valueRange", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any value</SelectItem>
                  <SelectItem value="lt1k">&lt; $1,000</SelectItem>
                  <SelectItem value="1k-5k">$1K – $5K</SelectItem>
                  <SelectItem value="5k-10k">$5K – $10K</SelectItem>
                  <SelectItem value="gt10k">&gt; $10K</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shipper */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Shipper</Label>
              <Select value={filters.shipper} onValueChange={(v) => update("shipper", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All shippers</SelectItem>
                  {shippers.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Receiver */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Receiver</Label>
              <Select value={filters.receiver} onValueChange={(v) => update("receiver", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All receivers</SelectItem>
                  {receivers.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Box count */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Boxes</Label>
              <Select value={filters.boxCount} onValueChange={(v) => update("boxCount", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any count</SelectItem>
                  <SelectItem value="1">1 box</SelectItem>
                  <SelectItem value="2-5">2 – 5</SelectItem>
                  <SelectItem value="6-10">6 – 10</SelectItem>
                  <SelectItem value="gt10">10+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seller / Account */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Seller</Label>
              <Select value={filters.seller} onValueChange={(v) => update("seller", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sellers</SelectItem>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
