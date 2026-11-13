"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Eye } from "lucide-react";
import type { ExperimentEntry } from "@/lib/types";

type FeaturedExperimentsProps = {
  items: ExperimentEntry[];
};

export function FeaturedExperiments({ items }: FeaturedExperimentsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const momentumIDRef = useRef(0);

  const getYear = (date: string) => {
    const year = new Date(date).getFullYear();
    return Number.isNaN(year) ? "2026" : String(year);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || items.length < 2) return;

    const timer = window.setInterval(() => {
      if (isPausedRef.current || isDraggingRef.current) return;

      const firstCard = container.querySelector<HTMLElement>(".experiment-slide");
      if (!firstCard) return;

      const gap = Number.parseFloat(getComputedStyle(container).columnGap || "0");
      const nextLeft = container.scrollLeft + firstCard.offsetWidth + gap;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (nextLeft >= maxScroll - 8) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollTo({ left: nextLeft, behavior: "smooth" });
      }
    }, 5200);

    return () => {
      window.clearInterval(timer);
      cancelAnimationFrame(momentumIDRef.current);
    };
  }, [items.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    cancelAnimationFrame(momentumIDRef.current);
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    lastXRef.current = e.pageX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    scrollContainerRef.current.style.scrollSnapType = "none";
    scrollContainerRef.current.style.scrollBehavior = "auto";
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const decay = () => {
      if (!scrollContainerRef.current) return;
      scrollContainerRef.current.scrollLeft -= velocityRef.current;
      velocityRef.current *= 0.95;

      if (Math.abs(velocityRef.current) > 0.5) {
        momentumIDRef.current = requestAnimationFrame(decay);
      } else {
        scrollContainerRef.current.style.scrollBehavior = "smooth";
        scrollContainerRef.current.style.scrollSnapType = "";
        setTimeout(() => {
          if (scrollContainerRef.current && !isDraggingRef.current) {
            scrollContainerRef.current.style.scrollBehavior = "";
          }
        }, 500);
      }
    };
    momentumIDRef.current = requestAnimationFrame(decay);
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
    endDrag();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (e.pageX - lastXRef.current) * (16 / dt);
    }
    lastXRef.current = e.pageX;
    lastTimeRef.current = now;

    const walk = (x - startXRef.current) * 1.5;
    dragDistanceRef.current = Math.abs(walk);
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragDistanceRef.current > 10) {
      e.preventDefault();
    }
  };

  return (
    <section className="studio-section bg-[#04060b]">
      <div className="container-shell mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="tech-tag mb-2.5">
            <Eye className="h-3 w-3 text-cyan-400" />
            <span>SEC_07 // CURATED VISUAL VIEWPORTS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            前沿视觉与交互艺术画廊
          </h2>
        </div>
        <Link
          href="/experiments"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-cyan-300 hover:text-white transition-colors"
        >
          <span>ALL EXPERIMENTS</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div
        ref={scrollContainerRef}
        onMouseEnter={() => {
          isPausedRef.current = true;
        }}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={endDrag}
        onMouseMove={handleMouseMove}
        onFocus={() => {
          isPausedRef.current = true;
        }}
        onBlur={() => {
          isPausedRef.current = false;
        }}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 pb-4 md:gap-8 lg:px-[max(1rem,calc((100vw-82.5rem)/2))] hide-scrollbar cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item, idx) => (
          <Link
            key={item.slug}
            href={`/experiments/${item.slug}`}
            onClick={handleClick}
            className="experiment-slide arch-frame snap-center shrink-0 w-[85vw] md:w-[540px] lg:w-[680px] group flex flex-col rounded-xl overflow-hidden"
            style={{ userSelect: "none" }}
            draggable={false}
          >
            <div className="hud-header pointer-events-none">
              <span className="text-cyan-300">
                {`VIEWPORT_${String(idx + 1).padStart(2, "0")} // ${item.category}`}
              </span>
              <time dateTime={item.date}>{getYear(item.date)}</time>
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#04060b] border-b border-white/[0.08] pointer-events-none">
              <Image
                src={item.cover}
                alt={item.title}
                fill
                className="object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                sizes="(max-width: 768px) 85vw, (max-width: 1024px) 540px, 680px"
                quality={90}
                draggable={false}
              />
            </div>

            <div className="p-5 flex items-center justify-between gap-4 pointer-events-none">
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.excerpt}</p>
              </div>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
