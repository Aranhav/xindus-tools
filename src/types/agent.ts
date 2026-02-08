/** TypeScript types for the B2B Booking Agent API. */

/* ------------------------------------------------------------------ */
/*  SSE Progress                                                       */
/* ------------------------------------------------------------------ */

export interface SSEProgress {
  step:
    | "classifying"
    | "extracting"
    | "grouping"
    | "building_drafts"
    | "complete"
    | "error";
  file?: string;
  completed: number;
  total: number;
  batch_id?: string;
  shipments_found?: number;
  message?: string;
}

/* ------------------------------------------------------------------ */
/*  File info                                                          */
/* ------------------------------------------------------------------ */

export interface AgentFileInfo {
  id: string;
  filename: string;
  file_type?: string;
  page_count?: number;
  confidence?: number;
  processed_at?: string;
}

/* ------------------------------------------------------------------ */
/*  Address — Xindus AddressRequestDTO                                 */
/* ------------------------------------------------------------------ */

export interface ShipmentAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  district: string;
  state: string;
  country: string;
  extension_number: string;
  eori_number: string;
  contact_name: string;
  contact_phone: string;
  warehouse_id: string | null;
  type: string | null;
}

/* ------------------------------------------------------------------ */
/*  Box item — Xindus ShipmentBoxItemRequestDTO                        */
/* ------------------------------------------------------------------ */

export interface ShipmentBoxItem {
  description: string;
  quantity: number;
  weight?: number | null;
  unit_price?: number | null;
  total_price?: number | null;
  ehsn: string;
  ihsn: string;
  country_of_origin: string;
  category: string;
  market_place: string;
  igst_amount?: number | null;
  duty_rate?: number | null;
  vat_rate?: number | null;
  unit_fob_value?: number | null;
  fob_value?: number | null;
  listing_price?: number | null;
  cogs_value?: number | null;
  insurance?: number | null;
  remarks: string;
}

/* ------------------------------------------------------------------ */
/*  Box — Xindus ShipmentBoxRequestDTO                                 */
/* ------------------------------------------------------------------ */

export interface ShipmentBox {
  box_id: string;
  weight: number;
  width: number;
  length: number;
  height: number;
  uom: string;
  has_battery: boolean;
  remarks: string;
  receiver_address: ShipmentAddress;
  shipment_box_items: ShipmentBoxItem[];
}

/* ------------------------------------------------------------------ */
/*  Product details — Xindus ProductDetailDTO                          */
/* ------------------------------------------------------------------ */

export interface ProductDetail {
  product_description: string;
  hsn_code: string;
  value: number;
}

/* ------------------------------------------------------------------ */
/*  Shipment data — Xindus B2BShipmentCreateRequestDTO                 */
/* ------------------------------------------------------------------ */

export interface ShipmentData {
  // Shipment method & clearance
  shipping_method: string;
  origin_clearance_type: string;
  destination_clearance_type: string;
  terms_of_trade: string;
  purpose_of_booking: string;
  tax_type: string;
  amazon_fba: boolean;
  multi_address_destination_delivery: boolean;
  country: string;

  // Addresses
  shipper_address: ShipmentAddress;
  receiver_address: ShipmentAddress;
  billing_address: ShipmentAddress;
  ior_address: ShipmentAddress;

  // Boxes and products
  shipment_boxes: ShipmentBox[];
  product_details: ProductDetail[];

  // Invoice / financial
  invoice_date: string;
  shipping_currency: string;
  billing_currency: string;

  // References
  export_reference: string;
  shipment_references: string;
  exporter_category: string;
  marketplace: string;

  // Logistics options
  self_drop: boolean;
  self_origin_clearance: boolean;
  self_destination_clearance: boolean;
  port_of_entry: string;
  destination_cha: string;

  // Extra metadata (useful for UI)
  invoice_number: string;
  total_amount: number;
  total_boxes: number;
  total_gross_weight_kg: number;
  total_net_weight_kg: number;
}

/* ------------------------------------------------------------------ */
/*  Seller profile (per-seller intelligence)                           */
/* ------------------------------------------------------------------ */

export interface SellerProfile {
  id: string;
  name: string;
  normalized_name: string;
  defaults: Record<string, unknown>;
  shipper_address: Record<string, unknown>;
  shipment_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface SellersListResponse {
  sellers: SellerProfile[];
}

/* ------------------------------------------------------------------ */
/*  Seller match result (for AI matching)                              */
/* ------------------------------------------------------------------ */

export interface SellerMatchResult {
  seller: SellerProfile;
  confidence: number;
  match_reason?: string;
}

export interface SellerHistoricalDefaults {
  destination_clearance?: string;
  destination_clearance_count?: number;
  destination_clearance_total?: number;
  terms_of_trade?: string;
  terms_count?: number;
  terms_total?: number;
  billing_address?: ShipmentAddress;
  ior_address?: ShipmentAddress;
}

/* ------------------------------------------------------------------ */
/*  Draft shipment                                                     */
/* ------------------------------------------------------------------ */

export interface DraftSummary {
  id: string;
  status: string;
  file_count: number;
  grouping_reason?: string;
  confidence_scores?: Record<string, unknown>;
  shipper_name?: string;
  receiver_name?: string;
  box_count?: number;
  total_value?: number;
  invoice_number?: string;
  created_at?: string;
  seller_id?: string;
  seller_shipment_count?: number;
}

export interface DraftDetail {
  id: string;
  batch_id: string;
  status: string;
  shipment_data: ShipmentData;
  confidence_scores?: Record<string, unknown>;
  grouping_reason?: string;
  corrected_data?: ShipmentData;
  xindus_scancode?: string;
  files: AgentFileInfo[];
  created_at?: string;
  seller_id?: string;
  seller?: SellerProfile;
}

/* ------------------------------------------------------------------ */
/*  Drafts list response                                               */
/* ------------------------------------------------------------------ */

export interface DraftsListResponse {
  drafts: DraftSummary[];
  total: number;
}

/* ------------------------------------------------------------------ */
/*  Batch                                                              */
/* ------------------------------------------------------------------ */

export interface BatchResponse {
  id: string;
  status: string;
  file_count: number;
  created_at?: string;
  completed_at?: string;
  drafts: DraftSummary[];
  files: AgentFileInfo[];
}

/* ------------------------------------------------------------------ */
/*  Active batch (persistent job status)                               */
/* ------------------------------------------------------------------ */

export interface ActiveBatch {
  id: string;
  status: string;
  current_step: string | null;
  step_progress: {
    completed?: number;
    total?: number;
    file?: string;
    shipments_found?: number;
  };
  file_count: number;
  created_at?: string;
}

export interface ActiveBatchesResponse {
  batches: ActiveBatch[];
}

/* ------------------------------------------------------------------ */
/*  Upload response                                                    */
/* ------------------------------------------------------------------ */

export interface UploadResponse {
  batch_id: string;
  file_count: number;
}

/* ------------------------------------------------------------------ */
/*  Correction                                                         */
/* ------------------------------------------------------------------ */

export interface CorrectionItem {
  field_path: string;
  old_value: unknown;
  new_value: unknown;
}

/* ------------------------------------------------------------------ */
/*  Approval                                                           */
/* ------------------------------------------------------------------ */

export interface ApprovalResponse {
  success: boolean;
  draft_id: string;
  xindus_scancode?: string;
  message: string;
}
