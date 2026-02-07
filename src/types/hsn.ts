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

/** Duty calculation types */
export interface DutyCalculation {
  hts_code: string;
  duty_rate?: string;
  duty_amount?: number;
  destination_country: string;
  tariff_description?: string;
  error?: string;
}
