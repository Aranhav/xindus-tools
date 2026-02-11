/**
 * Build the Xindus Express-Shipment API payload and cURL command.
 *
 * Maps our internal ShipmentData format to the flat Express-Shipment API payload
 * (`POST /api/express-shipment/create`, multipart: Excel + JSON blob).
 * This creates proper B2B shipments (b2b_shipment=1, source=B2B).
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
  // Already a 2-char code
  if (/^[A-Z]{2}$/.test(trimmed)) return trimmed;
  // Lookup by lowercase
  return COUNTRY_MAP[trimmed.toLowerCase()] || trimmed;
}

/* ── Normalize zip: strip ZIP+4 extension (e.g. 18031-1536 → 18031) */

function normalizeZip(zip: string | undefined, country: string | undefined): string {
  if (!zip) return "";
  const trimmed = zip.trim();
  // US ZIP+4: strip the -XXXX suffix
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

/* ── Address: map to Xindus format ────────────────────────── */

function mapAddress(addr: ShipmentAddress | undefined) {
  if (!addr) return { name: "", email: "", phone: "", address: "", city: "", zip: "", state: "", country: "", extension_number: "" };
  return {
    name: addr.name || "",
    email: addr.email || "",
    phone: addr.phone || "",
    address: addr.address || "",
    city: addr.city || "",
    zip: normalizeZip(addr.zip, addr.country),
    state: addr.state || "",
    country: normalizeCountry(addr.country),
    extension_number: addr.extension_number || "",
  };
}

/** Returns true if an address has at least a name filled in. */
function hasAddress(addr: ShipmentAddress | undefined): boolean {
  return !!addr?.name?.trim();
}

/* ── Box item: map to Express-Shipment API field names ──────── */

function mapBoxItem(item: ShipmentBoxItem) {
  return {
    description: item.description || "",
    ehsn: normalizeHsn(item.ehsn),
    ihsn: normalizeHsn(item.ihsn),
    duty_rate: String(item.duty_rate ?? "0"),
    vat_rate: String(item.vat_rate ?? "0"),
    quantity: String(item.quantity || 1),
    weight: String(item.weight ?? 0),
    unit_price: String(item.unit_price ?? 0),
    total_price: String(item.total_price ?? ((item.unit_price ?? 0) * (item.quantity || 1))),
    igst_amount: String(item.igst_amount ?? 0),
    unit_fob_value: String(item.unit_fob_value ?? item.unit_price ?? 0),
    fob_value: String(item.fob_value ?? ((item.unit_fob_value ?? item.unit_price ?? 0) * (item.quantity || 1))),
    country_of_origin: normalizeCountry(item.country_of_origin) || "IN",
    category: item.category || "",
    market_place: item.market_place || "",
    pga_docs: [],
  };
}

/* ── Box: map structure ───────────────────────────────────── */

function mapBox(box: ShipmentBox, idx: number) {
  return {
    box_id: idx + 1,
    weight: String(box.weight || 0),
    width: String(box.width || 0),
    length: String(box.length || 0),
    height: String(box.height || 0),
    uom: "kgs",
    has_battery: false,
    shipment_box_items: (box.shipment_box_items || []).map(mapBoxItem),
  };
}

/* ── Normalize date to ISO 8601 with timezone ──────────────── */

function normalizeDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
  // Already yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw + "T00:00:00.000Z";
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw;
  // dd.MM.yyyy or dd/MM/yyyy or dd-MM-yyyy
  const m = raw.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T00:00:00.000Z`;
  // MM/dd/yyyy (US format) — try parsing
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
}

/* ── Derive product_details from box items (deduplicated) ──── */

function deriveProductDetails(boxes: ShipmentBox[]) {
  const seen = new Map<string, { productDescription: string; hsnCode: string; value: number }>();
  for (const box of boxes) {
    for (const item of box.shipment_box_items || []) {
      const desc = (item.description || "").trim();
      const hsn = normalizeHsn(item.ehsn);
      const key = `${desc}|${hsn}`;
      if (!seen.has(key) && desc) {
        seen.set(key, {
          productDescription: desc,
          hsnCode: hsn,
          value: (item.unit_price ?? 0) * (item.quantity || 1),
        });
      }
    }
  }
  return Array.from(seen.values());
}

/* ── Main: build the Xindus Express-Shipment API payload ───── */

export function buildXindusPayload(data: ShipmentData) {
  // Billing falls back to shipper if not explicitly filled
  const billingSource = hasAddress(data.billing_address)
    ? data.billing_address
    : data.shipper_address;

  const destCountry = normalizeCountry(data.receiver_address?.country || data.country);

  return {
    // Shipment config (flat, no wrapper)
    shipping_method: data.shipping_method || "AN",
    purpose_of_booking: data.purpose_of_booking || "Sold",
    terms_of_trade: data.terms_of_trade || "DAP",
    tax_type: data.tax_type || "GST",
    country: destCountry,
    destination_clearance_type: data.destination_clearance_type || "Informal",
    origin_clearance_type: "Commercial",
    shipping_currency: data.shipping_currency || "USD",
    billing_currency: data.billing_currency || data.shipping_currency || "USD",
    amazon_fba: data.amazon_fba ?? false,
    self_drop: data.self_drop ?? false,
    self_origin_clearance: data.self_origin_clearance ?? false,
    self_destination_clearance: data.self_destination_clearance ?? false,
    multi_address_destination_delivery: data.multi_address_destination_delivery ?? false,
    marketplace: data.marketplace || "other",
    expected_load: 0,
    invoice_have_packing: false,
    scancode: null,
    draft_scancode: null,

    // Addresses (4)
    shipper_address: mapAddress(data.shipper_address),
    receiver_address: mapAddress(data.receiver_address),
    billing_address: mapAddress(billingSource),
    ior_address: mapAddress(data.ior_address),

    // Products (customs declaration summary)
    product_details: deriveProductDetails(data.shipment_boxes || []),

    // Boxes
    shipment_boxes: (data.shipment_boxes || []).map((b, i) => mapBox(b, i)),

    // Invoice
    invoice_number: data.invoice_number || "",
    invoice_date: normalizeDate(data.invoice_date),
    total_amount: data.total_amount || 0,

    // References
    shipment_references: data.shipment_references || data.export_reference || data.invoice_number || "",
    export_reference: data.export_reference || data.shipment_references || data.invoice_number || "",
    exporter_category: data.exporter_category || "",

    // Logistics
    port_of_entry: data.port_of_entry || "",
    destination_cha: data.destination_cha || "",
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

  // Top-level fields
  if (!data.invoice_number?.trim())
    issues.push({ category: "shipment", message: "Invoice number is required" });
  if (!data.invoice_date?.trim())
    issues.push({ category: "shipment", message: "Invoice date is required" });

  // B2B-specific fields
  if (!data.destination_clearance_type?.trim() || !VALID_DEST_CLEARANCE.includes(data.destination_clearance_type.trim()))
    issues.push({ category: "shipment", message: `Destination clearance type must be one of: ${VALID_DEST_CLEARANCE.join(", ")}` });

  const destCountry = normalizeCountry(data.receiver_address?.country || data.country);
  if (!destCountry)
    issues.push({ category: "shipment", message: "Destination country is required" });

  // Addresses
  validateAddress(data.shipper_address, "Shipper", issues);
  validateAddress(data.receiver_address, "Receiver", issues);
  // Billing: only validate if provided (falls back to shipper)
  if (data.billing_address?.name?.trim()) {
    validateAddress(data.billing_address, "Billing", issues);
  }

  // Boxes
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

    // Box items
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
      if (!it.ihsn?.trim())
        issues.push({ category: "item", message: `${itLbl} → import HSN (ihsn) is required` });
      const effectiveFob = it.unit_fob_value ?? it.unit_price ?? 0;
      if (effectiveFob <= 0)
        issues.push({ category: "item", message: `${itLbl} → FOB value or unit price must be > 0` });
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
  const endpoint = "/api/express-shipment/create";
  const qs = _consignorId ? `?consignor_id=${_consignorId}` : "";

  const lines = [
    `# Express-Shipment API (B2B) — multipart: Excel + JSON`,
    `# 1. Generate the XpressB2B Excel sheet from shipment_boxes`,
    `# 2. POST multipart form data:`,
    `curl -X POST '${base}${endpoint}${qs}' \\`,
    `  -H 'Authorization: Bearer <YOUR_TOKEN>' \\`,
    `  -F 'box_details_file=@uploadedFile.xlsx;type=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' \\`,
    `  -F 'create_shipment_data=${jsonStr.replace(/'/g, "'\\''")}'`,
  ];

  return lines.join("\n");
}
