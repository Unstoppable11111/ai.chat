"use client";

import { useRef } from "react";
import type { BuildLogEntry } from "@/lib/types";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { HoverPrefetchLink } from "@/components/shared/hover-prefetch-link";

type LatestBuildLogsProps = {
  items: BuildLogEntry[];
};

export function LatestBuildLogs({ items }: LatestBuildLogsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 75%", "end 85%"],
  });
  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

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
          <HoverPrefetchLink
            href="/build-log"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-200/90 bg-white/95 px-4 py-2 text-xs md:text-sm font-medium text-slate-700 shadow-2xs hover:border-sky-300 hover:text-sky-600 hover:-translate-y-0.5 transition-all group"
          >
            <span>查看全部白皮书</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </HoverPrefetchLink>
        </div>

        <div className="relative flex flex-col gap-8 md:gap-10 pl-6 sm:pl-8 md:pl-0">
          {/* Progress Line */}
          <motion.div
            style={{ scaleY: reduceMotion ? 1 : lineScaleY, transformOrigin: "top center" }}
            className="absolute left-2 sm:left-2.5 md:left-[39.5px] top-3 bottom-4 w-px bg-gradient-to-b from-brand-violet via-brand-cyan to-transparent will-change-transform"
          />

          {items.map((item) => {
            const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit"
            }).replace('/', '.');

            return (
              <div key={item.slug} className="timeline-row relative flex flex-col md:flex-row gap-2 md:gap-16 group">
                
                {/* Pulsing Beacon aligned with line */}
                <motion.div
                  initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                  whileInView={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                  className="beacon-dot absolute -left-4 sm:-left-[22px] md:left-[39.5px] md:-translate-x-1/2 top-1 z-20 w-4 h-4 rounded-full border border-brand-violet/50 bg-background flex items-center justify-center"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-violet group-hover:scale-150 transition-transform" />
                </motion.div>

                {/* Year/Month */}
                <div className="relative z-10 md:w-20 shrink-0 md:pt-0.5">
                  <div className="text-xs md:text-sm font-mono tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                    {formattedDate}
                  </div>
                </div>

                {/* Content */}
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, x: -24 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="log-content flex-1 pb-10 border-b border-slate-900/5 group-last:border-0 group-last:pb-0"
                >
                  <HoverPrefetchLink href={`/build-log/${item.slug}`} className="block">
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
                  </HoverPrefetchLink>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
