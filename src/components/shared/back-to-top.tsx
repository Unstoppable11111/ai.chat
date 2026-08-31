"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function BackToTop() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? scrollY / docHeight : 0;
      
      setProgress(scrollPercent);
      // 仅当滚动距离超过 400px 时展示按钮
      setIsVisible(scrollY > 400);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={reduceMotion ? false : { opacity: 0, scale: 0.7, y: 20 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.7, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 md:bottom-24 md:right-6 z-[99] flex h-13 w-13 md:h-14 md:w-14 items-center justify-center rounded-full border border-foreground/10 bg-background/80 backdrop-blur-xl text-foreground shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-transform hover:scale-110 active:scale-95 group"
          aria-label="Back to top"
        >
          {/* SVG Progress Ring with Gradient */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1">
            <defs>
              <linearGradient id="backToTopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-brand-cyan, #06b6d4)" />
                <stop offset="100%" stopColor="var(--color-brand-violet, #8b5cf6)" />
              </linearGradient>
            </defs>
            <circle
              cx="24"
              cy="24"
              r="22"
              className="stroke-foreground/10 fill-none"
              strokeWidth="2"
            />
            <circle
              cx="24"
              cy="24"
              r="22"
              className="fill-none transition-all duration-150 ease-out"
              stroke="url(#backToTopGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          <ArrowUp className="w-5 h-5 text-foreground/70 group-hover:text-foreground group-hover:-translate-y-1 transition-all duration-300" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
