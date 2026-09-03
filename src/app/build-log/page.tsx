import type { Metadata } from "next";
import { PaginatedBlogList } from "@/components/pages/paginated-blog-list";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { getBuildLogs, calculateReadingMinutes } from "@/lib/content";
import { executeQuery } from "@/lib/db";
import type { BuildLogEntry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "技术白皮书与架构沉淀",
  description: "系统性梳理人工智能、大模型推理架构、Agent 协议与前沿工程落地白皮书。",
  alternates: { canonical: "/build-log" },
};

export default async function BuildLogPage() {
  let items: BuildLogEntry[] = [];

  // 100% 优先直接从 MySQL 数据库拉取全量文章（数据库驱动，本地 MDX 仅为脱机备份）
  try {
    const dbPosts = await executeQuery<{
      id: number;
      slug: string;
      title: string;
      excerpt: string;
      content: string;
      cover: string;
      tags: string;
      views: number;
      likes: number;
      created_at: string;
    }>(
      "SELECT id, slug, title, excerpt, content, cover, tags, views, likes, created_at FROM posts WHERE collection = 'build-log' OR collection IS NULL ORDER BY id ASC"
    );

    if (dbPosts && dbPosts.length > 0) {
      items = dbPosts.map((p) => {
        let parsedTags: string[] = [];
        try {
          parsedTags = typeof p.tags === "string" ? JSON.parse(p.tags) : (Array.isArray(p.tags) ? p.tags : []);
        } catch {
          parsedTags = [];
        }

        return {
          id: p.id,
          slug: p.slug,
          title: p.title || p.slug,
          excerpt: p.excerpt || "",
          date: p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : "2026-08-28",
          tags: parsedTags,
          cover: p.cover || "/images/placeholders/neural-pattern.svg",
          views: p.views ?? 0,
          likes: p.likes ?? 0,
          readingMinutes: calculateReadingMinutes(p.content || "", 14),
        };
      });
    }
  } catch (error) {
    console.error("[BuildLogPage DB Fetch Error]:", error);
  }

  // 离线/未连接数据库时的安全备份降级
  if (items.length === 0) {
    items = getBuildLogs();
  }

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          level={1}
          eyebrow="WHITEPAPERS // 深度技术"
          title="技术白皮书与架构沉淀"
          description="系统性梳理 2024~2026 年大模型推理演进、Agent 协议、RAG 混合检索与端侧工程实战万字深度白皮书。"
        />

        <PaginatedBlogList items={items} pageSize={6} basePath="/build-log" />
      </PageIntro>
    </PageShell>
  );
}
