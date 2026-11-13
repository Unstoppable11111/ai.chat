"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type PageIntroProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageIntro({ children, className }: PageIntroProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0.85, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
