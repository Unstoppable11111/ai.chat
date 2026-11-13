"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight GPU scroll progress indicator.
 * Uses native hardware OS cursor for 0ms pointer responsiveness without cursor-hiding jank.
 */
export function InteractiveEffects() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const progressEl = progressRef.current;
    if (!progressEl) return;

    let rafId = 0;

    const updateProgress = () => {
      rafId = 0;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      const clamped = Math.max(0, Math.min(1, ratio));
      progressEl.style.transform = `scaleX(${clamped.toFixed(4)})`;
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={progressRef}
      aria-hidden="true"
      className="scroll-progress will-change-transform"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
