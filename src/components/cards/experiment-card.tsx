"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ExperimentEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type ExperimentCardProps = {
  item: ExperimentEntry;
};

export function ExperimentCard({ item }: ExperimentCardProps) {
  return (
    <Link
      href={`/experiments/${item.slug}`}
      className="arch-frame group flex h-full flex-col overflow-hidden rounded-xl"
    >
      <div className="hud-header">
        <span className="text-cyan-300">{item.category}</span>
        <span>{formatDate(item.date)}</span>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.08] bg-[#04060b]">
        <Image
          src={item.cover}
          alt={item.title}
          fill
          className="object-cover opacity-85 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04060b] via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 font-mono text-[10px] text-cyan-400 uppercase tracking-wider">
          {item.tools.slice(0, 3).join(" · ")}
        </div>
        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-400">
          {item.excerpt}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/[0.08] mt-4">
          <div className="flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded border border-white/10 bg-[#04060b] px-2 py-0.5 text-[10px] text-slate-300 font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
