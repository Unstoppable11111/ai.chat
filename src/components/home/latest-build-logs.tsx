"use client";

import { useEffect, useRef } from "react";
import type { BuildLogEntry } from "@/lib/types";
import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
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
          { opacity: 0, x: -24 },
          { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" },
          "-=0.2"
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section ref={sectionRef} className="relative w-full py-14 md:py-20 overflow-hidden">
      <div className="container-shell max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-3 py-1 text-xs font-mono font-semibold text-violet-600 mb-3">
              <BookOpenCheck className="h-3.5 w-3.5" />
              <span>RAG KNOWLEDGE BASE // BUILD LOGS</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              最新技术白皮书与构建日志
            </h2>
          </div>
          <Link
            href="/build-log"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-200/90 bg-white/95 px-4 py-2 text-xs md:text-sm font-medium text-slate-700 shadow-2xs hover:border-sky-300 hover:text-sky-600 hover:-translate-y-0.5 transition-all group"
          >
            <span>查看全部白皮书</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="relative flex flex-col gap-8 md:gap-10 pl-6 sm:pl-8 md:pl-0">
          {/* Progress Line */}
          <div ref={lineRef} className="absolute left-2 sm:left-2.5 md:left-[39.5px] top-3 bottom-4 w-px bg-gradient-to-b from-brand-violet via-brand-cyan to-transparent will-change-transform" />

          {items.map((item) => {
            const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit"
            }).replace('/', '.');

            return (
              <div key={item.slug} className="timeline-row relative flex flex-col md:flex-row gap-2 md:gap-16 group">
                
                {/* Pulsing Beacon aligned with line */}
                <div className="beacon-dot absolute -left-4 sm:-left-[22px] md:left-[39.5px] md:-translate-x-1/2 top-1 z-20 w-4 h-4 rounded-full border border-brand-violet/50 bg-background flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-violet group-hover:scale-150 transition-transform" />
                </div>

                {/* Year/Month */}
                <div className="relative z-10 md:w-20 shrink-0 md:pt-0.5">
                  <div className="text-xs md:text-sm font-mono tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                    {formattedDate}
                  </div>
                </div>

                {/* Content */}
                <div className="log-content flex-1 pb-10 border-b border-slate-900/5 group-last:border-0 group-last:pb-0">
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
