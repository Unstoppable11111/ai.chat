import { NextResponse } from "next/server";
import { getUserHoldings, addUserHolding, updateUserHolding, deleteUserHolding, type UserHolding } from "@/lib/portfolio-db";
import { readJsonBody, requestOwner, sameOrigin } from "@/lib/server-security";

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });
const positiveId = (value: unknown) => Number.isSafeInteger(Number(value)) && Number(value) > 0;
function validateFields(body: Record<string, unknown>, partial = false) {
  const patch: Partial<UserHolding> = {};
  if (!partial || body.quantity !== undefined) {
    const value = Number(body.quantity);
    if (!Number.isSafeInteger(value) || value <= 0 || value > 1e9) throw new Error("数量必须为有效正整数");
    patch.quantity = value;
  }
  if (!partial || body.cost_price !== undefined) {
    const value = Number(body.cost_price);
    if (!Number.isFinite(value) || value <= 0 || value > 1e6) throw new Error("成本价必须为有效正数");
    patch.cost_price = value;
  }
  if (!partial || body.hold_type !== undefined) {
    if (!["core", "trend", "attack", "trial"].includes(String(body.hold_type))) throw new Error("持仓类型不正确");
    patch.hold_type = body.hold_type as UserHolding["hold_type"];
  }
  for (const field of ["stock_name", "notes"] as const) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string" || body[field].length > (field === "notes" ? 2000 : 64)) throw new Error("名称或备注长度不正确");
      patch[field] = body[field].trim();
    }
  }
  return patch;
}
export async function GET(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);
  try {
    const rawHoldings = await getUserHoldings(userId);
    let diagnose: { data_status?: string } | null = null;
    try {
      const response = await fetch(`${process.env.QUANT_API_URL || "http://127.0.0.1:8100"}/api/v1/portfolio/diagnose`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(8000), cache: "no-store", body: JSON.stringify({ user_id: userId, holdings: rawHoldings.map(h => ({ ...h, code: h.stock_code, name: h.stock_name })) }) });
      if (response.ok) diagnose = await response.json();
    } catch { /* Holdings remain readable when quotes are unavailable. */ }
    return NextResponse.json({ success: true, raw_holdings: rawHoldings, diagnose, is_live: diagnose?.data_status === "REALTIME", data_status: diagnose?.data_status || "UNAVAILABLE" }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return fail("持仓存储不可用，请稍后重试", 503); }
}
export async function POST(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);
  if (!sameOrigin(request)) return fail("请求来源不允许", 403);
  let item;
  try {
    const body = await readJsonBody(request, 8192);
    const code = String(body.stock_code || "").trim();
    if (!/^\d{6}$/.test(code)) return fail("股票代码必须为6位数字", 400);
    const patch = validateFields(body);
    item = { stock_code: code, stock_name: patch.stock_name || code, quantity: patch.quantity!, cost_price: patch.cost_price!, hold_type: patch.hold_type!, notes: patch.notes || "" };
  } catch (error) { return fail(error instanceof Error ? error.message : "参数不正确", 400); }
  try { return NextResponse.json({ success: true, item: await addUserHolding(userId, item) }, { status: 201 }); }
  catch { return fail("保存失败，数据未写入，请稍后重试", 503); }
}
export async function PUT(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);
  if (!sameOrigin(request)) return fail("请求来源不允许", 403);
  let id: number, patch: Partial<UserHolding>;
  try {
    const body = await readJsonBody(request, 8192);
    if (!positiveId(body.id)) return fail("持仓 ID 不正确", 400);
    id = Number(body.id); patch = validateFields(body, true);
    if (!Object.keys(patch).length) return fail("没有可更新的字段", 400);
  } catch (error) { return fail(error instanceof Error ? error.message : "参数不正确", 400); }
  try { return await updateUserHolding(id, userId, patch) ? NextResponse.json({ success: true }) : fail("持仓不存在", 404); }
  catch { return fail("更新失败，请稍后重试", 503); }
}
export async function DELETE(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);
  if (!sameOrigin(request)) return fail("请求来源不允许", 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!positiveId(id)) return fail("持仓 ID 不正确", 400);
  try { return await deleteUserHolding(Number(id), userId) ? NextResponse.json({ success: true }) : fail("持仓不存在", 404); }
  catch { return fail("删除失败，请稍后重试", 503); }
}
