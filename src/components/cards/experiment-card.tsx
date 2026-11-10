"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { ExperimentEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { SpotlightCard } from "@/components/ui/spotlight-card";

type ExperimentCardProps = {
  item: ExperimentEntry;
};

export function ExperimentCard({ item }: ExperimentCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="group h-full"
    >
      <SpotlightCard className="glass-panel block h-full overflow-hidden rounded-[26px] border border-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_28px_rgba(0,240,255,0.22)] transition-all duration-300">
        <Link href={`/experiments/${item.slug}`} className="block h-full">
          <div className="relative aspect-[1.15/1] overflow-hidden border-b border-white/10">
            <Image
              src={item.cover}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060a16] via-transparent to-transparent" />
            
            <div className="absolute left-4 top-4 rounded-full border border-cyan-400/40 bg-slate-950/80 px-3 py-1 text-xs text-cyan-300 font-mono shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              {item.category}
            </div>

            <div className="absolute inset-x-4 bottom-4 rounded-[20px] border border-white/15 bg-[#0b1222]/90 p-4 opacity-0 backdrop-blur-xl transition-opacity duration-300 group-hover:opacity-100 shadow-2xl">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-400 font-mono font-semibold">学习资料</p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-200">
                {item.promptPreview}
              </p>
              <p className="mt-3 text-xs text-cyan-300 font-medium">查看实验过程 →</p>
            </div>
          </div>

          <div className="p-5">
            <div className="mb-3 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-slate-400 font-mono">
              <span>{formatDate(item.date)}</span>
              <span className="text-cyan-300">{item.tools.slice(0, 2).join(" · ")}</span>
            </div>
            <h3 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors">{item.title}</h3>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-300">{item.excerpt}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>
      </SpotlightCard>
    </motion.div>
  );
}
