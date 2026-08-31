"use client";

import { useEffect, useRef } from "react";
import type { BuildLogEntry } from "@/lib/types";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type LatestBuildLogsProps = {
  items: BuildLogEntry[];
};

export function LatestBuildLogs({ items }: LatestBuildLogsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // 1. 时间轴指示线随滚动延伸
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0, transformOrigin: "top center" },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              end: "bottom 80%",
              scrub: true,
            },
          }
        );
      }

      // 2. Timeline 每一行日志随滚动做阶梯光束划入
      const rows = gsap.utils.toArray<HTMLElement>(".timeline-row");
      rows.forEach((row) => {
        const beacon = row.querySelector(".beacon-dot");
        const content = row.querySelector(".log-content");

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: row,
            start: "top 85%",
            end: "top 60%",
            toggleActions: "play none none reverse",
          },
        });

        tl.fromTo(
          beacon,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }
        ).fromTo(
          content,
          { opacity: 0, x: -30, filter: "blur(6px)" },
          { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.6, ease: "power2.out" },
          "-=0.2"
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section ref={sectionRef} className="relative w-full bg-background pt-32 pb-32 overflow-hidden">
      <div className="container-shell max-w-5xl mx-auto">
        <h2 className="text-[10px] md:text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-24 text-center">
          BUILD LOGS
        </h2>

        <div className="relative flex flex-col gap-12 md:gap-20">
          {/* Progress Line */}
          <div ref={lineRef} className="absolute left-[23.5px] md:left-[39.5px] top-4 bottom-4 w-px bg-gradient-to-b from-brand-violet via-brand-cyan to-transparent will-change-transform"></div>

          {items.map((item) => {
            const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit"
            }).replace('/', '.');

            return (
              <div key={item.slug} className="timeline-row relative flex gap-8 md:gap-16 group">
                
                {/* Year/Month & Pulsing Beacon */}
                <div className="relative z-10 bg-background pt-1 flex items-center justify-center w-12 md:w-20 shrink-0">
                  <div className="beacon-dot absolute -left-[7.5px] md:-left-[7.5px] w-4 h-4 rounded-full border border-brand-violet/50 bg-background flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-violet group-hover:scale-150 transition-transform"></span>
                  </div>
                  <div className="text-xs md:text-sm font-mono tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                    {formattedDate}
                  </div>
                </div>

                {/* Content */}
                <div className="log-content flex-1 pb-12 border-b border-slate-900/5 group-last:border-0 group-last:pb-0">
                  <Link href={`/build-log/${item.slug}`} className="block">
                    <p className="text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase text-brand-violet mb-4 flex items-center gap-2">
                      <span className="inline-block w-2 h-[1px] bg-brand-violet"></span>
                      {item.tags[0] || 'UPDATE'}
                    </p>
                    <h3 className="text-2xl md:text-4xl font-light tracking-tight text-foreground mb-6 group-hover:text-brand-cyan transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed font-light max-w-2xl line-clamp-2">
                      {item.excerpt}
                    </p>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
