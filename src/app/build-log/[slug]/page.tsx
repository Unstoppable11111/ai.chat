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

  return {
    title: entry.frontmatter.title as string,
    description: entry.frontmatter.excerpt as string,
  };
}

export default async function BuildLogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = getBuildLogBySlug(slug);

  if (!entry) {
    notFound();
  }

  const toc = getTableOfContents(entry.content);

  return (
    <ArticleShell
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
