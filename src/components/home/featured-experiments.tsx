"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ExperimentEntry } from "@/lib/types";

type FeaturedExperimentsProps = {
  items: ExperimentEntry[];
};

export function FeaturedExperiments({ items }: FeaturedExperimentsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  
  // Drag to scroll refs
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
    
    // Disable scroll snap during drag for smoother experience
    scrollContainerRef.current.style.scrollSnapType = 'none';
    scrollContainerRef.current.style.scrollBehavior = 'auto';
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const decay = () => {
      if (!scrollContainerRef.current) return;
      scrollContainerRef.current.scrollLeft -= velocityRef.current;
      velocityRef.current *= 0.95; // Friction multiplier
      
      if (Math.abs(velocityRef.current) > 0.5) {
        momentumIDRef.current = requestAnimationFrame(decay);
      } else {
        // Snap back into place smoothly
        scrollContainerRef.current.style.scrollBehavior = 'smooth';
        scrollContainerRef.current.style.scrollSnapType = '';
        setTimeout(() => {
          if (scrollContainerRef.current && !isDraggingRef.current) {
            scrollContainerRef.current.style.scrollBehavior = '';
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

  const handleMouseUp = () => {
    endDrag();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (e.pageX - lastXRef.current) * (16 / dt); // Normalize to 60fps
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
    <section ref={sectionRef} className="relative w-full bg-[#0A0A0A] text-white pt-32 pb-32">
      <div ref={containerRef} className="w-full py-8">
        
        <div className="container-shell w-full max-w-7xl mx-auto mb-16 shrink-0 z-10 px-6">
          <h2 className="text-[10px] md:text-xs font-medium tracking-[0.3em] uppercase text-white/50">
            FEATURED<br />EXPERIMENTS
          </h2>
        </div>

        {/* Gallery Container */}
        <div 
          ref={scrollContainerRef}
          onMouseEnter={() => { isPausedRef.current = true; }}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onFocus={() => { isPausedRef.current = true; }}
          onBlur={() => { isPausedRef.current = false; }}
          className="flex gap-8 overflow-x-auto snap-x snap-mandatory px-6 pb-6 md:gap-12 lg:gap-16 lg:px-[max(1rem,calc((100vw-80rem)/2))] hide-scrollbar cursor-grab active:cursor-grabbing"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {items.map((item) => (
            <Link 
              key={item.slug} 
              href={`/experiments/${item.slug}`}
              onClick={handleClick}
              className="experiment-slide snap-center shrink-0 w-[85vw] md:w-[600px] lg:w-[800px] group flex flex-col gap-6"
              style={{ userSelect: 'none' }}
              draggable={false}
            >
              {/* Artwork */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#111] pointer-events-none">
                <Image
                  src={item.cover}
                  alt={item.title}
                  fill
                  className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  sizes="(max-width: 768px) 85vw, (max-width: 1024px) 600px, 800px"
                  quality={90}
                  draggable={false}
                />
              </div>

              {/* Minimal Text */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pointer-events-none">
                <h3 className="text-2xl md:text-4xl font-light tracking-tight text-white group-hover:text-brand-cyan transition-colors">
                  {item.title}
                </h3>
                <div className="flex gap-4 text-xs font-mono tracking-widest text-white/40 uppercase">
                  <span>{item.category}</span>
                  <time dateTime={item.date}>{getYear(item.date)}</time>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
