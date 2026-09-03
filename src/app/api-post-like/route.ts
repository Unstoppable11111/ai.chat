import { NextResponse } from "next/server";
import { executeQuery, getLocalStats, saveLocalStats } from "@/lib/db";

interface LikeResult {
  id: number;
  likes: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { postId, slug, action = "like" } = body;

    const targetId = typeof postId === "number" && postId > 0 ? postId : null;
    const targetSlug = typeof slug === "string" ? slug.trim() : null;

    if (!targetId && !targetSlug) {
      return NextResponse.json({ success: false, message: "缺少必要文章标识 (postId 或 slug)" }, { status: 400 });
    }

    let dbSuccess = false;

    // 1. 优先使用数字主键 id 纳秒级聚簇索引更新
    if (targetId) {
      const sql = action === "unlike"
        ? "UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = ?"
        : "UPDATE posts SET likes = likes + 1 WHERE id = ?";
      const res = await executeQuery(sql, [targetId]);
      dbSuccess = res !== null;
    } else if (targetSlug) {
      // 兼容 slug
      const sql = action === "unlike"
        ? "UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE slug = ?"
        : "UPDATE posts SET likes = likes + 1 WHERE slug = ?";
      const res = await executeQuery(sql, [targetSlug]);
      dbSuccess = res !== null;
    }

    // 2. 查询最新 likes 数量返回
    if (dbSuccess) {
      const querySql = targetId
        ? "SELECT id, likes FROM posts WHERE id = ? LIMIT 1"
        : "SELECT id, likes FROM posts WHERE slug = ? LIMIT 1";
      const rows = await executeQuery<LikeResult>(querySql, [targetId || targetSlug]);
      if (rows && rows.length > 0) {
        return NextResponse.json({
          success: true,
          id: rows[0].id,
          likes: rows[0].likes ?? 0,
        });
      }
    }

    // 3. 本地离线开发降级
    const local = getLocalStats();
    const cacheKey = targetSlug || (targetId ? `post_id_${targetId}` : "unknown");
    const current = local[cacheKey] || { views: 100, likes: 10 };
    if (action === "unlike") {
      current.likes = Math.max(0, current.likes - 1);
    } else {
      current.likes += 1;
    }
    local[cacheKey] = current;
    saveLocalStats(local);

    return NextResponse.json({
      success: true,
      id: targetId,
      likes: current.likes,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}