"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type PageIntroProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageIntro({ children, className }: PageIntroProps) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      className={cn(className)}
      initial={false}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
