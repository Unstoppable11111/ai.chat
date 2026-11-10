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
    <section ref={sectionRef} className="relative w-full bg-background pt-24 pb-28 overflow-hidden">
      <div className="container-shell max-w-5xl mx-auto">
        <div className="flex flex-col items-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest mb-3 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            <span>ENGINEERING LOGS // 构建演进轨迹</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white text-center">
            深度架构与工程实践日志
          </h2>
        </div>

        <div className="relative flex flex-col gap-10 md:gap-16 pl-6 sm:pl-8 md:pl-0">
          {/* Progress Line */}
          <div ref={lineRef} className="absolute left-2 sm:left-2.5 md:left-[39.5px] top-3 bottom-4 w-[2px] bg-gradient-to-b from-purple-500 via-cyan-400 to-transparent shadow-[0_0_10px_#00f0ff] will-change-transform" />

          {items.map((item) => {
            const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit"
            }).replace('/', '.');

            return (
              <div key={item.slug} className="timeline-row relative flex flex-col md:flex-row gap-2 md:gap-16 group">
                
                {/* Pulsing Beacon aligned with line */}
                <div className="beacon-dot absolute -left-4 sm:-left-[22px] md:left-[39.5px] md:-translate-x-1/2 top-1 z-20 w-4 h-4 rounded-full border border-cyan-400 bg-[#060a16] shadow-[0_0_10px_#00f0ff] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-150 transition-transform shadow-[0_0_6px_#22d3ee]" />
                </div>

                {/* Year/Month */}
                <div className="relative z-10 md:w-20 shrink-0 md:pt-0.5">
                  <div className="text-xs md:text-sm font-mono tracking-widest text-slate-400 group-hover:text-cyan-300 transition-colors">
                    {formattedDate}
                  </div>
                </div>

                {/* Content */}
                <div className="log-content flex-1 pb-10 border-b border-white/10 group-last:border-0 group-last:pb-0">
                  <Link href={`/build-log/${item.slug}`} className="block">
                    <p className="text-[10px] md:text-xs font-mono font-medium tracking-[0.2em] uppercase text-purple-400 mb-3 flex items-center gap-2">
                      <span className="inline-block w-2 h-[1px] bg-purple-400"></span>
                      {item.tags[0] || 'UPDATE'}
                    </p>
                    <h3 className="text-xl md:text-3xl font-light tracking-tight text-white mb-4 group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm md:text-base text-slate-300 leading-relaxed font-light max-w-2xl line-clamp-2">
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
