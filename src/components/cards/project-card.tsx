import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { ProjectEntry } from "@/lib/types";

type ProjectCardProps = {
  item: ProjectEntry;
};

export function ProjectCard({ item }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${item.slug}`}
      className="glass-panel group block h-full overflow-hidden rounded-[28px] hover:-translate-y-1"
    >
      <div className="flex h-full flex-col">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={item.cover}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/12 via-white/1 to-transparent" />
        </div>

        <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span>{item.type}</span>
          <span>{item.year}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {item.description}
            </p>
          </div>
          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-900/8 bg-white/74 text-muted-foreground shadow-sm group-hover:border-brand-cyan/22 group-hover:text-foreground">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {item.stack.slice(0, 4).map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-slate-900/8 bg-slate-900/[0.03] px-3 py-1 text-xs text-muted-foreground"
            >
              {tool}
            </span>
          ))}
        </div>
        </div>
      </div>
    </Link>
  );
}
