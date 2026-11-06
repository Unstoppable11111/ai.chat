"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  blur?: boolean;
};

export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
  direction = "up",
  distance = 22,
  blur = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  const xOffset =
    direction === "left" ? distance : direction === "right" ? -distance : 0;
  const yOffset =
    direction === "up" ? distance : direction === "down" ? -distance : 0;

  return (
    <motion.div
      className={cn(className)}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              x: xOffset,
              y: yOffset,
              scale: 0.985,
              filter: blur ? "blur(5px)" : "blur(0px)",
            }
      }
      whileInView={
        reduceMotion
          ? undefined
          : {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }
      }
      viewport={{ once, amount: 0.12, margin: "0px 0px -6% 0px" }}
      transition={{
        duration: 0.58,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
