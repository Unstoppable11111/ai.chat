import { connectDatabase } from "./lib/database.mjs";
import { normalizePost, POSTS_SELECT, readLocalPosts } from "../src/lib/published-posts.mjs";
import { chunkMarkdown } from "../src/lib/markdown-core.mjs";

if (process.argv.includes("--check")) {
  const posts = readLocalPosts().filter(p=>p.status === "published" && p.ragReady);
  console.log(JSON.stringify({posts:posts.length,chunks:posts.flatMap(p=>chunkMarkdown(p)).length}));
} else {
  const db = await connectDatabase();
  try {
    await db.beginTransaction();
    const [rows] = await db.query(`${POSTS_SELECT} WHERE status='published' AND rag_ready=1 FOR UPDATE`);
    // DELETE is transactional, unlike TRUNCATE. Readers see either complete version.
    await db.execute("DELETE FROM knowledge_chunks_v2");
    let count = 0;
    for (const row of rows) {
      const post = normalizePost(row);
      for (const chunk of chunkMarkdown(post)) {
        const { content, ...metadata } = chunk;
        await db.execute("INSERT INTO knowledge_chunks_v2(chunk_id,post_id,content_hash,metadata,content) VALUES(?,?,?,?,?)", [chunk.id,post.id,post.contentHash,JSON.stringify(metadata),content]);
        count++;
      }
    }
    await db.commit(); console.log(`Indexed ${count} complete chunks from ${rows.length} published posts.`);
  } catch (error) { await db.rollback(); throw error; }
  finally { await db.end(); }
}
