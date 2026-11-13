"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// 标准圆环参数：viewBox 0 0 48 48, 中心 (24, 24), 半径 r=20
const radius = 20;
const circumference = 2 * Math.PI * radius;

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const reduceMotion = useReducedMotion();
  const progressRef = useRef<SVGCircleElement | null>(null);
  const progressValueRef = useRef(0);

  useEffect(() => {
    let frame = 0;
    // 性能优化：滚动进度不再走 React state（原实现每个 scroll 事件都会重渲染整个按钮），
    // 改为 requestAnimationFrame 节流 + 直接写入 SVG 属性；只有显隐变化才触发 setState。
    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;

      progressValueRef.current = scrollPercent;
      progressRef.current?.setAttribute("stroke-dashoffset", String(circumference - scrollPercent * circumference));
      // 仅当滚动距离超过 350px 时展示按钮（值未变化时 React 会自动跳过渲染）
      setIsVisible(scrollY > 350);
    };
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={reduceMotion ? false : { opacity: 0, scale: 0.7, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.7, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-[49] flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/15 bg-[#060a14]/90 backdrop-blur-md text-white shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-110 hover:border-cyan-500/40 active:scale-95 group cursor-pointer"
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
              className="stroke-white/10 fill-none"
              strokeWidth="2.5"
            />
            {/* 渐变进度环 */}
            <circle
              ref={(el) => {
                progressRef.current = el;
                // 按钮重新挂载时同步当前滚动进度（进度值保存在 ref 中，不参与渲染）
                el?.setAttribute("stroke-dashoffset", String(circumference - progressValueRef.current * circumference));
              }}
              cx="24"
              cy="24"
              r={radius}
              className="fill-none transition-[stroke-dashoffset] duration-150 ease-out"
              stroke="url(#backToTopGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
            />
          </svg>

          <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-foreground/75 group-hover:text-foreground group-hover:-translate-y-0.5 transition-all duration-300" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
