"use client";

import { useRef, useState } from "react";
import type { PromptEntry } from "@/lib/types";
import { useReducedMotion, motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Archive } from "lucide-react";

type PromptLibraryPreviewProps = {
  items: PromptEntry[];
};

export function PromptLibraryPreview({ items }: PromptLibraryPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    <section className="studio-section bg-[#04060b]">
      <div className="container-shell relative" ref={containerRef} onMouseMove={handleMouseMove}>
        <div className="mb-8 border-b border-white/10 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="tech-tag mb-2.5">
              <Archive className="h-3 w-3 text-cyan-400" />
              <span>SEC_09 // PROMPT ARCHIVE LEDGER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              提示词工程档案库
            </h2>
          </div>

          <Link
            href="/prompts"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3.5 py-2 font-mono text-xs text-cyan-300 hover:border-cyan-400/50 transition-colors"
          >
            <span>EXPLORE PROMPTS</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="arch-frame rounded-xl overflow-hidden divide-y divide-white/[0.08]">
          {items.map((item, index) => (
            <Link
              href={`/prompts#${item.id}`}
              key={item.id}
              onMouseEnter={() => setHoveredImage(item.exampleImage)}
              onMouseLeave={() => setHoveredImage(null)}
              className="group flex flex-col md:flex-row md:items-center justify-between px-5 py-6 hover:bg-cyan-500/[0.05] transition-colors gap-4"
            >
              <div className="flex items-center gap-5 min-w-0">
                <span className="font-mono text-xs text-cyan-400 shrink-0">
                  ARC_{String(index + 1).padStart(3, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                <span className="rounded border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-0.5 text-cyan-300 uppercase">
                  {item.category}
                </span>
                <span className="text-slate-500">{item.model}</span>
                <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-300 transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        <AnimatePresence>
          {hoveredImage && !reduceMotion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: mousePos.x + 24,
                y: mousePos.y - 80,
              }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="absolute top-0 left-0 w-60 aspect-[4/3] rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.9)] border border-cyan-400/50 z-30 pointer-events-none hidden md:block"
            >
              <Image src={hoveredImage} alt="Preview" fill className="object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
