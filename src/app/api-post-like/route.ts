import { NextResponse } from "next/server";
import { executeQuery, getLocalStats, saveLocalStats } from "@/lib/db";

interface PostRow {
  id: number;
  slug: string;
  views: number;
  likes: number;
}

// 统一标准的企业级 API 成功响应
function successResponse(data: any, message = "操作成功") {
  return NextResponse.json({
    code: 200,
    success: true,
    message,
    data,
  });
}

// 统一标准的企业级 API 错误响应
function errorResponse(message = "请求处理失败", code = 400, status = 400) {
  return NextResponse.json(
    {
      code,
      success: false,
      message,
      data: null,
    },
    { status }
  );
}

// 1. GET: 获取某篇文章的实时真实数据 (主键 id、views、likes)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPostId = searchParams.get("postId");
    const rawSlug = searchParams.get("slug");

    const postId = rawPostId ? Number(rawPostId) : null;
    const slug = rawSlug ? rawSlug.trim() : null;

    if (!postId && !slug) {
      return errorResponse("缺少文章唯一标识 (postId 或 slug)", 400, 400);
    }

    // 优先按数字主键查询
    const querySql = postId
      ? "SELECT id, slug, views, likes FROM posts WHERE id = ? LIMIT 1"
      : "SELECT id, slug, views, likes FROM posts WHERE slug = ? LIMIT 1";

    const rows = await executeQuery<PostRow>(querySql, [postId || slug]);
    if (rows && rows.length > 0) {
      return successResponse({
        id: rows[0].id,
        slug: rows[0].slug,
        views: rows[0].views ?? 0,
        likes: rows[0].likes ?? 0,
      }, "获取文章统计成功");
    }

    // 本地缓存兜底
    const local = getLocalStats();
    const cacheKey = slug || (postId ? `post_id_${postId}` : "unknown");
    const current = local[cacheKey] || { views: 100, likes: 10 };

    return successResponse({
      id: postId,
      slug: slug,
      views: current.views,
      likes: current.likes,
    }, "读取本地统计成功");
  } catch (err: any) {
    return errorResponse(err.message, 500, 500);
  }
}

// 2. POST: 纯粹通过数字主键 postId 进行点赞 / 取消点赞
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { postId: rawPostId, slug: rawSlug, action = "like" } = body;

    let targetId = (typeof rawPostId === "number" && rawPostId > 0) ? rawPostId : (rawPostId ? Number(rawPostId) : null);
    const targetSlug = typeof rawSlug === "string" ? rawSlug.trim() : null;

    if (!targetId && !targetSlug) {
      return errorResponse("缺少必要文章标识 (postId)", 400, 400);
    }

    // 如果客户端只传了 slug，后端自动反查出真实数字 id，确保数据库层绝对以 id 为唯一索引
    if (!targetId && targetSlug) {
      const idRows = await executeQuery<{ id: number }>(
        "SELECT id FROM posts WHERE slug = ? LIMIT 1",
        [targetSlug]
      );
      if (idRows && idRows.length > 0) {
        targetId = idRows[0].id;
      }
    }

    let dbSuccess = false;

    // 100% 严格使用数字主键 id 进行行级锁聚簇索引自增/自减
    if (targetId) {
      let updateSql = "";
      if (action === "view") {
        updateSql = "UPDATE posts SET views = views + 1 WHERE id = ?";
      } else if (action === "unlike") {
        updateSql = "UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = ?";
      } else {
        updateSql = "UPDATE posts SET likes = likes + 1 WHERE id = ?";
      }
      const res = await executeQuery(updateSql, [targetId]);
      dbSuccess = res !== null;
    } else if (targetSlug) {
      let updateSql = "";
      if (action === "view") {
        updateSql = "UPDATE posts SET views = views + 1 WHERE slug = ?";
      } else if (action === "unlike") {
        updateSql = "UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE slug = ?";
      } else {
        updateSql = "UPDATE posts SET likes = likes + 1 WHERE slug = ?";
      }
      const res = await executeQuery(updateSql, [targetSlug]);
      dbSuccess = res !== null;
    }

    // 立即重新读取最新数据库统计
    if (dbSuccess) {
      const querySql = targetId
        ? "SELECT id, slug, views, likes FROM posts WHERE id = ? LIMIT 1"
        : "SELECT id, slug, views, likes FROM posts WHERE slug = ? LIMIT 1";
      const rows = await executeQuery<PostRow>(querySql, [targetId || targetSlug]);
      if (rows && rows.length > 0) {
        let msg = "操作成功";
        if (action === "view") msg = "阅读量更新成功";
        else if (action === "unlike") msg = "已取消点赞";
        else msg = "点赞成功";

        return successResponse({
          id: rows[0].id,
          slug: rows[0].slug,
          views: rows[0].views ?? 0,
          likes: rows[0].likes ?? 0,
          action,
        }, msg);
      }
    }

    // 离线开发环境降级
    const local = getLocalStats();
    const cacheKey = targetSlug || (targetId ? `post_id_${targetId}` : "unknown");
    const current = local[cacheKey] || { views: 100, likes: 10 };
    if (action === "view") {
      current.views += 1;
    } else if (action === "unlike") {
      current.likes = Math.max(0, current.likes - 1);
    } else {
      current.likes += 1;
    }
    local[cacheKey] = current;
    saveLocalStats(local);

    return successResponse({
      id: targetId,
      slug: targetSlug,
      views: current.views,
      likes: current.likes,
      action,
    }, action === "unlike" ? "已取消点赞" : "点赞成功");
  } catch (error: any) {
    return errorResponse(error.message, 500, 500);
  }
}