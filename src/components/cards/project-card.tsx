import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { ProjectEntry } from "@/lib/types";
import { SpotlightCard } from "@/components/ui/spotlight-card";

type ProjectCardProps = {
  item: ProjectEntry;
  eager?: boolean;
};

export function ProjectCard({ item, eager = false }: ProjectCardProps) {
  return (
    <SpotlightCard className="glass-panel group block h-full overflow-hidden rounded-[30px] border border-slate-900/10 shadow-[0_10px_30px_rgba(15,23,42,0.03)] hover:shadow-xl hover:shadow-brand-cyan/5 transition-all duration-500 hover:-translate-y-1.5">
      <Link href={`/projects/${item.slug}`} className="flex h-full flex-col">
        {/* 封面图片区与动态发光 */}
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <Image
            src={item.cover}
            alt={item.title}
            fill
            loading={eager ? "eager" : "lazy"}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          
          {/* 左上角分类徽章 */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/60 text-slate-900 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3 h-3 text-brand-cyan" />
            <span>{item.type}</span>
          </div>

          {/* 右上角年份标签 */}
          <div className="absolute top-4 right-4 font-mono text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white/90 border border-white/20">
            {item.year}
          </div>
        </div>

        {/* 下部内容 */}
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-brand-cyan transition-colors">
              {item.title}
            </h3>
            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-900/10 bg-white/80 text-muted-foreground shadow-xs group-hover:border-brand-cyan/40 group-hover:bg-brand-cyan group-hover:text-white transition-all duration-300">
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-3 mb-6">
            {item.description}
          </p>

          {/* 技术栈标签 */}
          <div className="mt-auto pt-4 border-t border-slate-900/5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {item.stack.slice(0, 4).map((tool) => (
                <span
                  key={tool}
                  className="rounded-lg border border-slate-900/8 bg-slate-900/[0.03] px-2.5 py-1 text-[11px] font-mono text-muted-foreground font-medium group-hover:border-brand-cyan/20 group-hover:text-foreground transition-colors"
                >
                  {tool}
                </span>
              ))}
            </div>
            <span className="text-[11px] font-mono text-brand-cyan font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              VIEW ARCHITECTURE →
            </span>
          </div>
        </div>
      </Link>
    </SpotlightCard>
  );
}
