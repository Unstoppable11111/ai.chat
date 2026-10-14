import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { sameOrigin, readJsonBody } from "@/lib/server-security";
import { executeQuery, getDbPool } from "@/lib/db";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "禁止跨域请求" }, { status: 403 });
  }

  try {
    const body = await readJsonBody(request, 64000) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const rawSlug = typeof body.slug === "string" ? body.slug.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
    const tags = Array.isArray(body.tags) ? body.tags.filter(t => typeof t === "string") : ["AI对话", "研报沉淀"];
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!title || title.length < 3) {
      return NextResponse.json({ error: "文章标题不得少于 3 个字符" }, { status: 400 });
    }

    if (!content || content.length < 300) {
      return NextResponse.json({ error: "沉淀内容过短，无法满足技术白皮书深度规范" }, { status: 400 });
    }

    // Slug 清洗为安全文件名
    const slug = (rawSlug || title)
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
      .replace(/^-+|-+$/g, "") || `curated-${Date.now()}`;

    const targetDir = path.resolve(process.cwd(), "content", "build-log");
    const targetFile = path.join(targetDir, `${slug}.mdx`);

    const dateStr = new Date().toISOString().split("T")[0];
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
excerpt: "${(excerpt || title).replace(/"/g, '\\"')}"
date: "${dateStr}"
updated: "${dateStr}"
tags: ${JSON.stringify(tags)}
cover: "/images/blog-covers/claude-gemini.webp"
featured: false
status: published
ragReady: true
views: 0
likes: 0
---

`;

    const fullMdx = frontmatter + content + "\n";
    await fs.writeFile(targetFile, fullMdx, "utf8");

    // 若数据库在线，异步同步入库
    try {
      if (getDbPool()) {
        await executeQuery(
          "INSERT INTO posts (slug, collection, title, excerpt, cover, tags, content, status, rag_ready, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 1, NOW()) ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), excerpt=VALUES(excerpt), tags=VALUES(tags)",
          [slug, "build-log", title, excerpt, "/images/blog-covers/claude-gemini.webp", JSON.stringify(tags), content]
        );
      }
    } catch {
      // 数据库异常不阻断本地文件生成
    }

    return NextResponse.json({
      success: true,
      slug,
      url: `/build-log/${slug}`,
      message: "成功沉淀为技术白皮书并接入 RAG 知识库",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "处理失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
