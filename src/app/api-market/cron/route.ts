import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { readJsonBody, requestOwner, sameOrigin } from "@/lib/server-security";
import {
  runIntradayTickJob,
  runPostmarketJob,
  runPremarketJob,
} from "@/lib/market-scheduler";

function hasValidCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || token.length !== secret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const isCron = hasValidCronSecret(request);
  let targetUserId: string | undefined;

  if (!isCron) {
    if (!sameOrigin(request)) {
      return NextResponse.json({ success: false, error: "请求来源不允许" }, { status: 403 });
    }
    const userId = await requestOwner(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    targetUserId = userId;
  }

  try {
    const body = await readJsonBody(request, 4096).catch(() => ({} as Record<string, unknown>));
    const job = String(body.job || "intraday");
    const force = Boolean(body.force ?? !isCron);

    if (job === "premarket") {
      const res = await runPremarketJob({ targetUserId, force });
      return NextResponse.json({ success: true, job, ...res });
    }
    if (job === "intraday") {
      const res = await runIntradayTickJob({ targetUserId, force });
      return NextResponse.json({ success: true, job, ...res });
    }
    if (job === "postmarket") {
      const res = await runPostmarketJob({ targetUserId, force });
      return NextResponse.json({ success: true, job, ...res });
    }

    return NextResponse.json({ success: false, error: "未知任务类型" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "任务执行失败" },
      { status: 500 }
    );
  }
}
