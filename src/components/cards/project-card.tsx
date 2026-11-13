import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { ProjectEntry } from "@/lib/types";

type ProjectCardProps = {
  item: ProjectEntry;
  eager?: boolean;
};

export function ProjectCard({ item, eager = false }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${item.slug}`}
      className="arch-frame group flex h-full flex-col overflow-hidden rounded-xl"
    >
      <div className="hud-header">
        <span className="text-cyan-300">PRJ // {item.type}</span>
        <span>{item.year}</span>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden bg-[#04060b] border-b border-white/[0.08]">
        <Image
          src={item.cover}
          alt={item.title}
          fill
          loading={eager ? "eager" : "lazy"}
          className="object-cover opacity-85 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04060b]/80 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-2.5">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
            {item.title}
          </h3>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-cyan-300 group-hover:border-cyan-400 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed text-slate-400 line-clamp-3 mb-5">
          {item.description}
        </p>

        <div className="mt-auto pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {item.stack.slice(0, 4).map((tool) => (
              <span
                key={tool}
                className="rounded border border-white/10 bg-[#04060b] px-2 py-0.5 text-[10px] font-mono text-slate-300 group-hover:border-cyan-400/30 group-hover:text-cyan-300 transition-colors"
              >
                {tool}
              </span>
            ))}
          </div>
          <span className="font-mono text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
            ARCHITECTURE →
          </span>
        </div>
      </div>
    </Link>
  );
}
