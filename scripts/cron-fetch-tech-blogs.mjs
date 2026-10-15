import fs from "node:fs/promises";
import path from "node:path";
import { connectDatabase, migrateDatabase, persistPost } from "./lib/database.mjs";
import { normalizePost } from "../src/lib/published-posts.mjs";

console.log("[Tech Radar] 正在拉取全球前沿开源 AI 技术动态...");

let entries = [];
try {
  const response = await fetch("https://dev.to/api/articles?tag=ai&top=2&per_page=10", {
    headers: { "User-Agent": "ChenTechStudio-ContentReview/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (response.ok) {
    entries = await response.json();
  } else {
    console.warn(`[Tech Radar] Feed 返回状态码 ${response.status}`);
  }
} catch (err) {
  console.warn("[Tech Radar] 网络抓取受限或超时，将跳过外部拉取:", err.message);
}

if (!Array.isArray(entries) || entries.length === 0) {
  console.log("[Tech Radar] 本轮未发现新外部动态，流程平稳结束。");
  process.exit(0);
}

const newsDir = path.resolve(process.cwd(), "content", "news");
await fs.mkdir(newsDir, { recursive: true });

let db = null;
try {
  db = await connectDatabase();
  await migrateDatabase(db);
  await db.beginTransaction();
} catch (e) {
  console.log("[Tech Radar] 数据库当前未连接，启用纯本地文件存储模式。");
}

let savedCount = 0;

for (const item of entries) {
  if (!Number.isSafeInteger(item.id) || typeof item.title !== "string" || typeof item.url !== "string") continue;
  const url = new URL(item.url);
  if (url.protocol !== "https:" || url.hostname !== "dev.to") continue;

  const slug = `devto-${item.id}`;
  const localFilePath = path.join(newsDir, `${slug}.mdx`);

  const title = item.title.replace(/"/g, '\\"');
  const excerpt = String(item.description || item.title).slice(0, 200).replace(/"/g, '\\"');
  const tags = Array.isArray(item.tag_list) && item.tag_list.length ? item.tag_list : ["AI前沿", "开源动态"];
  const dateStr = item.published_at ? item.published_at.split("T")[0] : new Date().toISOString().split("T")[0];

  const mdxContent = `---
title: "${title}"
excerpt: "${excerpt}"
date: "${dateStr}"
updated: "${dateStr}"
tags: ${JSON.stringify(tags)}
cover: "/images/blog-covers/sparse-moe.webp"
featured: false
status: published
ragReady: true
views: 0
likes: 0
---

## 核心技术摘要

${String(item.description || "暂无详细描述。")}

## 技术背景与行业脉络

该技术动态源自国际前沿开源技术生态社区，重点聚焦于大语言模型工程化部署、智能体架构优化与多模态工具链落地。

## 原始来源与溯源指引

- [阅读原文官方链接](${url.href})
`;

  try {
    // 检查本地文件是否已存在
    try {
      await fs.access(localFilePath);
    } catch {
      await fs.writeFile(localFilePath, mdxContent, "utf8");
      savedCount++;
    }

    if (db) {
      const post = normalizePost({
        slug,
        collection: "news",
        title: item.title,
        excerpt: String(item.description || ""),
        cover: "/images/blog-covers/sparse-moe.webp",
        tags,
        status: "published",
        rag_ready: true,
        date: item.published_at,
        content: mdxContent,
      });

      const [existing] = await db.execute("SELECT id FROM posts WHERE slug=?", [post.slug]);
      if (!existing.length) {
        await persistPost(db, post);
      }
    }
  } catch (err) {
    console.warn(`[Tech Radar] 保存条目 ${slug} 异常:`, err.message);
  }
}

if (db) {
  try {
    await db.commit();
    await db.end();
  } catch {}
}

console.log(`[Tech Radar] 同步完成：共归档更新 ${savedCount} 篇前沿科技资讯至知识库。`);
