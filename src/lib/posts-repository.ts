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
  // 核心原则：数据库优先，本地兜底
  let dbPosts: PublishedPost[] | null = null;

  if (process.env.CONTENT_SOURCE !== "local" && getDbPool()) {
    try {
      const rows = await executeQuery<Record<string, unknown>[]>(
        `${POSTS_SELECT} WHERE status='published'${collection ? " AND collection=?" : ""} ORDER BY published_at DESC, id DESC`,
        collection ? [collection] : []
      );
      if (Array.isArray(rows) && rows.length > 0) {
        dbPosts = rows.map(normalizePost);
      }
    } catch (err) {
      // 数据库查询异常自动降级
      console.warn("[posts-repository] 数据库查询失败，自动降级至本地数据兜底:", err instanceof Error ? err.message : String(err));
    }
  }

  // 若数据库未就绪、无数据或异常，读取本地数据作为坚实兜底
  const posts = dbPosts || readLocalPosts();
  return posts
    .filter(post => post.status === "published" && (!collection || post.collection === collection))
    .sort((a,b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
});

export const getPublishedPost = cache(async (collection: string, slug: string): Promise<PublishedPost | undefined> => {
  // 单篇查询：数据库优先，本地兜底
  if (process.env.CONTENT_SOURCE !== "local" && getDbPool()) {
    try {
      const rows = await executeQuery<Record<string, unknown>[]>(
        `${POSTS_SELECT} WHERE slug=? AND status='published' LIMIT 1`,
        [slug]
      );
      if (Array.isArray(rows) && rows.length > 0) {
        const post = normalizePost(rows[0]);
        if (!collection || post.collection === collection) {
          return post;
        }
      }
    } catch {
      // 容错降级
    }
  }

  // 本地兜底查找
  const localList = readLocalPosts();
  return localList.find(post => post.slug === slug && (!collection || post.collection === collection));
});

export function postListItem(post: PublishedPost) {
  return { id: post.id as number | undefined, slug: post.slug, title: post.title, excerpt: post.excerpt, cover: post.cover, tags: post.tags, date: post.publishedAt || "", views: post.views, likes: post.likes, featured: post.featured, readingMinutes: calculateReadingMinutes(post.content) };
}
