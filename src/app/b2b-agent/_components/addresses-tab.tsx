"use client";

import { ArrowRight } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { ShipperPicker } from "./shipper-picker";
import { ReceiverAddressesSection } from "./receiver-addresses-section";
import { AddressForm } from "./address-form";
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
  return (
    <TabsContent value="addresses" className="mt-0 px-6 py-4">
      <div className="space-y-6">
        {/* Section 1: Origin — Shipper pickup */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Origin
          </p>
          <ShipperPicker
            shipperAddress={data.shipper_address}
            xindusCustomerId={sellerProfile?.xindus_customer_id}
            onCorrections={addCorrections}
            confidence={draft.confidence_scores?.shipper_address as Record<string, number> | undefined}
          />
        </div>

        {/* Section 2: Destination — Receiver addresses */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Destination
          </p>
          <ReceiverAddressesSection
            boxes={boxes}
            onBoxesChange={onBoxesChange}
            multiAddress={multiAddress}
            sellerHistory={sellerHistory}
            confidence={draft.confidence_scores?.receiver_address as Record<string, number> | undefined}
          />
        </div>

        {/* Section 3: Compliance & Billing */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Compliance &amp; Billing
          </p>
          <div className="relative space-y-0">
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
            {/* Connector */}
            <div className="relative z-10 flex justify-center -my-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm">
                <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground" />
              </div>
            </div>
            <AddressForm
              label="Importer of Record"
              address={data.ior_address}
              basePath="ior_address"
              confidence={draft.confidence_scores?.ior_address as Record<string, number> | undefined}
              sellerDefault={sellerDefaults.ior_address as ShipmentAddress | undefined}
              onCorrections={addCorrections}
              addressType="ior"
              previousAddresses={sellerHistory?.ior_addresses}
            />
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
