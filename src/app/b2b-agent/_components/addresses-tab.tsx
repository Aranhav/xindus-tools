"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronsUpDown } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ShipperPicker } from "./shipper-picker";
import { ReceiverAddressesSection } from "./receiver-addresses-section";
import { AddressForm } from "./address-form";
import { IorPicker } from "./ior-picker";
import type {
  ShipmentData,
  DraftDetail,
  ShipmentBox,
  CorrectionItem,
  SellerProfile,
  SellerHistory,
  ShipmentAddress,
} from "@/types/agent";

interface AddressesTabProps {
  data: ShipmentData;
  draft: DraftDetail;
  boxes: ShipmentBox[];
  onBoxesChange: (boxes: ShipmentBox[]) => void;
  addCorrections: (corrections: CorrectionItem[]) => void;
  sellerDefaults: Record<string, unknown>;
  sellerProfile?: SellerProfile | null;
  sellerHistory?: SellerHistory | null;
  multiAddress: boolean;
}

type SectionKey = "origin" | "destination" | "compliance";

function SectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-1.5 py-1 text-left"
      onClick={onToggle}
    >
      <ChevronDown
        className={`h-3 w-3 text-muted-foreground/60 transition-transform ${open ? "" : "-rotate-90"}`}
      />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
    </button>
  );
}

export function AddressesTab({
  data,
  draft,
  boxes,
  onBoxesChange,
  addCorrections,
  sellerDefaults,
  sellerProfile,
  sellerHistory,
  multiAddress,
}: AddressesTabProps) {
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    origin: true,
    destination: true,
    compliance: true,
  });

  const allOpen = useMemo(
    () => Object.values(openSections).every(Boolean),
    [openSections],
  );
  const allClosed = useMemo(
    () => Object.values(openSections).every((v) => !v),
    [openSections],
  );

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const next = allOpen ? false : true;
    setOpenSections({ origin: next, destination: next, compliance: next });
  };

  return (
    <TabsContent value="addresses" className="mt-0 px-6 py-3">
      {/* Expand / Collapse all */}
      <div className="mb-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={toggleAll}
        >
          <ChevronsUpDown className="h-3 w-3" />
          {allOpen ? "Collapse All" : allClosed ? "Expand All" : "Expand All"}
        </Button>
      </div>

      <div className="space-y-3">
        {/* Section 1: Origin — Shipper pickup */}
        <div>
          <SectionHeader
            label="Origin"
            open={openSections.origin}
            onToggle={() => toggleSection("origin")}
          />
          {openSections.origin && (
            <div className="mt-1.5">
              <ShipperPicker
                shipperAddress={data.shipper_address}
                xindusCustomerId={sellerProfile?.xindus_customer_id}
                onCorrections={addCorrections}
                confidence={draft.confidence_scores?.shipper_address as Record<string, number> | undefined}
              />
            </div>
          )}
        </div>

        {/* Section 2: Destination — Receiver addresses */}
        <div>
          <SectionHeader
            label="Destination"
            open={openSections.destination}
            onToggle={() => toggleSection("destination")}
          />
          {openSections.destination && (
            <div className="mt-1.5">
              <ReceiverAddressesSection
                boxes={boxes}
                onBoxesChange={onBoxesChange}
                multiAddress={multiAddress}
                sellerHistory={sellerHistory}
                confidence={draft.confidence_scores?.receiver_address as Record<string, number> | undefined}
              />
            </div>
          )}
        </div>

        {/* Section 3: Compliance & Billing */}
        <div>
          <SectionHeader
            label="Compliance & Billing"
            open={openSections.compliance}
            onToggle={() => toggleSection("compliance")}
          />
          {openSections.compliance && (
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <AddressForm
                label="Billing (Consignee)"
                address={data.billing_address}
                basePath="billing_address"
                confidence={draft.confidence_scores?.billing_address as Record<string, number> | undefined}
                sellerDefault={sellerDefaults.billing_address as ShipmentAddress | undefined}
                onCorrections={addCorrections}
                addressType="billing"
                previousAddresses={sellerHistory?.billing_addresses}
              />
              <IorPicker
                iorAddress={data.ior_address}
                xindusCustomerId={sellerProfile?.xindus_customer_id}
                onCorrections={addCorrections}
                confidence={draft.confidence_scores?.ior_address as Record<string, number> | undefined}
                sellerDefault={sellerDefaults.ior_address as ShipmentAddress | undefined}
                sellerHistory={sellerHistory}
              />
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  );
}
