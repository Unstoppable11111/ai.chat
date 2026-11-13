"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Clock, Eye, Heart } from "lucide-react";
import type { BuildLogEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ModernBlogCardProps {
  item: BuildLogEntry;
  basePath?: string;
}

export function ModernBlogCard({
  item,
  basePath = "/build-log",
}: ModernBlogCardProps) {
  const viewsCount = item.views ?? 0;
  const likesCount = item.likes ?? 0;
  const minutes = item.readingMinutes ?? 5;

  return (
    <Link
      href={`${basePath}/${item.slug}`}
      className="arch-frame group flex flex-col h-full overflow-hidden rounded-xl"
    >
      <div className="hud-header">
        <span className="text-cyan-300 truncate">{item.tags?.[0] || "ENGINEERING"}</span>
        <span className="shrink-0">{formatDate(item.date)}</span>
      </div>

      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#04060b] border-b border-white/[0.08]">
        <Image
          src={item.cover}
          alt={item.title}
          fill
          unoptimized
          className="object-cover opacity-85 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04060b]/70 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span>{minutes} MIN READ</span>
          </span>
          <span className="text-white/15">|</span>
          <span className="text-emerald-400">RAG READY</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold leading-snug text-white transition-colors group-hover:text-cyan-300 line-clamp-2">
          {item.title}
        </h3>

        <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-400 line-clamp-3">
          {item.excerpt}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/[0.08] text-[11px] text-slate-400 font-mono mt-4">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-cyan-400" />
              <span>{viewsCount}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              <span>{likesCount}</span>
            </span>
          </div>

          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-cyan-300 group-hover:bg-cyan-400 group-hover:border-cyan-400 group-hover:text-slate-950 transition-all">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
