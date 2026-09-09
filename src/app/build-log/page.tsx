import type { Metadata } from "next";
import { PaginatedBlogList } from "@/components/pages/paginated-blog-list";
import { PageShell } from "@/components/shared/page-shell";
import { SectionHeading } from "@/components/shared/section-heading";
import { listPublishedPosts, postListItem } from "@/lib/posts-repository";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "技术笔记与架构记录", description: "人工智能与全栈工程的原理、实现、验证和边界。", alternates: { canonical: "/build-log" } };
export default async function Page() {
  const items = (await listPublishedPosts("build-log")).map(postListItem);
  return <PageShell><SectionHeading level={1} eyebrow="深度技术" title="技术笔记与架构记录" description="人工智能与全栈工程的原理、实现、验证和边界。" /><PaginatedBlogList items={items} pageSize={6} basePath="/build-log" /></PageShell>;
}
