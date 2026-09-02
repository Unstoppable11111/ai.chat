import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

/**
 * 真实科技博客/AI 资讯定时抓取与自动入库引擎
 * 支持从 Hugging Face Blog、GitHub AI 等公开 RSS Feed 自动解析真实封面图与正文
 */
const RSS_FEEDS = [
  {
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
    defaultCover: "/images/blog-covers/mcp-protocol.svg",
    collection: "news"
  }
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .slice(0, 80);
}

function parseXmlItems(xmlText) {
  const items = [];
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
    const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || itemXml.match(/<description>(.*?)<\/description>/);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    
    // 提取真实封面图 URL
    const mediaMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["']/i) || 
                       itemXml.match(/<enclosure[^>]*url=["']([^"']+)["']/i) ||
                       itemXml.match(/<img[^>]*src=["']([^"']+)["']/i);

    if (titleMatch) {
      const title = titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
      const rawDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";
      const excerpt = rawDesc.slice(0, 200) + (rawDesc.length > 200 ? "..." : "");
      const link = linkMatch ? linkMatch[1].trim() : "";
      const date = pubDateMatch ? new Date(pubDateMatch[1]).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      const coverUrl = mediaMatch ? mediaMatch[1] : null;

      items.push({
        title,
        excerpt,
        link,
        date,
        coverUrl,
        slug: slugify(title) || `ai-news-${Date.now()}`
      });
    }
  }

  return items;
}

export async function fetchAndSyncLatestBlogs() {
  console.log("🌐 正在从真实科技源抓取最新 AI 博客与动态...");

  const contentNewsDir = path.join(process.cwd(), "content", "news");
  if (!fs.existsSync(contentNewsDir)) {
    fs.mkdirSync(contentNewsDir, { recursive: true });
  }

  let dbConnection = null;
  try {
    dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "980822Cyc!",
      database: process.env.DB_DATABASE || "ai_studio",
      charset: "utf8mb4"
    });
  } catch {
    console.warn("⚠️ 本地未直连远程 MySQL，抓取的数据将优先持久化至本地 content/news MDX。");
  }

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`📡 正在请求: ${feed.name} (${feed.url})`);
      const response = await fetch(feed.url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIStudioBot/1.0" },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.warn(`❌ 请求失败 HTTP ${response.status}`);
        continue;
      }

      const xmlText = await response.text();
      const items = parseXmlItems(xmlText);
      console.log(`📥 成功解析到 ${items.length} 篇最新文章`);

      for (const item of items.slice(0, 5)) {
        const cover = item.coverUrl || feed.defaultCover;
        const filePath = path.join(contentNewsDir, `${item.slug}.mdx`);

        // 生成 MDX 内容
        const mdxContent = `---
title: "${item.title.replace(/"/g, '\\"')}"
excerpt: "${item.excerpt.replace(/"/g, '\\"')}"
date: "${item.date}"
tags:
  - "AI资讯"
  - "开源技术"
  - "${feed.name}"
cover: "${cover}"
featured: false
---

## 资讯导读

本文来自 **${feed.name}** 官方发布的技术资讯。

> **原文出处**：[${item.title}](${item.link})
> **发布日期**：${item.date}

## 核心要点

${item.excerpt}

## 深度阅读

欢迎访问官方原文链接获取完整技术细节与模型体验：[点击阅读官方原文](${item.link})。
`;

        fs.writeFileSync(filePath, mdxContent, "utf8");
        console.log(`  ✅ 写入本地文章: content/news/${item.slug}.mdx (封面: ${cover})`);

        if (dbConnection) {
          try {
            await dbConnection.execute(
              `INSERT INTO posts (slug, collection, title, excerpt, tags, content, views, likes, featured, published_at)
               VALUES (?, 'news', ?, ?, ?, ?, ?, ?, 0, ?)
               ON DUPLICATE KEY UPDATE 
                 title = VALUES(title),
                 excerpt = VALUES(excerpt),
                 published_at = VALUES(published_at)`,
              [
                item.slug,
                item.title,
                item.excerpt,
                "AI资讯, 开源技术",
                mdxContent,
                Math.floor(Math.random() * 400 + 200),
                Math.floor(Math.random() * 30 + 10),
                item.date
              ]
            );
          } catch (dbInsertErr) {
            console.warn("  ⚠️ 写入数据库失败:", dbInsertErr.message);
          }
        }
      }
    } catch (feedErr) {
      console.warn(`⚠️ 抓取 ${feed.name} 异常:`, feedErr.message);
    }
  }

  if (dbConnection) {
    await dbConnection.end();
  }

  console.log("🎉 科技博客与真实封面定时同步任务执行完毕！\n");
}

fetchAndSyncLatestBlogs();
