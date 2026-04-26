import type { ReactNode } from "react";
import { TableOfContents } from "@/components/mdx/table-of-contents";
import type { TocItem } from "@/lib/types";

type ArticleShellProps = {
  title: string;
  kicker: string;
  description: string;
  meta: string[];
  tags: string[];
  toc: TocItem[];
  children: ReactNode;
};

export function ArticleShell({
  title,
  kicker,
  description,
  meta,
  tags,
  toc,
  children,
}: ArticleShellProps) {
  return (
    <div className="container-shell page-flow pb-20">
      <div className="mb-10 max-w-4xl">
        <p className="mb-4 text-xs uppercase tracking-[0.24em] text-brand-cyan">
          {kicker}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-900/8 bg-white/70 px-3 py-1 text-xs text-muted-foreground shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="glass-panel rounded-[32px] p-6 md:p-10">
          <div className="prose-studio max-w-none">{children}</div>
        </article>
        <div className="hidden lg:block">
          <TableOfContents items={toc} />
        </div>
      </div>
    </div>
  );
}
