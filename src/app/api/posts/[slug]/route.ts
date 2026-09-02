import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

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

    const rows = await executeQuery<PostRow>(
      "SELECT id, slug, title, views, likes FROM posts WHERE slug = ? LIMIT 1",
      [slug]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ views: 0, likes: 0 });
    }

    return NextResponse.json({
      views: rows[0].views || 0,
      likes: rows[0].likes || 0,
    });
  } catch (error) {
    console.error("[Post Stats API Error]:", error);
    return NextResponse.json({ views: 0, likes: 0 }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || "view";
    const title = body.title || slug;
    const collection = body.collection || "build-log";

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    if (action === "like") {
      await executeQuery(
        `INSERT INTO posts (slug, collection, title, views, likes) 
         VALUES (?, ?, ?, 0, 1) 
         ON DUPLICATE KEY UPDATE likes = likes + 1`,
        [slug, collection, title]
      );
    } else {
      await executeQuery(
        `INSERT INTO posts (slug, collection, title, views, likes) 
         VALUES (?, ?, ?, 1, 0) 
         ON DUPLICATE KEY UPDATE views = views + 1`,
        [slug, collection, title]
      );
    }

    const updated = await executeQuery<PostRow>(
      "SELECT views, likes FROM posts WHERE slug = ? LIMIT 1",
      [slug]
    );

    return NextResponse.json({
      success: true,
      views: updated?.[0]?.views ?? 0,
      likes: updated?.[0]?.likes ?? 0,
    });
  } catch (error) {
    console.error("[Post Stats Update Error]:", error);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}
