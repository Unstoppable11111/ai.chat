"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type PageIntroProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageIntro({ children, className }: PageIntroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
