import { createRequire } from "node:module";
import { createServer } from "node:net";
import nextEnv from "@next/env";
import { readLocalPosts, normalizePost, POSTS_SELECT } from "../src/lib/published-posts.mjs";
import { chunkMarkdown } from "../src/lib/markdown-core.mjs";
import { migrateDatabase, persistPost } from "./lib/database.mjs";

nextEnv.loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { Client } = require("C:/Users/DELL/.cache/codex-ssh-diagnostic/node_modules/ssh2");
const mysql = require("mysql2/promise");

const host = "124.223.54.164";
const ssh = new Client();

console.log("[云端数据库同步] 正在建立 SSH 隧道至", host, "...");

await new Promise((resolve, reject) => {
  ssh.on("ready", resolve);
  ssh.on("error", reject);
  ssh.connect({
    host,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    readyTimeout: 15000,
    keepaliveInterval: 5000,
  });
});

console.log("[云端数据库同步] SSH 握手成功，正在创建动态端口隧道...");

const tunnel = createServer((socket) => {
  ssh.forwardOut("127.0.0.1", 0, "127.0.0.1", 3306, (error, stream) => {
    if (error) {
      socket.destroy();
      return;
    }
    socket.pipe(stream).pipe(socket);
    socket.on("error", () => stream.destroy());
    stream.on("error", () => socket.destroy());
  });
});

await new Promise((resolve) => tunnel.listen(0, "127.0.0.1", resolve));
const port = tunnel.address().port;
console.log(`[云端数据库同步] 隧道建立成功 (本地端口: 127.0.0.1:${port})`);

const db = await mysql.createConnection({
  host: "127.0.0.1",
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || "ai_studio",
  charset: "utf8mb4",
});

try {
  console.log("[云端数据库同步] 正在检查并对齐云端数据库表结构...");
  await migrateDatabase(db);

  const localPosts = readLocalPosts();
  console.log(`[云端数据库同步] 读取到本地待同步文章总数: ${localPosts.length} 篇`);

  await db.beginTransaction();
  let updatedCount = 0;
  for (const post of localPosts) {
    await persistPost(db, post);
    updatedCount++;
  }
  await db.commit();
  console.log(`[云端数据库同步] 成功将 ${updatedCount} 篇文章完整持久化至云端 posts 表！`);

  // 切分 RAG 知识块并写入 knowledge_chunks_v2 表
  console.log("[云端数据库同步] 正在切分 RAG 知识块并同步至 knowledge_chunks_v2 表...");
  await db.beginTransaction();
  const [rows] = await db.query(`${POSTS_SELECT} WHERE status='published' AND rag_ready=1 FOR UPDATE`);
  await db.execute("DELETE FROM knowledge_chunks_v2");
  
  let chunkCount = 0;
  for (const row of rows) {
    const post = normalizePost(row);
    for (const chunk of chunkMarkdown(post)) {
      const { content, ...metadata } = chunk;
      await db.execute(
        "INSERT INTO knowledge_chunks_v2(chunk_id, post_id, content_hash, metadata, content) VALUES(?, ?, ?, ?, ?)",
        [chunk.id, post.id, post.contentHash, JSON.stringify(metadata), content]
      );
      chunkCount++;
    }
  }
  await db.commit();
  console.log(`[云端数据库同步] 成功索引并写入 ${chunkCount} 个完整 RAG 知识块 (来自 ${rows.length} 篇已发布文章)！`);

  const [countRes] = await db.query("SELECT COUNT(*) AS total FROM posts");
  console.log(`[云端数据库同步] 云端 posts 表当前最终总文章数: ${countRes[0].total}`);

} catch (err) {
  console.error("[云端数据库同步] 写入异常，执行回滚:", err);
  await db.rollback().catch(() => {});
  throw err;
} finally {
  await db.end();
  tunnel.close();
  ssh.end();
  console.log("[云端数据库同步] 数据库连接已安全关闭，隧道已成功释放。");
}
