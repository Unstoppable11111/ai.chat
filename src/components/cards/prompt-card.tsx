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
      className="group h-full"
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
    <div className="glass-panel flex h-full flex-col rounded-[28px] p-5">
      <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-[20px] border border-slate-900/8">
        <Image
          src={item.exampleImage}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>{item.category}</span>
        <span>{item.model}</span>
      </div>

      <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.summary}</p>

      <div className="mt-4 grid gap-3 text-sm">
        <div className="rounded-[18px] border border-slate-900/8 bg-slate-900/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">适用场景</p>
          <p className="mt-2 leading-7 text-foreground/84">{item.useCase}</p>
        </div>
        <div className="rounded-[18px] border border-slate-900/8 bg-slate-900/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">使用建议</p>
          <p className="mt-2 leading-7 text-foreground/84">{item.notes}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-900/8 bg-slate-900/[0.03] px-3 py-1 text-xs text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <details className="mt-4 rounded-[20px] border border-slate-900/8 bg-white/50 p-4">
        <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
          展开完整 Prompt
        </summary>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground/80">{item.prompt}</p>
      </details>

      <div className="mt-auto pt-4">
        <CopyButton value={item.prompt} />
      </div>
    </div>
    </motion.div>
  );
}
