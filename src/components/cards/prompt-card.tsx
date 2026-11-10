"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { PromptEntry } from "@/lib/types";
import { CopyButton } from "@/components/ui/copy-button";

type PromptCardProps = {
  item: PromptEntry;
};

export function PromptCard({ item }: PromptCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      id={item.id}
      className="group h-full"
      style={{ scrollMarginTop: "7rem" }}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="glass-panel flex h-full flex-col rounded-[28px] p-5 border border-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_28px_rgba(0,240,255,0.2)] transition-all duration-300">
        <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-[20px] border border-white/10 bg-black/50">
          <Image
            src={item.exampleImage}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-400 font-mono">
          <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-400/30 text-cyan-300">{item.category}</span>
          <span>{item.model}</span>
        </div>

        <h3 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors">{item.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.summary}</p>

        <div className="mt-4 grid gap-3 text-sm">
          <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-mono">适用场景</p>
            <p className="mt-2 leading-relaxed text-slate-200">{item.useCase}</p>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-mono">使用建议</p>
            <p className="mt-2 leading-relaxed text-slate-200">{item.notes}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 font-mono"
            >
              {tag}
            </span>
          ))}
        </div>

        <details className="mt-4 rounded-[20px] border border-white/10 bg-black/40 p-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-cyan-300 hover:text-cyan-200 transition-colors">
            展开完整 Prompt
          </summary>
          <p className="mt-4 whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed text-slate-200 bg-black/60 p-3 rounded-xl border border-white/10">{item.prompt}</p>
        </details>

        <div className="mt-auto pt-4">
          <CopyButton value={item.prompt} />
        </div>
      </div>
    </motion.div>
  );
}
