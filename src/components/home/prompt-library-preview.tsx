"use client";

import { useEffect, useRef, useState } from "react";
import type { PromptEntry } from "@/lib/types";
import { useReducedMotion, motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type PromptLibraryPreviewProps = {
  items: PromptEntry[];
};

export function PromptLibraryPreview({ items }: PromptLibraryPreviewProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduceMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Header 标题与扫描光束放慢滑过
      if (scanLineRef.current) {
        gsap.fromTo(
          scanLineRef.current,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: scanLineRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // 2. 每行档案放慢 Decrypt Scan 显影效果 (更深初始位移，放慢间隔，清晰可见)
      const rows = gsap.utils.toArray<HTMLElement>(".archive-row");
      rows.forEach((row, index) => {
        gsap.fromTo(
          row,
          { opacity: 0, y: 45, filter: "blur(12px)", scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            scale: 1,
            duration: 1.0,
            delay: index * 0.18,
            ease: "power3.out",
            scrollTrigger: {
              trigger: row,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reduceMotion) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <section ref={sectionRef} className="relative w-full bg-background pt-24 pb-48 overflow-hidden">
      <div 
        className="container-shell max-w-5xl mx-auto relative" 
        ref={containerRef}
        onMouseMove={handleMouseMove}
      >
        
        <div className="mb-16 border-b border-slate-900/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-8 relative">
          {/* 光线 Scanline 扫描线 */}
          <div ref={scanLineRef} className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-cyan to-transparent origin-left will-change-transform pointer-events-none" />

          <div>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground">
              DIGITAL ARCHIVE
            </h2>
          </div>
          <div className="hidden md:flex text-[10px] font-mono text-muted-foreground gap-12 tracking-widest uppercase">
            <span>ID</span>
            <span>TYPE</span>
            <span>MODIFIED</span>
          </div>
        </div>

        <div className="flex flex-col relative">
          {items.map((item, index) => (
            <Link 
              href={`/prompts/${item.id}`}
              key={item.id} 
              onMouseEnter={() => setHoveredImage(item.exampleImage)}
              onMouseLeave={() => setHoveredImage(null)}
              className="archive-row group relative flex flex-col md:flex-row md:items-center justify-between py-8 border-b border-slate-900/5 hover:border-slate-900/20 transition-all duration-500 z-10 will-change-transform"
            >
              <div className="flex items-center gap-6 md:gap-12 min-w-0">
                <span className="text-[10px] md:text-xs font-mono text-muted-foreground group-hover:text-brand-violet transition-colors shrink-0">
                  ARCHIVE_{String(index + 1).padStart(3, '0')}
                </span>
                <h3 className="text-lg md:text-3xl font-light truncate text-foreground group-hover:translate-x-4 transition-transform duration-500 ease-out">
                  {item.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-8 md:gap-16 mt-4 md:mt-0 text-[10px] md:text-xs font-mono text-muted-foreground tracking-widest">
                <span className="uppercase w-24">{item.category}</span>
                <span>2026.08</span>
              </div>
            </Link>
          ))}

          {/* Floating Image Reveal */}
          <AnimatePresence>
            {hoveredImage && !reduceMotion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotate: 0,
                  x: mousePos.x + 40,
                  y: mousePos.y - 100
                }}
                exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                transition={{ type: "spring", stiffness: 150, damping: 20, mass: 0.5 }}
                className="absolute top-0 left-0 w-64 aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl z-0 pointer-events-none hidden md:block"
              >
                <Image 
                  src={hoveredImage} 
                  alt="Preview" 
                  fill 
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/5" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
