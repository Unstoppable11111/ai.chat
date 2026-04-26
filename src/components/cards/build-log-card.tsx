import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { BuildLogEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type BuildLogCardProps = {
  item: BuildLogEntry;
  variant?: "default" | "feature";
};

export function BuildLogCard({
  item,
  variant = "default",
}: BuildLogCardProps) {
  if (variant === "feature") {
    return (
      <Link
        href={`/build-log/${item.slug}`}
        className="glass-panel group block overflow-hidden rounded-[32px] hover:-translate-y-1"
      >
        <div className="flex flex-col">
          <div className="relative aspect-[18/7] min-h-[260px] overflow-hidden">
            <Image
              src={item.cover}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/22 via-slate-950/5 to-transparent" />
          </div>

          <div className="flex flex-col gap-7 p-7 md:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <span>{formatDate(item.date)}</span>
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <h3 className="max-w-[18ch] text-4xl font-semibold leading-[1.08] text-foreground">
                  {item.title}
                </h3>
                <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                  {item.excerpt}
                </p>
              </div>

              <div className="grid gap-3 xl:min-w-[240px]">
                <div className="rounded-[22px] border border-slate-900/8 bg-slate-900/[0.03] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">定位</p>
                  <p className="mt-2 text-sm leading-6 text-foreground/82">
                    从页面壳子开始，先把工作室结构搭稳。
                  </p>
                </div>
                <div className="rounded-[22px] border border-slate-900/8 bg-slate-900/[0.03] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">状态</p>
                  <p className="mt-2 text-sm leading-6 text-foreground/82">已归档，可继续扩展。</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-900/8 bg-white/78 text-muted-foreground shadow-sm group-hover:border-brand-cyan/22 group-hover:text-foreground">
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/build-log/${item.slug}`}
      className="glass-panel group block h-full overflow-hidden rounded-[28px] hover:-translate-y-1"
    >
      <div className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={item.cover}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-transparent" />
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span>{formatDate(item.date)}</span>
            {item.tags.slice(0, 2).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <h3 className="text-2xl font-semibold leading-[1.2] text-foreground">
            {item.title}
          </h3>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.excerpt}</p>

          <div className="mt-auto flex items-center justify-end pt-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/8 bg-white/74 text-muted-foreground shadow-sm group-hover:border-brand-cyan/22 group-hover:text-foreground">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
