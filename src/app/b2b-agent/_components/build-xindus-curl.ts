/**
 * Build a cURL command for the Xindus Partner API shipment create endpoint.
 *
 * Maps our internal ShipmentData format to the exact Xindus Partner API payload
 * (`POST /xos/api/partner/shipment`), ready to paste into Postman or a terminal.
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

/* ── Strip dots/periods from HSN codes ─────────────────────── */

function normalizeHsn(raw: string | undefined): string {
  if (!raw) return "";
  return raw.replace(/\./g, "");
}

/* ── Address: map to Xindus format ────────────────────────── */

function mapAddress(addr: ShipmentAddress | undefined) {
  if (!addr) return undefined;
  return {
    name: addr.name || "",
    email: addr.email || "",
    phone: addr.phone || "",
    address: addr.address || "",
    city: addr.city || "",
    zip: addr.zip || "",
    state: addr.state || "",
    country: normalizeCountry(addr.country),
    extension_number: addr.extension_number || "",
  };
}

/** Returns true if an address has at least a name filled in. */
function hasAddress(addr: ShipmentAddress | undefined): boolean {
  return !!addr?.name?.trim();
}

/* ── Box item: map to Xindus Partner API field names ──────── */

function mapBoxItem(item: ShipmentBoxItem) {
  return {
    name: item.description || "",
    description: item.description || "",
    ehsn: normalizeHsn(item.ehsn),
    ihsn: normalizeHsn(item.ihsn),
    duty_rate: String(item.duty_rate ?? "0"),
    quantity: String(item.quantity || 1),
    unit_weight: String(item.weight ?? 0),
    unit_price: String(item.unit_price ?? 0),
    igst_rate: String(item.igst_amount ?? 0),
    unit_fob_value: String(item.unit_fob_value ?? item.unit_price ?? 0),
    sku: "",
    country_of_origin: normalizeCountry(item.country_of_origin) || "IN",
    pga_docs: [],
  };
}

/* ── Box: map structure ───────────────────────────────────── */

function mapBox(box: ShipmentBox, idx: number) {
  return {
    box_id: String(idx + 1),
    weight: String(box.weight || 0),
    width: String(box.width || 0),
    length: String(box.length || 0),
    height: String(box.height || 0),
    shipment_box_items: (box.shipment_box_items || []).map(mapBoxItem),
  };
}

/* ── Normalize date to yyyy-MM-dd ─────────────────────────── */

function normalizeDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString().split("T")[0];
  // Already yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // dd.MM.yyyy or dd/MM/yyyy or dd-MM-yyyy
  const m = raw.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  // MM/dd/yyyy (US format) — try parsing
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  return new Date().toISOString().split("T")[0];
}

/* ── Main: build the Xindus Partner API payload ───────────── */

export function buildXindusPayload(data: ShipmentData) {
  // Billing falls back to shipper if not explicitly filled
  const billingSource = hasAddress(data.billing_address)
    ? data.billing_address
    : data.shipper_address;

  return {
    shipment_config: {
      shipping_method: data.shipping_method || "AN",
      terms_of_trade: data.terms_of_trade || "DAP",
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
      avail_xindus_assure: true,
      pga_items_included: false,
    },
    order_reference_number: data.export_reference || data.shipment_references || data.invoice_number || "",
    invoice_number: data.invoice_number || "",
    invoice_date: normalizeDate(data.invoice_date),
    shipping_currency: data.shipping_currency || "INR",
    freight_charges: "0",
    insurance_charges: "0",
    consignor_email: data.shipper_address?.email || "",

    shipment_boxes: (data.shipment_boxes || []).map((b, i) => mapBox(b, i)),

    shipper_address: mapAddress(data.shipper_address),
    receiver_address: mapAddress(data.receiver_address),
    billing_address: mapAddress(billingSource),
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

export function validateForXindus(data: ShipmentData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Top-level fields
  if (!data.invoice_number?.trim())
    issues.push({ category: "shipment", message: "Invoice number is required" });
  if (!data.invoice_date?.trim())
    issues.push({ category: "shipment", message: "Invoice date is required" });

  // Addresses
  validateAddress(data.shipper_address, "Shipper", issues);
  validateAddress(data.receiver_address, "Receiver", issues);
  // Billing: only validate if provided (Xindus copies from receiver if empty)
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

/* ── Build the cURL string ────────────────────────────────── */

export function buildXindusCurl(
  data: ShipmentData,
  _consignorId?: number | null,
): string {
  const payload = buildXindusPayload(data);
  const json = JSON.stringify(payload, null, 2);

  const base = "https://api.xindus.net";
  const endpoint = "/xos/api/partner/shipment";

  const lines = [
    `curl -X POST '${base}${endpoint}' \\`,
    `  -H 'Authorization: Bearer <YOUR_TOKEN>' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d '${json.replace(/'/g, "'\\''")}'`,
  ];

  return lines.join("\n");
}
