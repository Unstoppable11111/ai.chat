import { listPublishedPosts } from "./posts-repository";
import { chunkMarkdown, rankChunks } from "./markdown-core.mjs";
export type KnowledgeChunk = ReturnType<typeof chunkMarkdown>[number];
export type RagSearchResult = ReturnType<typeof rankChunks>[number];
export async function searchKnowledgeBase(query: string, limit = 4): Promise<RagSearchResult[]> {
  if (!query.trim()) return [];
  const posts = (await listPublishedPosts()).filter(post => post.ragReady);
  // The published revision is authoritative; a stale offline index cannot revive removed content.
  const chunks = posts.flatMap(post => chunkMarkdown(post));
  return rankChunks(chunks, query.slice(0,1000), limit);
}
