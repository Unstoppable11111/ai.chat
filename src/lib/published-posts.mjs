import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { contentHash } from "./markdown-core.mjs";

export const collections = ["build-log", "news", "projects", "experiments"];
/** @param {unknown} value @returns {string[]} */
export function parseTags(value) {
  if (typeof value === "string") { try { value = JSON.parse(value); } catch { return []; } }
  return Array.isArray(value) ? value.filter(item => typeof item === "string") : [];
}
/** @param {Record<string, any>} row */
export function normalizePost(row) {
  const iso = value => value ? new Date(value).toISOString() : undefined;
  const content = String(row.content || "");
  let metadata = row.metadata || {};
  if (typeof metadata === "string") { try { metadata = JSON.parse(metadata); } catch { metadata = {}; } }
  const details = { ...metadata, ...Object.fromEntries(["type","stack","year","category","tools","promptPreview"].filter(key=>row[key]!==undefined).map(key=>[key,row[key]])) };
  return { metadata: details, id: row.id, slug: String(row.slug), collection: String(row.collection), title: String(row.title), excerpt: String(row.excerpt || row.description || ""), cover: String(row.cover || "/opengraph-image"), tags: parseTags(row.tags), content, status: String(row.status || "published"), ragReady: Boolean(row.rag_ready ?? row.ragReady ?? false), publishedAt: iso(row.published_at || row.date || row.created_at), updatedAt: iso(row.updated_at || row.updated || row.date || row.created_at), views: Number(row.views) || 0, likes: Number(row.likes) || 0, featured: Boolean(row.featured), contentHash: contentHash(content) };
}
export function readLocalPosts() {
  return collections.flatMap(collection => {
    const dir = path.join(process.cwd(), "content", collection);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(file => file.endsWith(".mdx")).map(file => {
      const { data, content } = matter(fs.readFileSync(path.join(dir,file), "utf8"));
      return normalizePost({ ...data, collection, slug: file.slice(0,-4), content });
    });
  });
}
export const POSTS_SELECT = "SELECT id,metadata,slug,collection,title,excerpt,cover,tags,content,status,rag_ready,published_at,updated_at,views,likes,featured FROM posts";
