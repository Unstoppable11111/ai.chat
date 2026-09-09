import { NextResponse } from "next/server";
import { executeQuery, executeWrite } from "@/lib/db";
import { readJsonBody, requestOwner, sameOrigin } from "@/lib/server-security";

export async function GET(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  try {
    const rows = await executeQuery<{ history: unknown }>("SELECT history FROM user_chat_histories WHERE user_id=?", [userId]);
    return NextResponse.json({ history: rows?.[0]?.history || null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "历史记录不可用" }, { status: 503 }); }
}
export async function PUT(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "请求来源不受信任" }, { status: 403 });
  try {
    const body = await readJsonBody(request, 1000000);
    if (typeof body.current !== "string" || !Array.isArray(body.threads) || !body.threads.length || body.threads.length > 10) throw new Error("Invalid history");
    for (const thread of body.threads) {
      if (!thread || typeof thread.id !== "string" || thread.id.length > 100 || typeof thread.title !== "string" || thread.title.length > 100 || !Array.isArray(thread.messages) || thread.messages.length > 30) throw new Error("Invalid thread");
      for (const message of thread.messages) if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string" || message.content.length > 50000) throw new Error("Invalid message");
    }
    if (!body.threads.some(thread => thread.id === body.current)) throw new Error("Invalid current thread");
    await executeWrite("INSERT INTO user_chat_histories(user_id,history) VALUES(?,?) ON DUPLICATE KEY UPDATE history=VALUES(history)", [userId, JSON.stringify({ current: body.current, threads: body.threads })]);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "历史记录保存失败" }, { status: 400 }); }
}
