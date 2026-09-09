import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import { readJsonBody, sameOrigin, clientKey, takeQuota } from "@/lib/server-security";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "请求来源不允许" }, { status: 403 });
  const db = getDbPool();
  if (!db) return NextResponse.json({ error: "统计暂时不可用" }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await readJsonBody(request, 2048); }
  catch { return NextResponse.json({ error: "请求无效" }, { status: 400 }); }
  if (typeof body.slug !== "string" || body.slug.length > 191 || !["view", "like", "unlike"].includes(String(body.action))) return NextResponse.json({ error: "请求无效" }, { status: 400 });
  let connection;
  try {
    if (!await takeQuota(`reactions:${clientKey(request)}`, 60, 60000)) return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
    const existing = request.headers.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith("studio_visitor="))?.slice(15);
    const visitor = existing && /^[a-f0-9]{48}$/.test(existing) ? existing : randomBytes(24).toString("hex");
    const hash = createHash("sha256").update(visitor).digest("hex");
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>("SELECT id,slug,views,likes FROM posts WHERE slug=? AND status='published' FOR UPDATE", [body.slug]);
    if (!rows.length) { await connection.rollback();return NextResponse.json({ error: "文章不存在" }, { status: 404 }); }
    const post = rows[0];
    await connection.execute("INSERT IGNORE INTO post_reactions(post_id,visitor_hash) VALUES(?,?)", [post.id,hash]);
    const [states] = await connection.execute<RowDataPacket[]>("SELECT liked,viewed_at,viewed_at IS NULL OR viewed_at<DATE_SUB(NOW(),INTERVAL 1 DAY) AS count_view FROM post_reactions WHERE post_id=? AND visitor_hash=?", [post.id,hash]);
    const state = states[0]; let liked = Boolean(state.liked);
    if (body.action === "view" && state.count_view) {
      post.views++;await connection.execute("UPDATE post_reactions SET viewed_at=NOW() WHERE post_id=? AND visitor_hash=?", [post.id,hash]);
    } else if (body.action !== "view") {
      const desired = body.action === "like";
      post.likes = Math.max(0,Number(post.likes)+Number(desired)-Number(liked));liked=desired;
      await connection.execute("UPDATE post_reactions SET liked=? WHERE post_id=? AND visitor_hash=?", [liked,post.id,hash]);
    }
    await connection.execute("UPDATE posts SET views=?,likes=?,updated_at=updated_at WHERE id=?", [post.views,post.likes,post.id]);
    await connection.commit();
    const response=NextResponse.json({ success:true,data:{id:post.id,views:post.views,likes:post.likes,liked} },{headers:{"Cache-Control":"private, no-store"}});
    response.cookies.set("studio_visitor",visitor,{httpOnly:true,sameSite:"lax",secure:process.env.COOKIE_SECURE!=="false"&&process.env.NODE_ENV==="production",maxAge:31536000,path:"/"});
    return response;
  } catch { await connection?.rollback();return NextResponse.json({ error:"统计暂时不可用" },{status:503}); }
  finally { connection?.release(); }
}
