"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Clock, Eye, Heart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { BuildLogEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { SpotlightCard } from "@/components/ui/spotlight-card";

interface ModernBlogCardProps {
  item: BuildLogEntry;
  basePath?: string;
}

export function ModernBlogCard({
  item,
  basePath = "/build-log",
}: ModernBlogCardProps) {
  const reduceMotion = useReducedMotion();

  const viewsCount = item.views ?? 0;
  const likesCount = item.likes ?? 0;
  const minutes = item.readingMinutes ?? 5;

  return (
    <motion.div
      className="group h-full flex flex-col"
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <SpotlightCard className="glass-panel flex flex-col h-full overflow-hidden rounded-[24px] border border-white/10 bg-[#0d162b]/85 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_28px_rgba(0,240,255,0.22)]">
        <Link
          href={`${basePath}/${item.slug}`}
          className="flex flex-col h-full"
        >
          {/* 顶部封面图 */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950 border-b border-white/10">
            <Image
              src={item.cover}
              alt={item.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d162b] via-transparent to-transparent pointer-events-none" />

            {/* 标签悬浮徽章 */}
            {item.tags?.[0] && (
              <div className="absolute top-3.5 left-3.5 z-10">
                <span className="rounded-full border border-cyan-400/40 bg-slate-950/80 px-3 py-1 text-[11px] font-medium tracking-wide text-cyan-300 backdrop-blur-md shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                  {item.tags[0]}
                </span>
              </div>
            )}
          </div>

          {/* 卡片主体内容 */}
          <div className="flex flex-1 flex-col p-5 md:p-6">
            {/* 日期与真实阅读时间 */}
            <div className="mb-3 flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span>{formatDate(item.date)}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 text-cyan-400" />
                <span>{minutes} 分钟</span>
              </span>
            </div>

            {/* 标题 */}
            <h3 className="text-lg font-semibold leading-snug text-white transition-colors group-hover:text-cyan-300 line-clamp-2 md:text-xl">
              {item.title}
            </h3>

            {/* 摘要 */}
            <p className="mt-3 text-sm leading-relaxed text-slate-300 line-clamp-3">
              {item.excerpt}
            </p>

            {/* 底部动态真实互动指标 */}
            <div className="mt-auto pt-5 flex items-center justify-between border-t border-white/10 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                  <Eye className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{viewsCount} 阅读</span>
                </span>
                <span className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                  <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-500/20" />
                  <span>{likesCount} 赞</span>
                </span>
              </div>

              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-slate-900/80 text-cyan-300 shadow-sm transition-all duration-300 group-hover:bg-cyan-400 group-hover:border-cyan-300 group-hover:text-slate-950 group-hover:scale-110">
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </Link>
      </SpotlightCard>
    </motion.div>
  );
}
