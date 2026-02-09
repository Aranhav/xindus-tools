"use client";

import { useState } from "react";
import {
  Calculator,
  DollarSign,
  ExternalLink,
  Loader2,
} from "lucide-react";

import { useDutyCalculation } from "@/hooks/use-hsn-classifier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DutyData } from "@/types/hsn";

import { formatCurrency } from "./helpers";

/* ------------------------------------------------------------------ */
/*  Duty Result Display                                                */
/* ------------------------------------------------------------------ */

export function DutyResult({ data }: { data: DutyData }) {
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

export function DutyCalculator({ htsCode }: { htsCode: string }) {
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
