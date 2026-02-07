export interface ExtractionOptions {
  currency?: string;
  exchange_rate?: number;
  hs_code_sync?: boolean;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  hs_code?: string;
  country_of_origin?: string;
  confidence?: number;
}

export interface PackingItem {
  description: string;
  quantity: number;
  net_weight?: number;
  gross_weight?: number;
  carton_number?: string;
  dimensions?: string;
  confidence?: number;
}

export interface ExtractionJob {
  job_id: string;
  status: "processing" | "completed" | "failed";
  progress?: number;
  current_step?: string;
  invoice_data?: {
    invoice_number?: string;
    invoice_date?: string;
    seller?: string;
    buyer?: string;
    total_amount?: number;
    currency?: string;
    line_items: LineItem[];
  };
  packing_data?: {
    total_packages?: number;
    total_net_weight?: number;
    total_gross_weight?: number;
    items: PackingItem[];
  };
  error?: string;
}

export interface DownloadType {
  type: "invoice" | "packing" | "combined";
  label: string;
  description: string;
}
