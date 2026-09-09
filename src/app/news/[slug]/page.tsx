import { notFound } from "next/navigation";
import { getPublishedPost } from "@/lib/posts-repository";
import { PublishedArticle, articleMetadata } from "@/components/mdx/published-article";
type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props) {
  const post = await getPublishedPost("news", (await params).slug);
  if (!post) notFound();
  return articleMetadata(post);
}
export default async function Page({ params }: Props) {
  const post = await getPublishedPost("news", (await params).slug);
  if (!post) notFound();
  return <PublishedArticle post={post} />;
}
