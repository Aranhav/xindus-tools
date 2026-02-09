"use client";

import { AlertTriangle, Check } from "lucide-react";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { StatusAlert } from "@/components/status-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { B2BAddress, JobStatus } from "@/types/b2b";

import { cv } from "./helpers";

/* ------------------------------------------------------------------ */
/*  AddressCard                                                        */
/* ------------------------------------------------------------------ */

export function AddressCard({ title, address }: { title: string; address?: B2BAddress }) {
  if (!address) return null;
  const name = cv(address.name);
  const addr = cv(address.address);
  const city = cv(address.city);
  const state = cv(address.state);
  const zip = cv(address.zip_code);
  const country = cv(address.country);
  const phone = cv(address.phone);
  const email = cv(address.email);

  // Don't show card if all fields are empty
  if (!name && !addr && !city && !state && !country) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {name && <p className="font-semibold">{name}</p>}
        {addr && <p>{addr}</p>}
        {(city || state || zip) && (
          <p>
            {[city, state].filter(Boolean).join(", ")}
            {zip ? ` ${zip}` : ""}
          </p>
        )}
        {country && <p>{country}</p>}
        {phone && <p className="text-muted-foreground">Tel: {phone}</p>}
        {email && <p className="text-muted-foreground">{email}</p>}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  StatCard                                                           */
/* ------------------------------------------------------------------ */

export function StatCard({ label, value }: { label: string; value: string | null }) {
  return (
    <Card className="py-4">
      <CardContent className="px-4 py-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold">{value || "--"}</p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  ResultBanner                                                       */
/* ------------------------------------------------------------------ */

export function ResultBanner({ job }: { job: JobStatus }) {
  const isReview = job.status === "review_needed";
  return (
    <StatusAlert
      variant={isReview ? "warning" : "success"}
      icon={isReview ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
      title={isReview ? "Review Needed" : "Extraction Complete"}
      description={job.message || `Job ${job.job_id}`}
    >
      {job.result?.overall_confidence != null && (
        <div className="ml-auto">
          <ConfidenceBadge value={job.result.overall_confidence} />
        </div>
      )}
    </StatusAlert>
  );
}
