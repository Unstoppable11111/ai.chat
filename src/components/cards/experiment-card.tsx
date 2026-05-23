"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { ExperimentEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type ExperimentCardProps = {
  item: ExperimentEntry;
};

export function ExperimentCard({ item }: ExperimentCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="group"
    >
      <Link href={`/experiments/${item.slug}`} className="glass-panel block overflow-hidden rounded-[26px]">
        <div className="relative aspect-[1.15/1] overflow-hidden">
          <Image
            src={item.cover}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/14 via-white/1 to-transparent" />
          <div className="absolute left-4 top-4 rounded-full border border-slate-900/8 bg-white/84 px-3 py-1 text-xs text-foreground/80 shadow-sm">
            {item.category}
          </div>
          <div className="absolute inset-x-4 bottom-4 rounded-[20px] border border-white/70 bg-white/82 p-4 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-cyan">学习资料</p>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/80">
              {item.promptPreview}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">查看过程</p>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span>{formatDate(item.date)}</span>
            <span>{item.tools.slice(0, 2).join(" · ")}</span>
          </div>
          <h3 className="text-xl font-semibold">{item.title}</h3>
          <p className="mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground">{item.excerpt}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-900/8 bg-slate-900/[0.03] px-3 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
