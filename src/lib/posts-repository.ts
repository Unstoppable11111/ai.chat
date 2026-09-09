import { cache } from "react";
import { executeQuery, getDbPool } from "./db";
import { normalizePost, POSTS_SELECT, readLocalPosts } from "./published-posts.mjs";
import { calculateReadingMinutes } from "./content";

export type PublishedPost = ReturnType<typeof normalizePost>;
export function projectListItem(post: PublishedPost): import("./types").ProjectEntry {
  return {slug:post.slug,title:post.title,description:post.excerpt,cover:post.cover,type:String(post.metadata.type||"概念项目"),year:String(post.metadata.year||""),stack:Array.isArray(post.metadata.stack)?post.metadata.stack:post.tags,featured:post.featured};
}
export function experimentListItem(post: PublishedPost): import("./types").ExperimentEntry {
  return {...postListItem(post),category:post.metadata.category||"网站视觉",tools:Array.isArray(post.metadata.tools)?post.metadata.tools:[],promptPreview:String(post.metadata.promptPreview||"")};
}
export const listPublishedPosts = cache(async (collection?: string): Promise<PublishedPost[]> => {
  const posts = getDbPool() && process.env.CONTENT_SOURCE !== "local"
    ? (await executeQuery<Record<string, unknown>>(`${POSTS_SELECT} WHERE status='published'${collection ? " AND collection=?" : ""} ORDER BY published_at DESC, id DESC`, collection ? [collection] : []) || []).map(normalizePost)
    : readLocalPosts();
  return posts.filter(post => post.status === "published" && (!collection || post.collection === collection)).sort((a,b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
});
export const getPublishedPost = cache(async (collection: string, slug: string) => (await listPublishedPosts(collection)).find(post => post.slug === slug));
export function postListItem(post: PublishedPost) {
  return { id: post.id as number | undefined, slug: post.slug, title: post.title, excerpt: post.excerpt, cover: post.cover, tags: post.tags, date: post.publishedAt || "", views: post.views, likes: post.likes, featured: post.featured, readingMinutes: calculateReadingMinutes(post.content) };
}
