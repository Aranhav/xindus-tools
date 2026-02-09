"use client";

import { MapPin } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { SingleValidateTab } from "./_components/single-validate-tab";
import { BulkUploadTab } from "./_components/bulk-upload-tab";

export default function AddressValidationPage() {
  return (
    <PageContainer>
      <PageHeader
        icon={<MapPin className="h-5 w-5" />}
        title="Address Validation"
        description="Validate and normalize US addresses with Smarty API and Claude AI."
      />

      <Tabs defaultValue="single" className="mt-2">
        <TabsList>
          <TabsTrigger value="single">Single Validate</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-6">
          <SingleValidateTab />
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <BulkUploadTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
