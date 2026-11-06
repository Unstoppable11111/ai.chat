"use client";

import React, { useRef, useState } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

interface SpotlightCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  enableTilt?: boolean;
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(14, 165, 233, 0.12)",
  enableTilt = true,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: -200, y: -200, opacity: 0 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const reduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursorPos({ x, y, opacity: 1 });

    if (enableTilt && !reduceMotion) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4.5; // 柔和 4.5 度物理倾角
      const rotateY = ((x - centerX) / centerX) * 4.5;
      setTilt({ rotateX, rotateY });
    }
  };

  const handleMouseLeave = () => {
    setCursorPos((prev) => ({ ...prev, opacity: 0 }));
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
      }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      style={{ transformStyle: "preserve-3d" }}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* 极光双色 Spotlight 跟随光晕层 */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500 rounded-[inherit] z-10"
        style={{
          opacity: cursorPos.opacity,
          background: `radial-gradient(520px circle at ${cursorPos.x}px ${cursorPos.y}px, ${spotlightColor}, rgba(139, 92, 246, 0.05) 35%, transparent 65%)`,
        }}
      />
      {/* 边缘高光折射层 */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 rounded-[inherit] z-10"
        style={{
          opacity: cursorPos.opacity,
          boxShadow: "inset 0 0 0 1px rgba(14, 165, 233, 0.22)",
        }}
      />
      {children}
    </motion.div>
  );
}
