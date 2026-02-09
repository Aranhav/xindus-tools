# Xindus Tools

Internal tools portal for Xindus — AI-powered shipment document processing, tracking, address validation, and product classification.

## Tools

| Tool | Route | Description |
|------|-------|-------------|
| **B2B Booking Agent** | `/b2b-agent` | Upload shipment documents, AI extracts and groups into draft B2B shipments for review and approval |
| **IndiaPost Tracker** | `/tracking` | Single and bulk tracking for India Post shipments with timeline visualization |
| **Address Validation** | `/address-validation` | US address validation and normalization via Claude AI + Smarty API |
| **HSN Classifier** | `/hsn-classifier` | AI product classification by image or description for HSN/HTS codes with duty calculation |
| **B2B Sheet Generator** | `/b2b-sheets` | Extract invoice and packing data from PDFs into formatted Excel sheets |

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict)
- **UI**: shadcn/ui (new-york), Tailwind CSS v4, Framer Motion
- **Backend**: Next.js API routes proxy to Railway-hosted Python microservices
- **Deployment**: Docker (node:20-alpine, standalone output), Railway

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your backend service URLs

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── layout.tsx                  # Root layout (sidebar + topbar)
│   ├── b2b-agent/                  # B2B Booking Agent
│   │   ├── page.tsx
│   │   └── _components/            # Agent-specific components
│   ├── tracking/                   # IndiaPost Tracker
│   ├── address-validation/         # Address Validation
│   ├── hsn-classifier/             # HSN Classifier
│   ├── b2b-sheets/                 # B2B Sheet Generator
│   └── api/                        # API route handlers (proxies)
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   └── *.tsx                       # Shared custom components
├── hooks/                          # Custom React hooks
├── types/                          # TypeScript type definitions
└── lib/                            # Utilities (API proxy, S3, helpers)
```

## Architecture

All backend calls flow through Next.js API routes using a proxy pattern:

```
Browser → Next.js API Route → Railway Backend Service
```

The proxy is configured in `src/lib/api.ts` with service routing based on environment variables.

## Build & Deploy

```bash
# Verify build passes (always do this before deploying)
npx next build

# Build Docker image
docker build -t xindus-tools .

# Deploy via Railway
# Uses Dockerfile builder with healthcheck at /api/health
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `INDIAPOST_TRACKER_URL` | IndiaPost tracker service URL |
| `ADDRESS_VALIDATION_URL` | Address validation service URL |
| `B2B_SHEET_GENERATOR_URL` | B2B sheet generator / booking agent service URL |
| `HSN_CLASSIFIER_URL` | HSN/HTS classifier service URL |
