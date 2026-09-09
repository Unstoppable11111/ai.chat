import { readLocalPosts } from "../src/lib/published-posts.mjs";
import { connectDatabase, migrateDatabase, persistPost } from "./lib/database.mjs";
const posts = readLocalPosts();
if (process.argv.includes("--check")) {
  console.log(JSON.stringify({posts:posts.length,published:posts.filter(p=>p.status === "published").length,ragReady:posts.filter(p=>p.ragReady).length}));
} else {
  const db = await connectDatabase();
  try {
    await migrateDatabase(db);
    await db.beginTransaction();
    for (const post of posts) await persistPost(db, post);
    await db.commit();
    console.log(`Persisted ${posts.length} posts; view/like counters preserved. Run npm run rag:index next.`);
  } catch (error) { await db.rollback(); throw error; }
  finally { await db.end(); }
}
