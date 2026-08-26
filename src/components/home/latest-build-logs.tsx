"use client";

import { useRef } from "react";
import type { BuildLogEntry } from "@/lib/types";
import Link from "next/link";

type LatestBuildLogsProps = {
  items: BuildLogEntry[];
};

export function LatestBuildLogs({ items }: LatestBuildLogsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative w-full bg-background pt-32 pb-32">
      <div className="container-shell max-w-5xl mx-auto">
        <h2 className="text-[10px] md:text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-24 text-center">
          BUILD LOGS
        </h2>

        <div ref={containerRef} className="relative flex flex-col gap-12 md:gap-20">
          {/* Progress Line */}
          <div className="absolute left-[23.5px] md:left-[39.5px] top-4 bottom-4 w-px bg-slate-900/10"></div>

          {items.map((item) => {
            const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit"
            }).replace('/', '.');

            return (
              <div key={item.slug} className="timeline-row relative flex gap-8 md:gap-16 group">
                
                {/* Year/Month */}
                <div className="relative z-10 bg-background pt-1 flex items-center justify-center w-12 md:w-20 shrink-0">
                  <div className="text-xs md:text-sm font-mono tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                    {formattedDate}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-12 border-b border-slate-900/5 group-last:border-0 group-last:pb-0">
                  <Link href={`/build-log/${item.slug}`} className="block">
                    <p className="text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase text-brand-violet mb-4">
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
