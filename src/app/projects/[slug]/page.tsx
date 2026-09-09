import { notFound } from "next/navigation";
import { getPublishedPost } from "@/lib/posts-repository";
import { PublishedArticle, articleMetadata } from "@/components/mdx/published-article";
export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props) { const post=await getPublishedPost("projects",(await params).slug);return post?articleMetadata(post):{}; }
export default async function Page({params}:Props) { const post=await getPublishedPost("projects",(await params).slug);if(!post)notFound();return <PublishedArticle post={post}/>; }
