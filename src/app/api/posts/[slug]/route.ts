import { NextResponse } from "next/server";
import { executeQuery, getLocalStats, saveLocalStats } from "@/lib/db";

interface PostRow {
  id: number;
  slug: string;
  title: string;
  views: number;
  likes: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    // 优先从 MySQL 查询
    const rows = await executeQuery<PostRow>(
      "SELECT id, slug, title, views, likes FROM posts WHERE slug = ? LIMIT 1",
      [slug]
    );

    if (rows && rows.length > 0) {
      return NextResponse.json({
        views: rows[0].views || 0,
        likes: rows[0].likes || 0,
      });
    }

    // 降级从本地状态读取
    const local = getLocalStats();
    const current = local[slug] || { views: 680, likes: 52 };

    return NextResponse.json({
      views: current.views,
      likes: current.likes,
    });
  } catch {
    return NextResponse.json({ views: 680, likes: 52 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || "view"; // "view" | "like" | "unlike"
    const title = body.title || slug;
    const collection = body.collection || "build-log";

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    let updatedViews = 0;
    let updatedLikes = 0;

    // 1. 尝试写入 MySQL
    let dbSuccess = false;
    if (action === "like") {
      const res = await executeQuery(
        `INSERT INTO posts (slug, collection, title, views, likes) 
         VALUES (?, ?, ?, 0, 1) 
         ON DUPLICATE KEY UPDATE likes = likes + 1`,
        [slug, collection, title]
      );
      dbSuccess = res !== null;
    } else if (action === "unlike") {
      const res = await executeQuery(
        `UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE slug = ?`,
        [slug]
      );
      dbSuccess = res !== null;
    } else {
      const res = await executeQuery(
        `INSERT INTO posts (slug, collection, title, views, likes) 
         VALUES (?, ?, ?, 1, 0) 
         ON DUPLICATE KEY UPDATE views = views + 1`,
        [slug, collection, title]
      );
      dbSuccess = res !== null;
    }

    if (dbSuccess) {
      const rows = await executeQuery<PostRow>(
        "SELECT views, likes FROM posts WHERE slug = ? LIMIT 1",
        [slug]
      );
      if (rows && rows.length > 0) {
        updatedViews = rows[0].views;
        updatedLikes = rows[0].likes;
      }
    } else {
      // 2. 降级维护本地状态
      const local = getLocalStats();
      const current = local[slug] || { views: 680, likes: 52 };

      if (action === "like") {
        current.likes += 1;
      } else if (action === "unlike") {
        current.likes = Math.max(0, current.likes - 1);
      } else {
        current.views += 1;
      }

      local[slug] = current;
      saveLocalStats(local);

      updatedViews = current.views;
      updatedLikes = current.likes;
    }

    return NextResponse.json({
      success: true,
      views: updatedViews,
      likes: updatedLikes,
    });
  } catch {
    return NextResponse.json({ success: true, views: 680, likes: 52 });
  }
}