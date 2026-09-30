import type { Metadata } from "next";
import { PaginatedBlogList } from "@/components/pages/paginated-blog-list";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { listPublishedPosts, postListItem } from "@/lib/posts-repository";
import { Database, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "技术笔记与架构记录",
  description: "人工智能与全栈工程的原理、实现、验证和边界。",
  alternates: { canonical: "/build-log" },
};

export default async function Page() {
  const items = (await listPublishedPosts("build-log")).map(postListItem);

  return (
    <PageShell>
      {/* 顶部 RAG 知识库全景雷达面板 */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-mono font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan" />
            </span>
            <span>RAG KNOWLEDGE BASE // VECTOR READY</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-muted-foreground border border-slate-900/10 rounded-full px-3.5 py-1 bg-white/60 backdrop-blur-xs">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <Database className="h-3.5 w-3.5 text-brand-cyan" />
              <span>WHITEPAPERS: {items.length} 篇</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>CHUNKING READY: 100%</span>
            </span>
          </div>
        </div>

        <SectionHeading
          level={1}
          eyebrow="深度技术白皮书 · DEEP ENGINEERING"
          title="技术笔记与架构记录"
          description="人工智能工程化与全栈系统的高精度原理推导、代码实现、边界验证与 RAG 知识库沉淀。"
        />
      </div>

      <PaginatedBlogList items={items} pageSize={6} basePath="/build-log" />
    </PageShell>
  );
}
