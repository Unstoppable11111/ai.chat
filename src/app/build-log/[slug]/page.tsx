import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { ArticleShell } from "@/components/mdx/article-shell";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { getBuildLogBySlug, getBuildLogs, getTableOfContents, calculateReadingMinutes } from "@/lib/content";
import { formatDate, getReadingTimeText } from "@/lib/utils";
import { executeQuery } from "@/lib/db";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// 开启实时动态服务端渲染，确保刷新页面时直接读取云端 MySQL 最新的 views 与 likes，杜绝 SSG 缓存导致数量不同步
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getBuildLogBySlug(slug);

  if (!entry) {
    return {};
  }

  const title = entry.frontmatter.title as string;
  const description = entry.frontmatter.excerpt as string;
  const cover = entry.frontmatter.cover as string | undefined;

  return {
    title,
    description,
    alternates: { canonical: `/build-log/${slug}` },
    openGraph: {
      url: `/build-log/${slug}`,
      title,
      description,
      type: "article",
      publishedTime: entry.frontmatter.date as string | undefined,
      images: cover ? [{ url: cover }] : undefined,
    },
  };
}

export default async function BuildLogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const localBackup = getBuildLogBySlug(slug);

  // 默认使用本地备份数据进行占位初始化
  let post = {
    id: undefined as number | undefined,
    slug,
    title: localBackup?.frontmatter?.title ? String(localBackup.frontmatter.title) : slug,
    description: localBackup?.frontmatter?.excerpt ? String(localBackup.frontmatter.excerpt) : "",
    content: localBackup?.content || "",
    tags: (localBackup?.frontmatter?.tags as string[]) || [],
    date: localBackup?.frontmatter?.date ? String(localBackup.frontmatter.date) : "2026-08-28",
    views: localBackup?.frontmatter?.views ? Number(localBackup.frontmatter.views) : 0,
    likes: localBackup?.frontmatter?.likes ? Number(localBackup.frontmatter.likes) : 0,
  };

  // 100% 优先直接从 MySQL 数据库拉取正文、标题、摘要与统计（一切以数据库为准，MDX 仅为脱机备份）
  try {
    const rows = await executeQuery<{
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
      "SELECT id, slug, title, excerpt, content, cover, tags, views, likes, created_at FROM posts WHERE slug = ? LIMIT 1",
      [slug]
    );

    if (rows && rows.length > 0) {
      const r = rows[0];
      post.id = r.id;
      if (r.title) post.title = r.title;
      if (r.excerpt) post.description = r.excerpt;
      if (r.content && r.content.trim().length > 50) post.content = r.content;
      if (r.created_at) post.date = new Date(r.created_at).toISOString().slice(0, 10);
      post.views = (r.views ?? 0) + 1; // 服务端自增最新值
      post.likes = r.likes ?? 0;

      if (r.tags) {
        try {
          post.tags = typeof r.tags === "string" ? JSON.parse(r.tags) : (Array.isArray(r.tags) ? r.tags : post.tags);
        } catch {
          // 容错保持现有 tags
        }
      }

      // 服务端执行一次性静默自增，客户端无需额外 HTTP 请求
      await executeQuery("UPDATE posts SET views = views + 1 WHERE id = ?", [r.id]);
    }
  } catch (err) {
    console.error("[BuildLogDetail DB Fetch Error]:", err);
  }

  if (!post.content) {
    notFound();
  }

  const toc = getTableOfContents(post.content);
  const readingMinutes = calculateReadingMinutes(post.content, 14);

  return (
    <ArticleShell
      postId={post.id}
      slug={slug}
      initialViews={post.views}
      initialLikes={post.likes}
      kicker="技术白皮书"
      title={post.title}
      description={post.description}
      meta={[
        formatDate(post.date),
        getReadingTimeText(readingMinutes),
      ]}
      tags={post.tags}
      toc={toc}
    >
      <MDXRemote
        source={post.content}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [rehypeAutolinkHeadings, { behavior: "wrap" }],
              [rehypePrettyCode, { theme: "github-light" }],
            ],
          },
        }}
      />
    </ArticleShell>
  );
}
