"use client";

import Image from "next/image";
import type { PromptEntry } from "@/lib/types";
import { CopyButton } from "@/components/ui/copy-button";

type PromptCardProps = {
  item: PromptEntry;
};

export function PromptCard({ item }: PromptCardProps) {
  return (
    <div
      id={item.id}
      style={{ scrollMarginTop: "7rem" }}
      className="arch-frame group flex h-full flex-col rounded-xl overflow-hidden"
    >
      <div className="hud-header">
        <span className="text-cyan-300">{item.category}</span>
        <span>{item.model}</span>
      </div>

      <div className="p-5 flex flex-1 flex-col">
        <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-lg border border-white/10 bg-[#04060b]">
          <Image
            src={item.exampleImage}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
          {item.title}
        </h3>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-400">{item.summary}</p>

        <div className="mt-4 grid gap-2.5 text-xs">
          <div className="rounded-lg border border-white/[0.08] bg-[#04060b]/80 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">USE CASE</p>
            <p className="mt-1 leading-relaxed text-slate-300">{item.useCase}</p>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-[#04060b]/80 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">NOTES</p>
            <p className="mt-1 leading-relaxed text-slate-300">{item.notes}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-300 font-mono"
            >
              {tag}
            </span>
          ))}
        </div>

        <details className="mt-4 rounded-lg border border-white/10 bg-[#04060b] p-3">
          <summary className="cursor-pointer list-none font-mono text-xs font-medium text-cyan-300 hover:text-cyan-200 transition-colors">
            VIEW SYSTEM PROMPT PAYLOAD →
          </summary>
          <p className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-200 border-t border-white/10 pt-3">
            {item.prompt}
          </p>
        </details>

        <div className="mt-auto pt-4">
          <CopyButton value={item.prompt} />
        </div>
      </div>
    </div>
  );
}
