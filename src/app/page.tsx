"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Package, MapPin, FileSpreadsheet, ScanSearch, Bot, ArrowRight } from "lucide-react";

const tools = [
  {
    title: "IndiaPost Tracker",
    description:
      "Track India Post shipments in real-time with timeline visualization and bulk tracking.",
    icon: Package,
    href: "/tracking",
  },
  {
    title: "Address Validation",
    description:
      "Validate and normalize US addresses with DPV analysis and autocomplete.",
    icon: MapPin,
    href: "/address-validation",
  },
  {
    title: "B2B Sheet Generator",
    description:
      "Extract invoice and packing data from PDFs into formatted Excel sheets.",
    icon: FileSpreadsheet,
    href: "/b2b-sheets",
  },
  {
    title: "HSN Classifier",
    description:
      "Classify products by image or description to get HSN/HTS codes with AI.",
    icon: ScanSearch,
    href: "/hsn-classifier",
  },
  {
    title: "B2B Booking Agent",
    description:
      "Upload shipment documents in bulk, AI extracts and groups into draft shipments for review.",
    icon: Bot,
    href: "/b2b-agent",
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] as const }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a tool to get started.
        </p>
      </motion.div>

      {/* Tool cards grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {tools.map((tool) => (
          <motion.div key={tool.href} variants={item}>
            <Link href={tool.href} className="group block h-full">
              <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-foreground">
                  <tool.icon className="h-4.5 w-4.5" />
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    {tool.title}
                  </h2>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
