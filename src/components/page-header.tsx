"use client";

import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      <p className="text-muted-foreground ml-[3.25rem]">{description}</p>
    </motion.div>
  );
}
