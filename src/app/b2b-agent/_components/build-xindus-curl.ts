/**
 * Build the Xindus Express-Shipment API payload and cURL command.
 *
 * Maps our internal ShipmentData format to the camelCase Express-Shipment
 * API payload (`POST /xos/api/express-shipment/create`, multipart).
 * Field names derived from real Xindus draft_shipments.draft_data in UAT DB.
 */

import type {
  ShipmentData,
  ShipmentAddress,
  ShipmentBox,
  ShipmentBoxItem,
} from "@/types/agent";

/* ── Country name → 2-char ISO code ─────────────────────── */

const COUNTRY_MAP: Record<string, string> = {
  "united states": "US", "united states of america": "US", usa: "US",
  "united kingdom": "GB", "great britain": "GB", england: "GB",
  india: "IN", china: "CN", japan: "JP", germany: "DE", france: "FR",
  canada: "CA", australia: "AU", brazil: "BR", mexico: "MX",
  "south korea": "KR", "korea": "KR", italy: "IT", spain: "ES",
  netherlands: "NL", "the netherlands": "NL", switzerland: "CH",
  "united arab emirates": "AE", uae: "AE", "saudi arabia": "SA",
  singapore: "SG", malaysia: "MY", thailand: "TH", vietnam: "VN",
  indonesia: "ID", philippines: "PH", turkey: "TR", "türkiye": "TR",
  pakistan: "PK", bangladesh: "BD", "sri lanka": "LK", nepal: "NP",
  "new zealand": "NZ", "south africa": "ZA", nigeria: "NG", egypt: "EG",
  israel: "IL", russia: "RU", poland: "PL", sweden: "SE", norway: "NO",
  denmark: "DK", finland: "FI", belgium: "BE", austria: "AT",
  ireland: "IE", portugal: "PT", greece: "GR", "czech republic": "CZ",
  romania: "RO", hungary: "HU", argentina: "AR", chile: "CL",
  colombia: "CO", peru: "PE", kenya: "KE", ghana: "GH", tanzania: "TZ",
  morocco: "MA", taiwan: "TW", "hong kong": "HK",
};

function normalizeCountry(raw: string | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^[A-Z]{2}$/.test(trimmed)) return trimmed;
  return COUNTRY_MAP[trimmed.toLowerCase()] || trimmed;
}

/* ── Normalize zip: strip ZIP+4 extension ─────────────────── */

function normalizeZip(zip: string | undefined, country: string | undefined): string {
  if (!zip) return "";
  const trimmed = zip.trim();
  const cc = normalizeCountry(country);
  if (cc === "US" || cc === "" || !cc) {
    const m = trimmed.match(/^(\d{5})(-\d{4})?$/);
    if (m) return m[1];
  }
  return trimmed;
}

/* ── Strip dots/periods from HSN codes ─────────────────────── */

function normalizeHsn(raw: string | undefined): string {
  if (!raw) return "";
  return raw.replace(/\./g, "");
}

/* ── Address: map to Xindus camelCase format ─────────────── */

function mapAddress(addr: ShipmentAddress | undefined) {
  if (!addr) return {};
  return {
    name: addr.name || "",
    email: addr.email || "",
    phone: addr.phone || "",
    address: addr.address || "",
    city: addr.city || "",
    zip: normalizeZip(addr.zip, addr.country),
    state: addr.state || "",
    country: normalizeCountry(addr.country),
    extensionNumber: addr.extension_number || "",
  };
}

/** Returns true if an address has at least a name filled in. */
function hasAddress(addr: ShipmentAddress | undefined): boolean {
  return !!addr?.name?.trim();
}

/* ── Box item: camelCase matching Xindus DTO ─────────────── */

function mapBoxItem(item: ShipmentBoxItem) {
  return {
    description: item.description || "",
    ehsn: normalizeHsn(item.ehsn),
    ihsn: normalizeHsn(item.ihsn),
    quantity: item.quantity || 1,
    weight: item.weight ?? 0,
    unitPrice: item.unit_price ?? 0,
    igst: item.igst_amount ?? 0,
    countryOfOrigin: normalizeCountry(item.country_of_origin) || "IN",
    remarks: "",
    swappedHts: false,
    autoClassified: false,
    useCustomerFob: false,
    isUserEnteredUnitPrice: false,
  };
}

/* ── Box: camelCase matching Xindus DTO ──────────────────── */

function mapBox(box: ShipmentBox, idx: number) {
  return {
    boxId: idx + 1,
    weight: box.weight || 0,
    width: box.width || 0,
    length: box.length || 0,
    height: box.height || 0,
    remarks: "",
    hasBattery: 0,
    shipmentBoxItems: (box.shipment_box_items || []).map(mapBoxItem),
    receiverAddress: mapAddress(box.receiver_address),
  };
}

/* ── Normalize date to ISO 8601 ──────────────────────────── */

function normalizeDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw + "T00:00:00.000Z";
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T00:00:00.000Z`;
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
}

/* ── Derive productDetails from box items (deduplicated) ─── */

function deriveProductDetails(boxes: ShipmentBox[]) {
  const seen = new Map<string, { productDescription: string; hsnCode: string }>();
  for (const box of boxes) {
    for (const item of box.shipment_box_items || []) {
      const desc = (item.description || "").trim();
      const hsn = normalizeHsn(item.ehsn);
      const key = `${desc}|${hsn}`;
      if (!seen.has(key) && desc) {
        seen.set(key, { productDescription: desc, hsnCode: hsn });
      }
    }
  }
  return Array.from(seen.values());
}

/* ── Main: build the Xindus Express-Shipment API payload ─── */
/* All field names are camelCase to match the Xindus Spring Boot DTO */

export function buildXindusPayload(data: ShipmentData) {
  const billingSource = hasAddress(data.billing_address)
    ? data.billing_address
    : data.shipper_address;

  const destCountry = normalizeCountry(data.receiver_address?.country || data.country);

  return {
    shippingMethod: data.shipping_method || "AN",
    purposeOfBooking: data.purpose_of_booking || "Sold",
    termsOfTrade: data.terms_of_trade || "DAP",
    taxType: data.tax_type || "GST",
    country: destCountry,
    destinationClearanceType: data.destination_clearance_type || "Informal",
    originClearanceType: "Commercial",
    shippingCurrency: data.shipping_currency || "USD",
    amazonFba: data.amazon_fba ?? false,
    selfDrop: data.self_drop ?? false,
    selfOriginClearance: data.self_origin_clearance ?? false,
    selfDestinationClearance: data.self_destination_clearance ?? false,
    multiAddressDestinationDelivery: data.multi_address_destination_delivery ?? false,
    marketplace: data.marketplace || "other",
    invoiceHavePacking: true,
    scancode: null,
    draftScancode: null,
    isInitiatedRequest: false,
    poaInitiated: false,

    // Addresses
    shipperAddress: mapAddress(data.shipper_address),
    receiverAddress: mapAddress(data.receiver_address),
    billingAddress: mapAddress(billingSource),
    iorAddress: mapAddress(data.ior_address),

    // Products (customs declaration summary — camelCase keys)
    productDetails: deriveProductDetails(data.shipment_boxes || []),

    // Boxes (camelCase)
    shipmentBoxes: (data.shipment_boxes || []).map((b, i) => mapBox(b, i)),

    // Invoice & references
    shipmentReferences: data.shipment_references || data.export_reference || data.invoice_number || "",
    exportReference: data.export_reference || data.shipment_references || data.invoice_number || "",
    invoiceDate: normalizeDate(data.invoice_date),

    // Documents (backend injects real file URLs; placeholder for cURL preview)
    // Key MUST be "documents" — Xindus @JsonProperty("documents") maps to documentsDTOS field
    documents: [{
      id: Date.now(),
      name: "invoice",
      type: "invoice",
      url: "",
      document_number: data.invoice_number || "",
    }],
  };
}

/* ── Validate required fields before Xindus submission ───── */

export interface ValidationIssue {
  category: "address" | "box" | "item" | "shipment";
  message: string;
}

const ADDR_REQUIRED = ["name", "email", "phone", "address", "city", "state", "zip", "country"] as const;

function validateAddress(
  addr: ShipmentAddress | undefined,
  label: string,
  issues: ValidationIssue[],
) {
  if (!addr) {
    issues.push({ category: "address", message: `${label} is missing` });
    return;
  }
  const a = addr as unknown as Record<string, string>;
  for (const field of ADDR_REQUIRED) {
    if (!a[field]?.trim()) {
      issues.push({ category: "address", message: `${label} → ${field} is required` });
    }
  }
}

const VALID_DEST_CLEARANCE = ["Informal", "Formal", "T86"];

export function validateForXindus(data: ShipmentData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!data.invoice_number?.trim())
    issues.push({ category: "shipment", message: "Invoice number is required" });
  if (!data.invoice_date?.trim())
    issues.push({ category: "shipment", message: "Invoice date is required" });

  if (!data.destination_clearance_type?.trim() || !VALID_DEST_CLEARANCE.includes(data.destination_clearance_type.trim()))
    issues.push({ category: "shipment", message: `Destination clearance type must be one of: ${VALID_DEST_CLEARANCE.join(", ")}` });

  const destCountry = normalizeCountry(data.receiver_address?.country || data.country);
  if (!destCountry)
    issues.push({ category: "shipment", message: "Destination country is required" });

  validateAddress(data.shipper_address, "Shipper", issues);
  validateAddress(data.receiver_address, "Receiver", issues);
  if (data.billing_address?.name?.trim()) {
    validateAddress(data.billing_address, "Billing", issues);
  }

  const boxes = data.shipment_boxes || [];
  if (boxes.length === 0) {
    issues.push({ category: "box", message: "At least one box is required" });
  }
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    const lbl = `Box ${i + 1}`;
    if (!b.length || b.length <= 0)
      issues.push({ category: "box", message: `${lbl} → length must be > 0` });
    if (!b.width || b.width <= 0)
      issues.push({ category: "box", message: `${lbl} → width must be > 0` });
    if (!b.height || b.height <= 0)
      issues.push({ category: "box", message: `${lbl} → height must be > 0` });
    if (!b.weight || b.weight <= 0)
      issues.push({ category: "box", message: `${lbl} → weight must be > 0` });

    const items = b.shipment_box_items || [];
    if (items.length === 0) {
      issues.push({ category: "item", message: `${lbl} → must have at least one item` });
    }
    for (let j = 0; j < items.length; j++) {
      const it = items[j];
      const itLbl = `${lbl}, Item ${j + 1}`;
      if (!it.description?.trim())
        issues.push({ category: "item", message: `${itLbl} → description is required` });
      if (!it.quantity || it.quantity <= 0)
        issues.push({ category: "item", message: `${itLbl} → quantity must be > 0` });
      if (it.unit_price == null || it.unit_price <= 0)
        issues.push({ category: "item", message: `${itLbl} → unit price must be > 0` });
      if (!it.ehsn?.trim())
        issues.push({ category: "item", message: `${itLbl} → export HSN (ehsn) is required` });
    }
  }

  return issues;
}

/* ── Build the cURL string (multipart format) ─────────────── */

export function buildXindusCurl(
  data: ShipmentData,
  _consignorId?: number | null,
): string {
  const payload = buildXindusPayload(data);
  const jsonStr = JSON.stringify(payload, null, 2);

  const base = "https://uat.xindus.net";
  const endpoint = "/xos/api/express-shipment/create";
  const qs = _consignorId ? `?consignor_id=${_consignorId}` : "";

  const lines = [
    `# Express-Shipment API (B2B) — multipart: Excel + JSON`,
    `curl -X POST '${base}${endpoint}${qs}' \\`,
    `  -H 'Authorization: Bearer <YOUR_TOKEN>' \\`,
    `  -F 'box_details_file=@uploadedFile.xlsx;type=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' \\`,
    `  -F 'create_shipment_data=${jsonStr.replace(/'/g, "'\\''")};type=application/json'`,
  ];

  return lines.join("\n");
}

/* ── Partner API: build payload (single-step JSON) ────────── */

function mapPartnerBoxItem(item: ShipmentBoxItem, boxIdx: number, itemIdx: number) {
  return {
    name: item.description || "",
    description: item.description || "",
    sku: `ITEM-${boxIdx + 1}-${itemIdx + 1}`,
    ehsn: normalizeHsn(item.ehsn),
    ihsn: normalizeHsn(item.ihsn),
    duty_rate: String(item.duty_rate ?? 0),
    quantity: String(item.quantity || 1),
    unit_weight: String(item.weight ?? 0),
    unit_price: String(item.unit_price ?? 0),
    igst_rate: String(item.igst_amount ?? 0),
    unit_fob_value: String(item.fob_value ?? 0),
    country_of_origin: normalizeCountry(item.country_of_origin) || "IN",
  };
}

function mapPartnerBox(box: ShipmentBox, idx: number) {
  return {
    box_id: String(idx + 1),
    weight: String(box.weight || 0),
    width: String(box.width || 0),
    length: String(box.length || 0),
    height: String(box.height || 0),
    shipment_box_items: (box.shipment_box_items || []).map((it, j) =>
      mapPartnerBoxItem(it, idx, j),
    ),
  };
}

function mapPartnerAddress(addr: ShipmentAddress | undefined) {
  if (!addr) return {};
  return {
    name: addr.name || "",
    email: addr.email || "",
    phone: addr.phone || "",
    address: addr.address || "",
    city: addr.city || "",
    state: addr.state || "",
    zip: normalizeZip(addr.zip, addr.country),
    country: normalizeCountry(addr.country),
    extension_number: addr.extension_number || "",
  };
}

export function buildPartnerPayload(data: ShipmentData) {
  return {
    shipment_config: {
      shipping_method: data.shipping_method || "AN",
      terms_of_trade: data.terms_of_trade || "DDP",
      tax_type: data.tax_type || "GST",
      service: "Commercial",
      purpose: data.purpose_of_booking || "Sold",
      market_place: data.marketplace || "other",
      use_provided_hsn: true,
      use_provided_duty_rate: true,
      use_provided_fob: true,
      ready_to_ship: false,
      auto_generate_invoice: false,
      auto_deduct_payment: true,
      auto_generate_label: true,
      avail_xindus_assure: false,
      pga_items_included: false,
    },
    order_reference_number:
      data.export_reference || data.shipment_references || data.invoice_number || "",
    invoice_number: data.invoice_number || "",
    invoice_date: normalizeDate(data.invoice_date),
    shipping_currency: data.shipping_currency || "INR",
    freight_charges: "0",
    insurance_charges: "0",
    shipper_address: mapPartnerAddress(data.shipper_address),
    receiver_address: mapPartnerAddress(data.receiver_address),
    billing_address: mapPartnerAddress(
      hasAddress(data.billing_address) ? data.billing_address : data.shipper_address,
    ),
    shipment_boxes: (data.shipment_boxes || []).map((b, i) => mapPartnerBox(b, i)),
  };
}

export function buildPartnerCurl(data: ShipmentData): string {
  const payload = buildPartnerPayload(data);
  const jsonStr = JSON.stringify(payload, null, 2);
  const base = "https://uat.xindus.net";

  const lines = [
    `# Partner Shipment API (B2B) — single-step JSON`,
    `curl -X POST '${base}/xos/api/partner/shipment' \\`,
    `  -H 'Authorization: Bearer <YOUR_TOKEN>' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d '${jsonStr.replace(/'/g, "'\\''")}'`,
  ];

  return lines.join("\n");
}
