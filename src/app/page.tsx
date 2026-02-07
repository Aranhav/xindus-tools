"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Package, MapPin, FileSpreadsheet, ScanSearch, ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tool card data                                                     */
/* ------------------------------------------------------------------ */

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
];

/* ------------------------------------------------------------------ */
/*  Framer-motion variants                                             */
/* ------------------------------------------------------------------ */

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 * i,
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  }),
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 pb-16 text-center">
        <motion.div
          custom={0}
          variants={heroItem}
          initial="hidden"
          animate="visible"
        >
          <Image
            src="/xindus-logo.png"
            alt="Xindus"
            width={64}
            height={64}
            className="mx-auto rounded-xl"
          />
        </motion.div>

        <motion.h1
          custom={1}
          variants={heroItem}
          initial="hidden"
          animate="visible"
          className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
        >
          Xindus Tools
        </motion.h1>

        <motion.p
          custom={2}
          variants={heroItem}
          initial="hidden"
          animate="visible"
          className="mt-4 max-w-lg text-lg text-muted-foreground"
        >
          Internal tools for shipping, address validation, document intelligence,
          and product classification.
        </motion.p>
      </div>

      {/* Tool cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-2"
      >
        {tools.map((tool) => (
          <motion.div key={tool.href} variants={item}>
            <Link href={tool.href} className="group block">
              <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:bg-accent/50">
                {/* Icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-foreground">
                  <tool.icon className="h-5 w-5" />
                </div>

                {/* Title + arrow */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    {tool.title}
                  </h2>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed text-muted-foreground">
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
