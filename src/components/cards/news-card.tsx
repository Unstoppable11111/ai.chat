"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { BuildLogEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type NewsCardProps = {
  item: BuildLogEntry;
  variant?: "default" | "feature";
};

export function NewsCard({ item, variant = "default" }: NewsCardProps) {
  if (variant === "feature") {
    return (
      <Link
        href={`/news/${item.slug}`}
        className="arch-frame group block overflow-hidden rounded-xl"
      >
        <div className="hud-header">
          <span className="text-cyan-300">NEWS // FEATURE DISPATCH</span>
          <span>{formatDate(item.date)}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto lg:min-h-[300px] overflow-hidden border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#04060b]">
            <Image
              src={item.cover}
              alt={item.title}
              fill
              className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between p-6 md:p-8">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded border border-cyan-500/35 bg-cyan-950/40 text-cyan-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h3 className="text-2xl md:text-3xl font-bold leading-tight text-white group-hover:text-cyan-300 transition-colors">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{item.excerpt}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between font-mono text-xs text-cyan-300">
              <span>READ FULL BRIEFING</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/news/${item.slug}`}
      className="arch-frame group flex h-full flex-col overflow-hidden rounded-xl"
    >
      <div className="hud-header">
        <span className="text-cyan-300 truncate">{item.tags[0] || "TECH NEWS"}</span>
        <span className="shrink-0">{formatDate(item.date)}</span>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/[0.08] bg-[#04060b]">
        <Image
          src={item.cover}
          alt={item.title}
          fill
          className="object-cover opacity-85 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
          {item.title}
        </h3>
        <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-400 line-clamp-2">
          {item.excerpt}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/[0.08] mt-4">
          <div className="flex gap-1.5">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded border border-white/10 bg-[#04060b] text-slate-400 font-mono text-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
