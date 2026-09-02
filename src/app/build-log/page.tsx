import type { Metadata } from "next";
import { PaginatedBlogList } from "@/components/pages/paginated-blog-list";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { getBuildLogs } from "@/lib/content";

export const metadata: Metadata = {
  title: "技术博客与前沿探索",
  description: "记录人工智能、大语言模型推理架构、Agent 协议与全栈工程落地沉淀。",
  alternates: { canonical: "/build-log" },
};

export default function BuildLogPage() {
  const items = getBuildLogs();

  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          level={1}
          eyebrow="技术专栏"
          title="AI 发展与架构沉淀"
          description="系统性梳理 2024~2026 年大模型推理演进、Agent 协议、RAG 混合检索与端侧工程实战。"
        />

        <PaginatedBlogList items={items} pageSize={6} basePath="/build-log" />
      </PageIntro>
    </PageShell>
  );
}
