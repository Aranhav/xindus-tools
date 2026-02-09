# CLAUDE.md — Xindus Tools Portal

## Project Purpose
AI-powered B2B Booking Agent for Xindus. Upload shipment documents → AI extracts & groups → draft shipments → review/correct → approve to Xindus platform.

## Code Guidelines

### Component Reuse
- **Always check `/src/components/` for existing shared components** before creating new ones
- Shared components: `page-header`, `page-container`, `error-display`, `file-upload-zone`, `status-badge`, `copy-button`, `confidence-badge`
- UI primitives are in `/src/components/ui/` (shadcn/ui) — never recreate these
- B2B agent components live in `/src/app/b2b-agent/_components/` — reuse within the agent

### File Size & Structure
- **Keep files under 300 lines**. If a component grows beyond that, extract sub-components
- One component per file. Helper sub-components (used only in that file) are OK inline
- Types go in `/src/types/` — one file per domain (e.g. `agent.ts` for B2B agent types)
- Hooks go in `/src/hooks/` — one hook per file
- API routes: one route file per endpoint, proxy pattern via `/src/lib/api.ts`

### Code Style
- Use TypeScript strict mode — no `any` unless unavoidable (add eslint-disable comment)
- Prefer `useCallback`/`useMemo` for functions and derived state in hooks
- Tailwind classes only — no CSS modules or inline styles
- shadcn/ui components with `className` overrides — don't wrap in styled divs
- Use `Label` component for form labels, not raw `<label>` tags

### Naming Conventions
- Components: PascalCase (`DraftTable`, `SellerMatch`)
- Files: kebab-case (`draft-table.tsx`, `seller-match.tsx`)
- Hooks: `use-` prefix (`use-b2b-agent.ts`)
- API routes: kebab-case directories matching the URL path
- Types: PascalCase interfaces (`ShipmentData`, `DraftDetail`)

### API Proxy Pattern
All backend calls go through Next.js API routes using `proxyFetch()` from `/src/lib/api.ts`:
```typescript
import { proxyFetch, errorResponse } from "@/lib/api";
const res = await proxyFetch("b2b", `/api/agent/endpoint`);
```
Services: `"tracking"`, `"address"`, `"b2b"`, `"hsn"`

## Build & Deploy

### Before Deploying
**ALWAYS run `npx next build` first** to catch TypeScript and build errors. Do not deploy broken code.

### Deploy to Railway
```
npx next build                        # verify build passes
git add <files> && git commit          # commit changes
git push origin main                   # push to GitHub
# Then use Railway MCP deploy tool with ci: true
```

### Docker
- Multi-stage build: `node:20-alpine`
- Output: Next.js standalone
- Healthcheck: `/api/health`

## Xindus B2B Shipment Create Format

### Endpoint
`POST /api/express-shipment/create` (multipart: Excel + JSON blob)
Query param: `?consignor_id=<customer_id>`

### JSON Payload Structure
```
ShipmentData {
  // Config
  shipping_method, origin_clearance_type (always "Commercial"),
  destination_clearance_type (Formal|Informal|T86),
  terms_of_trade (DDP|DDU|DAP|CIF), tax_type (GST|LUT),
  purpose_of_booking, country, marketplace, amazon_fba,
  multi_address_destination_delivery

  // Addresses (4)
  shipper_address, receiver_address, billing_address, ior_address
  → Each: { name, email, phone, address, city, zip, state, country, ... }

  // Products (customs declaration summary)
  product_details: [{ product_description, hsn_code, value }]

  // Boxes (physical packaging)
  shipment_boxes: [{
    box_id, length, width, height, weight, uom, has_battery,
    receiver_address (if multi-address),
    shipment_box_items: [{
      description, quantity, weight, unit_price, total_price,
      ehsn, ihsn, country_of_origin, category, market_place,
      igst_amount, duty_rate, vat_rate, unit_fob_value, fob_value, ...
    }]
  }]

  // Invoice
  invoice_number, invoice_date, total_amount,
  shipping_currency, billing_currency

  // References & Logistics
  export_reference, shipment_references, exporter_category,
  self_drop, self_origin_clearance, self_destination_clearance,
  port_of_entry, destination_cha
}
```

### Key Distinction
- `product_details` = customs declaration summary (separate list, not derived from boxes)
- `shipment_box_items` = physical items inside each box (detailed item-level data)

## Database Reference (Xindus UAT)
- `customers` table — company name, IEC, GSTN for seller matching
- `addresses` table — typed addresses (S/P/B/I/R) per customer
- `orders` table — historical shipments with dest_clearance, terms patterns
- `draft_shipments` table — saved drafts with full JSON payload
- Use `xindus-db` MCP tool for queries (read-only, UAT and prod)
