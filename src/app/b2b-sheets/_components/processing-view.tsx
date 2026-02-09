"use client";

import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { pageVariants } from "./helpers";

/* ------------------------------------------------------------------ */
/*  ProcessingView                                                     */
/* ------------------------------------------------------------------ */

interface ProcessingViewProps {
  progress: number;
  currentStep: number;
  currentStepLabel: string;
  steps: { label: string; progress: number }[];
}

export function ProcessingView({
  progress,
  currentStep,
  currentStepLabel,
  steps,
}: ProcessingViewProps) {
  return (
    <motion.div
      key="processing"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-8 py-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-10 w-10 text-primary" />
          </motion.div>

          <div className="w-full space-y-3">
            {steps.map((step, i) => {
              const isComplete = i < currentStep || (i === currentStep && progress === 100);
              const isActive = i === currentStep && progress < 100;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
                    isActive
                      ? "bg-primary/10 border border-primary/20"
                      : isComplete
                        ? "bg-muted/50"
                        : "opacity-50"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      isComplete
                        ? "bg-primary text-primary-foreground"
                        : isActive
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-primary"
                        : isComplete
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <motion.div
                      className="ml-auto h-2 w-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="w-full space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {currentStepLabel}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
