"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, MapPin, FileSpreadsheet, ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tool card data                                                     */
/* ------------------------------------------------------------------ */

const tools = [
  {
    title: "IndiaPost Tracker",
    description:
      "Track India Post shipments in real-time with timeline visualization.",
    icon: Package,
    href: "/tracking",
    accent: "violet" as const,
  },
  {
    title: "Address Validation",
    description:
      "Validate and normalize US & international addresses with DPV analysis.",
    icon: MapPin,
    href: "/address-validation",
    accent: "cyan" as const,
  },
  {
    title: "B2B Sheet Generator",
    description:
      "Extract invoice and packing data from PDFs into formatted Excel sheets.",
    icon: FileSpreadsheet,
    href: "/b2b-sheets",
    accent: "amber" as const,
  },
] as const;

/* colour maps keyed by accent name */
const accentRing: Record<string, string> = {
  violet: "hover:border-violet-500/60 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.35)]",
  cyan: "hover:border-cyan-500/60 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.35)]",
  amber: "hover:border-amber-500/60 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.35)]",
};

const accentIcon: Record<string, string> = {
  violet: "text-violet-400",
  cyan: "text-cyan-400",
  amber: "text-amber-400",
};

const accentArrow: Record<string, string> = {
  violet: "group-hover:text-violet-400",
  cyan: "group-hover:text-cyan-400",
  amber: "group-hover:text-amber-400",
};

/* ------------------------------------------------------------------ */
/*  Framer-motion variants                                             */
/* ------------------------------------------------------------------ */

const heroVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.15 * i, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.6 + 0.15 * i,
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  }),
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setMouse({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      className="dark relative min-h-screen overflow-hidden bg-black text-white"
    >
      {/* ---- CSS grid background pattern ---- */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* ---- Radial gradient glow behind hero ---- */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[800px] w-[900px] opacity-50 blur-[100px]">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.35),rgba(6,182,212,0.18),transparent_70%)]" />
      </div>

      {/* ---- Mouse-follow spotlight ---- */}
      <div
        className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${mouse.x}px ${mouse.y}px, rgba(139,92,246,0.06), transparent 60%)`,
        }}
      />

      {/* ---- Main content ---- */}
      <div className="relative z-20 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-24">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <motion.h1
            custom={0}
            variants={heroVariants}
            initial="hidden"
            animate="visible"
            className="font-serif text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
          >
            <span className="bg-gradient-to-r from-violet-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Xindus Tools
            </span>
          </motion.h1>

          <motion.p
            custom={1}
            variants={heroVariants}
            initial="hidden"
            animate="visible"
            className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-400 sm:text-xl"
          >
            Unified portal for shipping, address validation, and document
            intelligence.
          </motion.p>
        </div>

        {/* Tool cards */}
        <div className="mt-20 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.href}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Link href={tool.href} className="group block h-full">
                <div
                  className={`relative flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-900/50 p-6 backdrop-blur-sm transition-all duration-300 ${accentRing[tool.accent]}`}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ${accentIcon[tool.accent]}`}
                  >
                    <tool.icon className="h-5 w-5" />
                  </div>

                  {/* Title + arrow */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                      {tool.title}
                    </h2>
                    <ArrowRight
                      className={`h-4 w-4 -translate-x-1 text-neutral-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 ${accentArrow[tool.accent]}`}
                    />
                  </div>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-neutral-500">
                    {tool.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
