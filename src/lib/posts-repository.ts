import { cache } from "react";
import { executeQuery, getDbPool } from "./db";
import { normalizePost, POSTS_SELECT, POSTS_SUMMARY_SELECT, readLocalPosts } from "./published-posts.mjs";
import { calculateReadingMinutes } from "./content";

export type PublishedPost = ReturnType<typeof normalizePost>;
export function projectListItem(post: PublishedPost): import("./types").ProjectEntry {
  return {slug:post.slug,title:post.title,description:post.excerpt,cover:post.cover,type:String(post.metadata.type||"概念项目"),year:String(post.metadata.year||""),stack:Array.isArray(post.metadata.stack)?post.metadata.stack:post.tags,featured:post.featured};
}
export function experimentListItem(post: PublishedPost): import("./types").ExperimentEntry {
  return {...postListItem(post),category:post.metadata.category||"网站视觉",tools:Array.isArray(post.metadata.tools)?post.metadata.tools:[],promptPreview:String(post.metadata.promptPreview||"")};
}
// 性能优化：进程级缓存（TTL 120s），且列表页使用轻量摘要查询避免传输数 MB 的 LONGTEXT 正文。
const LIST_CACHE_TTL_MS = 120_000;
const listCache = new Map<string, { expiresAt: number; promise: Promise<PublishedPost[]> }>();
const summaryCache = new Map<string, { expiresAt: number; promise: Promise<PublishedPost[]> }>();

/** 新增/更新文章后调用，立即让列表缓存失效 */
export function invalidatePublishedPostsCache() {
  listCache.clear();
  summaryCache.clear();
}

export const listPublishedPosts = cache(async (collection?: string): Promise<PublishedPost[]> => {
  const key = collection || "__all__";
  const hit = listCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.promise;

  const promise = queryPublishedPosts(collection, POSTS_SELECT);
  listCache.set(key, { expiresAt: Date.now() + LIST_CACHE_TTL_MS, promise });
  promise.catch(() => listCache.delete(key));
  return promise;
});

/**
 * 列表展示专用轻量查询：不拉取 LONGTEXT 正文，仅计算 CHAR_LENGTH(content)，大幅降低首页与栏目页 TTFB。
 */
export const listPublishedPostSummaries = cache(async (collection?: string): Promise<PublishedPost[]> => {
  const key = collection || "__all__";
  const hit = summaryCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.promise;

  const promise = queryPublishedPosts(collection, POSTS_SUMMARY_SELECT);
  summaryCache.set(key, { expiresAt: Date.now() + LIST_CACHE_TTL_MS, promise });
  promise.catch(() => summaryCache.delete(key));
  return promise;
});

async function queryPublishedPosts(collection: string | undefined, selectSql: string): Promise<PublishedPost[]> {
  let dbPosts: PublishedPost[] | null = null;

  if (process.env.CONTENT_SOURCE !== "local" && getDbPool()) {
    try {
      const rows = await executeQuery<Record<string, unknown>[]>(
        `${selectSql} WHERE status='published'${collection ? " AND collection=?" : ""} ORDER BY published_at DESC, id DESC`,
        collection ? [collection] : []
      );
      if (Array.isArray(rows) && rows.length > 0) {
        dbPosts = rows.map(normalizePost);
      }
    } catch (err) {
      console.warn("[posts-repository] 数据库查询失败，自动降级至本地数据兜底:", err instanceof Error ? err.message : String(err));
    }
  }

  const posts = dbPosts || readLocalPosts(collection);
  return posts
    .filter(post => post.status === "published" && (!collection || post.collection === collection))
    .sort((a,b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
}

export const getPublishedPost = cache(async (collection: string, slug: string): Promise<PublishedPost | undefined> => {
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

  const localList = readLocalPosts(collection);
  return localList.find(post => post.slug === slug && (!collection || post.collection === collection));
});

export function postListItem(post: PublishedPost) {
  const readingMinutes = post.content
    ? calculateReadingMinutes(post.content)
    : Math.max(1, Math.ceil((post.contentLength || 800) / 500));
  return { id: post.id as number | undefined, slug: post.slug, title: post.title, excerpt: post.excerpt, cover: post.cover, tags: post.tags, date: post.publishedAt || "", views: post.views, likes: post.likes, featured: post.featured, readingMinutes };
}
