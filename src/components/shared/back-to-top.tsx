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
      const scrollPercent = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
      
      setProgress(scrollPercent);
      // 仅当滚动距离超过 350px 时展示按钮
      setIsVisible(scrollY > 350);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 标准圆环参数：viewBox 0 0 48 48, 中心 (24, 24), 半径 r=20
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={reduceMotion ? false : { opacity: 0, scale: 0.7, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.7, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-[49] flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-slate-900/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-foreground shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer"
          aria-label="回到顶部"
        >
          {/* 精密自适应 SVG 进度环 */}
          <svg 
            viewBox="0 0 48 48"
            className="absolute inset-0 h-full w-full -rotate-90 pointer-events-none"
          >
            <defs>
              <linearGradient id="backToTopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            {/* 底环轨道 */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              className="stroke-slate-900/10 dark:stroke-white/10 fill-none"
              strokeWidth="2.5"
            />
            {/* 渐变进度环 */}
            <circle
              cx="24"
              cy="24"
              r={radius}
              className="fill-none transition-[stroke-dashoffset] duration-150 ease-out"
              stroke="url(#backToTopGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-foreground/75 group-hover:text-foreground group-hover:-translate-y-0.5 transition-all duration-300" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
