/* eslint-disable @typescript-eslint/no-explicit-any */

/** Wraps a value with an AI confidence score (0-1) */
export interface ConfidenceValue<T = string> {
  value: T | null;
  confidence: number;
}

/** Address model used in B2B extraction */
export interface B2BAddress {
  name: ConfidenceValue;
  address: ConfidenceValue;
  city: ConfidenceValue;
  state: ConfidenceValue;
  zip_code: ConfidenceValue;
  country: ConfidenceValue;
  phone: ConfidenceValue;
  email: ConfidenceValue;
}

/** Invoice line item */
export interface LineItem {
  description: ConfidenceValue;
  hs_code_origin: ConfidenceValue;
  hs_code_destination: ConfidenceValue;
  quantity: ConfidenceValue<number>;
  unit_price_usd: ConfidenceValue<number>;
  total_price_usd: ConfidenceValue<number>;
  unit_weight_kg: ConfidenceValue<number>;
  igst_percent: ConfidenceValue<number>;
}

/** Item inside a packing box */
export interface BoxItem {
  description: ConfidenceValue;
  quantity: ConfidenceValue<number>;
}

/** Packing list box */
export interface Box {
  box_number: ConfidenceValue<number>;
  length_cm: ConfidenceValue<number>;
  width_cm: ConfidenceValue<number>;
  height_cm: ConfidenceValue<number>;
  gross_weight_kg: ConfidenceValue<number>;
  net_weight_kg: ConfidenceValue<number>;
  items: BoxItem[];
  destination_id: ConfidenceValue;
  receiver: B2BAddress | null;
}

/** Packing list destination */
export interface Destination {
  id: string;
  name: ConfidenceValue;
  address: B2BAddress;
}

/** Invoice data extracted from PDF */
export interface InvoiceData {
  invoice_number: ConfidenceValue;
  invoice_date: ConfidenceValue;
  currency: ConfidenceValue;
  total_amount: ConfidenceValue<number>;
  exporter: B2BAddress;
  consignee: B2BAddress;
  ship_to: B2BAddress;
  ior: B2BAddress;
  line_items: LineItem[];
}

/** Packing list data extracted from PDF */
export interface PackingListData {
  total_boxes: ConfidenceValue<number>;
  total_net_weight_kg: ConfidenceValue<number>;
  total_gross_weight_kg: ConfidenceValue<number>;
  boxes: Box[];
  destinations: Destination[];
}

/** Full extraction result */
export interface ExtractionResult {
  job_id: string;
  status: string;
  overall_confidence: number;
  invoice: InvoiceData;
  packing_list: PackingListData;
  warnings: string[];
  errors: string[];
}

/** Top-level API response from /api/extract and /api/jobs/{id} */
export interface JobStatus {
  job_id: string;
  status: "processing" | "review_needed" | "completed" | "failed";
  progress: number;
  message?: string;
  result?: ExtractionResult;
  multi_address_download?: string;
  simplified_download?: string;
}

/** Options for extraction */
export interface ExtractionOptions {
  currency?: string;
  exchange_rate?: number;
  hs_code_sync?: boolean;
}
