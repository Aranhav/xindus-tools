"use client";

import { useState } from "react";
import { Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadZone } from "@/components/file-upload-zone";
import type { DraftTab } from "@/hooks/use-b2b-agent";

interface ToolbarProps {
  activeTab: DraftTab;
  onTabChange: (tab: DraftTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onUpload: (files: File[]) => void;
  draftsTotal: number;
}

const FILTER_OPTIONS: { value: DraftTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function Toolbar({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  onUpload,
  draftsTotal,
}: ToolbarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleProcess = () => {
    if (files.length === 0) return;
    onUpload(files);
    setFiles([]);
    setDialogOpen(false);
  };

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
        <DialogContent className="sm:max-w-lg">
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

      {/* Status filter */}
      <Select value={activeTab} onValueChange={(v) => onTabChange(v as DraftTab)}>
        <SelectTrigger className="h-8 w-[160px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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

      {/* Draft count */}
      <span className="shrink-0 text-xs text-muted-foreground">
        {draftsTotal} draft{draftsTotal !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
