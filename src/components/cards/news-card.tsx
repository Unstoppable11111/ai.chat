"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { BuildLogEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { SpotlightCard } from "@/components/ui/spotlight-card";

type NewsCardProps = {
  item: BuildLogEntry;
  variant?: "default" | "feature";
};

export function NewsCard({
  item,
  variant = "default",
}: NewsCardProps) {
  const reduceMotion = useReducedMotion();

  if (variant === "feature") {
    return (
      <motion.div
        className="group"
        whileHover={reduceMotion ? undefined : { y: -6 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <Link
          href={`/news/${item.slug}`}
          className="glass-panel block overflow-hidden rounded-[28px] md:rounded-[32px] border border-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_35px_rgba(0,240,255,0.2)] transition-all duration-300"
        >
          <div className="flex flex-col">
            <div className="relative aspect-[16/10] min-h-[220px] overflow-hidden md:aspect-[18/7] md:min-h-[260px] border-b border-white/10">
              <Image
                src={item.cover}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-transparent to-transparent" />
            </div>

            <div className="flex flex-col gap-7 p-5 md:p-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-5 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-cyan-400 font-mono">
                    <span>{formatDate(item.date)}</span>
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="max-w-[18ch] text-3xl font-semibold leading-[1.12] text-white md:text-4xl group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                    {item.excerpt}
                  </p>
                </div>

                <div className="grid gap-3 xl:min-w-[240px]">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-mono">类型</p>
                    <p className="mt-2 text-sm leading-6 text-cyan-300 font-medium">
                      AI 科技前沿快讯
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-slate-900/80 text-cyan-300 shadow-sm transition duration-300 group-hover:bg-cyan-400 group-hover:border-cyan-300 group-hover:text-slate-950 group-hover:scale-110">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="group h-full"
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <SpotlightCard className="glass-panel block h-full overflow-hidden rounded-[28px] border border-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_28px_rgba(0,240,255,0.22)] transition-all duration-300">
        <Link
          href={`/news/${item.slug}`}
          className="block h-full"
        >
          <div className="flex h-full flex-col">
            <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10">
              <Image
                src={item.cover}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-transparent to-transparent" />
            </div>

            <div className="flex flex-1 flex-col p-5 md:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400 font-mono">
                <span>{formatDate(item.date)}</span>
                {item.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-[10px]">
                    {tag}
                  </span>
                ))}
              </div>

              <h3 className="text-xl md:text-2xl font-semibold leading-[1.2] text-white group-hover:text-cyan-300 transition-colors">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-300 line-clamp-2">{item.excerpt}</p>

              <div className="mt-auto flex items-center justify-end pt-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-900/80 text-cyan-300 shadow-sm transition duration-300 group-hover:border-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950 group-hover:scale-110">
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </SpotlightCard>
    </motion.div>
  );
}
