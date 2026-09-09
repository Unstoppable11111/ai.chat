import type { Metadata } from "next";
import { MarkdownAsync } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import { ArticleShell } from "./article-shell";
import { getTableOfContents, calculateReadingMinutes } from "@/lib/content";
import { rehypeSourceAnchors } from "@/lib/markdown-core.mjs";
import { listPublishedPosts, type PublishedPost } from "@/lib/posts-repository";
import Link from "next/link";
import { formatDate, getReadingTimeText } from "@/lib/utils";
import { siteConfig } from "@/data/site";

export function articleMetadata(post: PublishedPost): Metadata {
  const url = `/${post.collection}/${post.slug}`;
  return { title: post.title, description: post.excerpt, alternates: { canonical: url }, twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [post.cover] }, openGraph: { type: "article", url, title: post.title, description: post.excerpt, publishedTime: post.publishedAt, modifiedTime: post.updatedAt, images: [{ url: post.cover }] } };
}
export async function PublishedArticle({ post }: { post: PublishedPost }) {
  const related = (await listPublishedPosts()).filter(item => item.slug !== post.slug)
    .map(item => ({ item, score: item.tags.filter(tag => post.tags.includes(tag)).length * 2 + Number(item.collection === post.collection) }))
    .filter(entry => entry.score > 0).sort((a,b) => b.score - a.score).slice(0,3).map(entry => entry.item);
  const url = `${siteConfig.url}/${post.collection}/${post.slug}`;
  const name = ({news:"科技资讯",projects:"项目记录",experiments:"实验记录"} as Record<string,string>)[post.collection] || "技术笔记";
  const structured = [{ "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.excerpt, mainEntityOfPage: url, image: new URL(post.cover, siteConfig.url).href, datePublished: post.publishedAt, dateModified: post.updatedAt, author: { "@type": "Person", name: "Chen", url: `${siteConfig.url}/about` }, inLanguage: "zh-CN" }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url }, { "@type": "ListItem", position: 2, name, item: `${siteConfig.url}/${post.collection}` }, { "@type": "ListItem", position: 3, name: post.title, item: url }] }];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g,"\\u003c") }} />
    <ArticleShell postId={post.id} slug={post.slug} initialViews={post.views} initialLikes={post.likes} kicker={name} title={post.title} description={post.excerpt} meta={[...(post.publishedAt ? [formatDate(post.publishedAt)] : []),getReadingTimeText(calculateReadingMinutes(post.content))]} tags={post.tags} toc={getTableOfContents(post.content)}>
      <MarkdownAsync remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug,rehypeSourceAnchors,[rehypePrettyCode,{theme:"github-light"}]]} components={{ h1: ({children,...props}) => <h2 {...props}>{children}</h2>, a: ({children,href,...props}) => <a {...props} href={href} className="text-brand-cyan underline underline-offset-4" rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}>{children}</a> }}>{post.content}</MarkdownAsync>
    </ArticleShell>
    {related.length > 0 && <nav aria-label="延伸阅读" className="mx-auto max-w-5xl border-t border-black/10 px-6 py-10">
      <h2 className="mb-4 text-xl font-semibold">延伸阅读</h2>
      <ul className="grid gap-5 sm:grid-cols-3">{related.map(item => <li key={item.slug} className="min-w-0"><Link className="font-medium text-brand-cyan underline-offset-4 hover:underline" href={`/${item.collection}/${item.slug}`}>{item.title}</Link><p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.excerpt}</p></li>)}</ul>
    </nav>}
  </>;
}
