"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlightColor?: string;
  enableTilt?: boolean;
  tiltEnabled?: boolean;
}

/**
 * Zero-re-render spotlight & subtle 3D tilt card.
 * Updates DOM CSS variables & transform via requestAnimationFrame without triggering React state updates.
 */
export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(14, 165, 233, 0.14)",
  enableTilt,
  tiltEnabled,
  ...props
}: SpotlightCardProps) {
  const shouldTilt = enableTilt ?? tiltEnabled ?? false;
  const cardRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (spotRef.current) {
        spotRef.current.style.opacity = "1";
        spotRef.current.style.background = `radial-gradient(560px circle at ${x}px ${y}px, ${spotlightColor}, transparent 42%)`;
      }
      if (shouldTilt && cardRef.current) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -3.5;
        const rotateY = ((x - centerX) / centerX) * 3.5;
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0, -2px, 0)`;
      }
    });
  };

  const handleMouseEnter = () => {
    if (spotRef.current) {
      spotRef.current.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    if (spotRef.current) {
      spotRef.current.style.opacity = "0";
    }
    if (shouldTilt && cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)";
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden transition-transform duration-300 ease-out will-change-transform",
        className
      )}
      {...props}
    >
      <div
        ref={spotRef}
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-0"
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
