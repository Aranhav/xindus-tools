"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClassificationItem } from "@/types/hsn";

import { ProductCard } from "./product-card";

/* ------------------------------------------------------------------ */
/*  Swipeable Product Tabs                                              */
/* ------------------------------------------------------------------ */

const SWIPE_THRESHOLD = 50;

export function ProductTabs({ items }: { items: ClassificationItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const goTo = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD && activeIndex < items.length - 1) {
      goTo(activeIndex + 1);
    } else if (info.offset.x > SWIPE_THRESHOLD && activeIndex > 0) {
      goTo(activeIndex - 1);
    }
  };

  // Single product — no tabs needed
  if (items.length === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{items[0].humanTitle}</span>
              <ConfidenceBadge value={items[0].confidence.top1} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductCard item={items[0]} />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const current = items[activeIndex];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card>
        {/* Tab header */}
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 overflow-x-auto">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    i === activeIndex
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-xs opacity-70">{i + 1}</span>
                  <span className="max-w-[140px] truncate">{item.humanTitle}</span>
                </button>
              ))}
            </div>
            <ConfidenceBadge value={current.confidence.top1} />
          </div>

          {/* Navigation arrows + swipe hint */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs text-muted-foreground">
              {activeIndex + 1} of {items.length} products &middot; swipe or tap to switch
            </p>
            <button
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === items.length - 1}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        {/* Swipeable content area */}
        <CardContent className="pt-4" ref={constraintsRef}>
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] as const }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                className="cursor-grab active:cursor-grabbing"
              >
                <ProductCard item={current} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicators */}
          <div className="mt-4 flex justify-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
