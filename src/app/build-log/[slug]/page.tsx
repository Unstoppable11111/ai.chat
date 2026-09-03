import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { ArticleShell } from "@/components/mdx/article-shell";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { getBuildLogBySlug, getBuildLogs, getTableOfContents } from "@/lib/content";
import { formatDate, getReadingTimeText } from "@/lib/utils";
import { executeQuery } from "@/lib/db";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getBuildLogs().map((entry) => ({ slug: entry.slug }));
}

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
  const entry = getBuildLogBySlug(slug);

  if (!entry) {
    notFound();
  }

  // 服务端直接获取主键数字 id，并在服务端静默自增阅读量，杜绝客户端重复请求
  let postId: number | undefined = undefined;
  let initialViews = Number(entry.frontmatter.views) || 0;
  let initialLikes = Number(entry.frontmatter.likes) || 0;

  try {
    const rows = await executeQuery<{ id: number; views: number; likes: number }>(
      "SELECT id, views, likes FROM posts WHERE slug = ? LIMIT 1",
      [slug]
    );
    if (rows && rows.length > 0) {
      postId = rows[0].id;
      initialViews = (rows[0].views ?? 0) + 1;
      initialLikes = rows[0].likes ?? 0;

      // 服务端执行一次性静默自增，客户端无需额外 HTTP 请求
      await executeQuery("UPDATE posts SET views = views + 1 WHERE id = ?", [postId]);
    }
  } catch {
    // 容错
  }

  const toc = getTableOfContents(entry.content);

  return (
    <ArticleShell
      postId={postId}
      slug={slug}
      initialViews={initialViews}
      initialLikes={initialLikes}
      kicker="构建日志"
      title={entry.frontmatter.title as string}
      description={entry.frontmatter.excerpt as string}
      meta={[
        formatDate(entry.frontmatter.date as string),
        getReadingTimeText(entry.stats.minutes),
      ]}
      tags={entry.frontmatter.tags as string[]}
      toc={toc}
    >
      <MDXRemote
        source={entry.content}
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
