/** Matches the exact backend response from classify.kaiross.in/api/classify */

export interface HSNCode {
  fullCode: string;
}

export interface Classifications {
  US: { code: HSNCode };
  IN: { code: HSNCode };
}

export interface Alternative {
  classifications: Classifications;
  confidence: number;
}

export interface ClassificationItem {
  kind: "single";
  humanTitle: string;
  classifications: Classifications;
  confidence: { top1: number };
  alternatives: Alternative[];
  modelVersion: string;
  timestamp: string;
}

export interface SingleData extends ClassificationItem {
  kind: "single";
}

export interface MultiData {
  kind: "multi";
  items: ClassificationItem[];
  modelVersion: string;
  timestamp: string;
}

export interface ClassifySuccess {
  ok: true;
  data: SingleData | MultiData;
  timestamp: string;
}

export interface ClassifyError {
  ok: false;
  error: string;
  timestamp: string;
}

export type ClassifyResponse = ClassifySuccess | ClassifyError;

/** Duty calculation types — matches classify.kaiross.in/api/duty */

export interface DutyBreakdown {
  percentage: number;
  type: string;
}

export interface DutyData {
  destination_currency: string;
  destination_currency_symbol: string;
  duty: number;
  duty_breakdown: DutyBreakdown[];
  duty_in_destination_currency: number;
  duty_percentage: number;
  hsn_code: string;
  required_documents: string[];
  source: string;
  tariff: number;
  tariff_percentage: number;
  tax: number;
  tax_breakdown: DutyBreakdown[];
  tax_in_destination_currency: number;
  tax_percentage: number;
  total_cost: number;
}

export interface DutySuccess {
  ok: true;
  data: DutyData;
  timestamp: string;
}

export interface DutyError {
  ok: false;
  error: string;
  timestamp: string;
}

export type DutyResponse = DutySuccess | DutyError;
