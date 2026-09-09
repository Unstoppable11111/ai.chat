import { NextResponse } from "next/server";
import { executeQuery, executeWrite } from "@/lib/db";
import { readJsonBody, requestOwner, sameOrigin, takeQuota } from "@/lib/server-security";
import { getUserHoldings } from "@/lib/portfolio-db";

export async function GET(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const type = new URL(request.url).searchParams.get("type") || "morning";
  if (!["morning", "closing"].includes(type)) return NextResponse.json({ error: "报告类型无效" }, { status: 400 });
  try {
    const rows = await executeQuery<{ id: number; payload: string | object }>("SELECT id,payload FROM user_research_reports WHERE user_id=? AND report_type=? ORDER BY report_date DESC,id DESC LIMIT 8", [userId, type]);
    if (!rows) throw new Error("Database unavailable");
    const history = rows.map(row => ({ ...(typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload), id: row.id }));
    return NextResponse.json({ success: true, latest: history[0] || null, history, records: [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "报告暂时不可用" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "请求来源不受信任" }, { status: 403 });
  try {
    const body = await readJsonBody(request, 2048);
    const type = body.type || "morning";
    if (type !== "morning" && type !== "closing") return NextResponse.json({ error: "报告类型无效" }, { status: 400 });
    if (!await takeQuota(`report:${userId}`, 10, 3600000)) return NextResponse.json({ error: "生成过于频繁" }, { status: 429 });
    const holdings = await getUserHoldings(userId);
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
    const lines = holdings.map(item => `| ${item.stock_code} | ${item.quantity} | ${Number(item.cost_price).toFixed(3)} |`);
    const report = {
      report_type: type, report_date: date, title: `${date} 个人持仓记录`,
      summary: `已记录 ${holdings.length} 项持仓。此记录不包含行情估值或投资建议。`,
      content_md: `## 持仓快照\n\n| 证券代码 | 数量 | 录入成本 |\n| --- | ---: | ---: |\n${lines.join("\n")}\n\n## 数据边界\n\n数据来自本账户手动录入；未核验交易流水，未据此生成盈利预测、投资评级或后续验证结果。`,
      snapshot_json: { holdings, captured_at: new Date().toISOString() }, created_at: new Date().toISOString(),
    };
    await executeWrite("INSERT INTO user_research_reports (user_id,report_type,report_date,payload) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload)", [userId, type, date, JSON.stringify(report)]);
    return NextResponse.json({ success: true, report, records: [] });
  } catch { return NextResponse.json({ error: "生成失败，请稍后重试" }, { status: 503 }); }
}
