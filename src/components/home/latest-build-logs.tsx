"use client";

import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import type { BuildLogEntry } from "@/lib/types";
import { Reveal } from "@/components/shared/reveal";

type LatestBuildLogsProps = {
  items: BuildLogEntry[];
};

export function LatestBuildLogs({ items }: LatestBuildLogsProps) {
  return (
    <section className="studio-section bg-[#04060b]">
      <div className="container-shell">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-white/10 pb-5">
          <div>
            <div className="tech-tag mb-2.5">
              <FileText className="h-3 w-3 text-cyan-400" />
              <span>SEC_08 // ENGINEERING LOG INDEX</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              深度架构与工程实践日志
            </h2>
          </div>

          <Link
            href="/build-log"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3.5 py-2 font-mono text-xs text-cyan-300 hover:border-cyan-400/50 transition-colors"
          >
            <span>VIEW FULL ARCHIVE</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Reveal>

        {/* Swiss Architectural Index Ledger */}
        <div className="arch-frame rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 border-b border-white/10 bg-[#04060b]/80 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            <span className="col-span-2">INDEX // DATE</span>
            <span className="col-span-2">DOMAIN TAG</span>
            <span className="col-span-7">TITLE & ARCHITECTURAL ABSTRACT</span>
            <span className="col-span-1 text-right">LINK</span>
          </div>

          <div className="divide-y divide-white/[0.08]">
            {items.map((item, idx) => {
              const formattedDate = new Date(item.date)
                .toLocaleDateString("en-CA");
              return (
                <Link
                  key={item.slug}
                  href={`/build-log/${item.slug}`}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center px-5 py-5 hover:bg-cyan-500/[0.05] transition-colors"
                >
                  <div className="md:col-span-2 flex items-center gap-3 font-mono text-xs">
                    <span className="text-cyan-400 font-bold">
                      LOG_{String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-slate-500">{formattedDate}</span>
                  </div>

                  <div className="md:col-span-2">
                    <span className="inline-block rounded border border-purple-500/35 bg-purple-950/35 px-2 py-0.5 font-mono text-[10px] uppercase text-purple-300">
                      {item.tags[0] || "SYSTEM"}
                    </span>
                  </div>

                  <div className="md:col-span-7 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-1 mt-1">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 group-hover:border-cyan-400/50 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
