import { NextResponse } from "next/server";
import { initializePrivateArena, readPrivateArena, recordPaperTrade, type RecordedTrade } from "@/lib/private-arena";
import { readJsonBody, requestOwner, sameOrigin } from "@/lib/server-security";

export async function GET(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  try {
    const accounts = Object.fromEntries((await readPrivateArena(userId)).map(account=>[account.id,account]));
    return NextResponse.json({ success: true, accounts, regime: null, rankings: [], experiment: null, benchmarks: null, last_updated: null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "模拟账户暂时不可用" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "请求来源不受信任" }, { status: 403 });
  try {
    const body = await readJsonBody(request, 1024);
    if (body.action === "trade") {
      if (!["aggressive","balanced","conservative"].includes(String(body.strategy)) || !["BUY","SELL"].includes(String(body.side)) || !/^\d{6}$/.test(String(body.code)) || typeof body.price!=="number" || !Number.isFinite(body.price) || body.price<=0 || body.price>1e6 || typeof body.quantity!=="number" || !Number.isSafeInteger(body.quantity) || body.quantity<=0 || body.quantity>1e9 || typeof body.requestKey!=="string" || !/^[a-f0-9-]{36}$/.test(body.requestKey)) return NextResponse.json({error:"模拟交易参数不正确"},{status:400});
      const accounts=await recordPaperTrade(userId,body as RecordedTrade);
      return NextResponse.json({success:true,accounts:Object.fromEntries(accounts.map(account=>[account.id,account]))});
    }
    if (body.action !== "initialize") return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
    return NextResponse.json({ success: true, accounts: await initializePrivateArena(userId) });
  } catch (error) {
    const message=error instanceof Error?error.message:"";
    const validation=/^(买入数量|模拟资金|模拟持仓|可卖数量|零股)/.test(message);
    return NextResponse.json({ success: false, error: validation?message:"保存失败，请稍后重试" }, { status: validation?400:503 });
  }
}
