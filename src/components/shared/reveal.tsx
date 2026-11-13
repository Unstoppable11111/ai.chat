"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  x?: number;
  y?: number;
  scale?: number;
  blur?: boolean;
};

/**
 * Pure GPU-composited reveal animation (opacity + translate3d + scale).
 * Deliberately omits CSS filter: blur(...) on scroll to guarantee 120fps compositing.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.42,
  once = true,
  direction = "up",
  distance = 16,
  x,
  y,
  scale = 0.99,
  blur: _blur = false,
}: RevealProps) {
  void _blur;
  const reduceMotion = useReducedMotion();

  const xOffset =
    x !== undefined
      ? x
      : direction === "left"
        ? distance
        : direction === "right"
          ? -distance
          : 0;

  const yOffset =
    y !== undefined
      ? y
      : direction === "up"
        ? distance
        : direction === "down"
          ? -distance
          : 0;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: xOffset,
        y: yOffset,
        scale,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      viewport={{ once, amount: 0.08, margin: "0px 0px -48px 0px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
