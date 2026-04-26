import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { ArticleShell } from "@/components/mdx/article-shell";
import { mdxComponents } from "@/components/mdx/mdx-components";
import { getProjectBySlug, getProjects, getTableOfContents } from "@/lib/content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getProjects().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getProjectBySlug(slug);

  if (!entry) {
    return {};
  }

  return {
    title: entry.frontmatter.title as string,
    description: entry.frontmatter.description as string,
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = getProjectBySlug(slug);

  if (!entry) {
    notFound();
  }

  const toc = getTableOfContents(entry.content);

  return (
    <ArticleShell
      kicker="项目案例"
      title={entry.frontmatter.title as string}
      description={entry.frontmatter.description as string}
      meta={[entry.frontmatter.type as string, entry.frontmatter.year as string]}
      tags={entry.frontmatter.stack as string[]}
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
