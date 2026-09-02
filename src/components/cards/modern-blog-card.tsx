"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Clock, Eye, Heart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
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
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="group h-full flex flex-col"
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <Link
        href={`${basePath}/${item.slug}`}
        className="glass-panel flex flex-col h-full overflow-hidden rounded-[24px] border border-slate-900/8 bg-white/75 transition-all duration-300 hover:border-slate-900/18 hover:shadow-lg hover:shadow-slate-900/[0.04]"
      >
        {/* 顶部封面图 */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900/5">
          <Image
            src={item.cover}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />

          {/* 标签悬浮徽章 */}
          {item.tags?.[0] && (
            <div className="absolute top-3.5 left-3.5">
              <span className="rounded-full border border-white/20 bg-slate-950/60 px-3 py-1 text-[11px] font-medium tracking-wide text-white backdrop-blur-md shadow-sm">
                {item.tags[0]}
              </span>
            </div>
          )}
        </div>

        {/* 卡片主体内容 */}
        <div className="flex flex-1 flex-col p-5 md:p-6">
          {/* 日期与阅读时间 */}
          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <span>{formatDate(item.date)}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>5 分钟</span>
            </span>
          </div>

          {/* 标题 */}
          <h3 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-brand-cyan line-clamp-2 md:text-xl">
            {item.title}
          </h3>

          {/* 摘要 */}
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {item.excerpt}
          </p>

          {/* 底部互动指标与进入箭头 */}
          <div className="mt-auto pt-5 flex items-center justify-between border-t border-slate-900/6 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Eye className="h-3.5 w-3.5 text-brand-cyan" />
                <span>800+</span>
              </span>
              <span className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                <span>60+</span>
              </span>
            </div>

            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-900/8 bg-white/80 text-muted-foreground shadow-sm transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white group-hover:scale-110">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
