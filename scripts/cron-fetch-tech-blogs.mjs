import { connectDatabase, migrateDatabase, persistPost } from "./lib/database.mjs";
import { normalizePost } from "../src/lib/published-posts.mjs";

// A structured API avoids lossy XML parsing. Imported summaries stay drafts until reviewed.
const response = await fetch("https://dev.to/api/articles?tag=ai&top=1&per_page=5", { headers: { "User-Agent": "ChenTechStudio-ContentReview/1.0" }, signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`Feed HTTP ${response.status}`);
const entries = await response.json();
if (!Array.isArray(entries)) throw new Error("Invalid feed response");
const db = await connectDatabase();
try {
  await migrateDatabase(db);
  await db.beginTransaction();
  let count = 0;
  for (const item of entries) {
    if (!Number.isSafeInteger(item.id) || typeof item.title !== "string" || typeof item.url !== "string") continue;
    const url = new URL(item.url);
    if (url.protocol !== "https:" || url.hostname !== "dev.to") continue;
    const post = normalizePost({slug:`devto-${item.id}`,collection:"news",title:item.title,excerpt:String(item.description || ""),cover:"/opengraph-image",tags:Array.isArray(item.tag_list) ? item.tag_list : [],status:"draft",rag_ready:false,date:item.published_at,content:`## 来源摘要\n\n${String(item.description || "")}\n\n## 原始来源\n\n[阅读原文](${url.href})\n`});
    const [existing] = await db.execute("SELECT id FROM posts WHERE slug=?",[post.slug]);
    if (existing.length) continue;
    await persistPost(db,post); count++;
  }
  await db.commit(); console.log(`Saved ${count} source-linked drafts. No automatic publication or model calls.`);
} catch (error) { await db.rollback(); throw error; }
finally { await db.end(); }
