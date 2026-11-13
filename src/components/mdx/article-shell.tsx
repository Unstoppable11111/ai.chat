import type { ReactNode } from "react";
import { TableOfContents } from "@/components/mdx/table-of-contents";
import { PostInteractions } from "@/components/posts/post-interactions";
import type { TocItem } from "@/lib/types";

type ArticleShellProps = {
  postId?: number;
  slug?: string;
  initialViews?: number;
  initialLikes?: number;
  title: string;
  kicker: string;
  description: string;
  meta: string[];
  tags: string[];
  toc: TocItem[];
  children: ReactNode;
};

export function ArticleShell({
  postId,
  slug,
  initialViews,
  initialLikes,
  title,
  kicker,
  description,
  meta,
  tags,
  toc,
  children,
}: ArticleShellProps) {
  return (
    <div className="container-shell page-flow pb-24 pt-4">
      <div className="mb-10 border-b border-white/10 pb-8 max-w-4xl">
        <div className="tech-tag mb-4">
          <span>[ {kicker} ]</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl leading-[1.1]">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
          {description}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
          {meta.map((item) => (
            <span
              key={item}
              className="rounded border border-white/10 bg-[#080c16] px-2.5 py-1"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-cyan-500/30 bg-cyan-950/35 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="arch-frame rounded-xl overflow-hidden">
          <div className="hud-header">
            <span className="text-cyan-300">DOCUMENT VIEWPORT // RAG READY</span>
            <span>MARKDOWN STREAM</span>
          </div>

          <div className="p-6 md:p-10">
            <div className="prose-studio max-w-none">{children}</div>

            {slug && (
              <div className="mt-14 pt-8 border-t border-white/10">
                <div className="mb-4">
                  <p className="text-sm font-bold text-white">感谢阅读本文</p>
                  <p className="text-xs text-slate-400 mt-1">
                    如果本文的工程细节对你有帮助，欢迎点赞支持或分享链接。
                  </p>
                </div>
                <PostInteractions
                  postId={postId}
                  slug={slug}
                  title={title}
                  initialViews={initialViews}
                  initialLikes={initialLikes}
                />
              </div>
            )}
          </div>
        </article>

        <div className="hidden lg:block">
          <TableOfContents items={toc} />
        </div>
      </div>
    </div>
  );
}
