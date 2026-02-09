"use client";

import { motion } from "framer-motion";
import { Package } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SingleTrackTab } from "./_components/single-track-tab";
import { BulkTrackTab } from "./_components/bulk-track-tab";

export default function TrackingPage() {
  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="IndiaPost Tracker"
          description="Track your India Post shipments in real-time. Single or bulk tracking with export support."
          icon={<Package className="h-5 w-5" />}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Tabs defaultValue="single">
            <TabsList>
              <TabsTrigger value="single">Single Track</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Track</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="mt-6">
              <SingleTrackTab />
            </TabsContent>

            <TabsContent value="bulk" className="mt-6">
              <BulkTrackTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
