import { NextResponse } from "next/server";
import { getPublicArenaSummary } from "@/lib/quant-arena/arena-store";
import { fetchRealIndicesAndTurnover, getRealMarketSentiment } from "@/lib/quotes-service";

const SUMMARY_TTL_MS = 30 * 1000;
const SUMMARY_STALE_MS = 5 * 60 * 1000;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

let summaryCache: { payload: Record<string, unknown>; expireAt: number; staleUntil: number } | null = null;
let summaryPending: Promise<Record<string, unknown>> | null = null;

async function computePublicSummary(): Promise<Record<string, unknown>> {
  // 并行拉取实盘账户、指数成交额与市场情绪，替代原有串行等待，显著缩短冷启动耗时
  const [arenaResult, snapshotResult, sentimentResult] = await Promise.allSettled([
    getPublicArenaSummary(),
    fetchRealIndicesAndTurnover(),
    getRealMarketSentiment(),
  ]);

  if (arenaResult.status === "rejected") {
    throw arenaResult.reason;
  }
  const arenaSummary = arenaResult.value;

  let turnoverYi: number | null = null;
  let turnoverLabel = "--";
  let upCount: number | null = null;
  let downCount: number | null = null;
  let limitUp: number | null = null;
  let limitDown: number | null = null;
  let leaders: string[] = [];

  if (snapshotResult.status === "fulfilled") {
    const marketSnapshot = snapshotResult.value;
    if (marketSnapshot.total_turnover > 0) {
      turnoverYi = marketSnapshot.total_turnover;
      turnoverLabel =
        marketSnapshot.total_turnover_text ||
        (marketSnapshot.total_turnover >= 10000
          ? `${(marketSnapshot.total_turnover / 10000).toFixed(2)}万亿`
          : `${marketSnapshot.total_turnover.toFixed(0)}亿`);
    }
    if (marketSnapshot.up_count) upCount = marketSnapshot.up_count;
    if (marketSnapshot.down_count) downCount = marketSnapshot.down_count;
  }

  if (sentimentResult.status === "fulfilled" && sentimentResult.value) {
    const sentiment = sentimentResult.value;
    limitUp = sentiment.limit_up_count;
    limitDown = sentiment.limit_down_count;
    if (sentiment.highest_limit_leaders?.length) {
      leaders = sentiment.highest_limit_leaders;
    }
  }

  return {
    success: true,
    market_pulse: {
      state: upCount && downCount ? (upCount > downCount ? "偏多震荡攻坚" : "结构分化整固") : "大盘评估中",
      style: "科技成长 · 核心资产",
      suggested_position: "动态仓位评估",
      turnover_label: turnoverLabel,
      turnover_yi: turnoverYi,
      up_count: upCount,
      down_count: downCount,
      limit_up_count: limitUp,
      limit_down_count: limitDown,
      mainlines: leaders.length > 0 ? leaders : ["热点轮动监测中"],
    },
    strategies: arenaSummary.accounts,
    rankings: arenaSummary.rankings,
    updated_at: arenaSummary.updated_at,
  };
}

function refreshPublicSummary(): Promise<Record<string, unknown>> {
  if (!summaryPending) {
    summaryPending = computePublicSummary()
      .then((payload) => {
        const now = Date.now();
        summaryCache = {
          payload,
          expireAt: now + SUMMARY_TTL_MS,
          staleUntil: now + SUMMARY_STALE_MS,
        };
        return payload;
      })
      .finally(() => {
        summaryPending = null;
      });
  }
  return summaryPending;
}

export async function GET() {
  try {
    const now = Date.now();
    if (summaryCache && summaryCache.expireAt > now) {
      return NextResponse.json(summaryCache.payload, { headers: CACHE_HEADERS });
    }
    if (summaryCache && summaryCache.staleUntil > now) {
      void refreshPublicSummary().catch(() => {});
      return NextResponse.json(summaryCache.payload, { headers: CACHE_HEADERS });
    }

    const payload = await refreshPublicSummary();
    return NextResponse.json(payload, { headers: CACHE_HEADERS });
  } catch (error: unknown) {
    if (summaryCache) {
      return NextResponse.json(summaryCache.payload, { headers: CACHE_HEADERS });
    }
    const message = error instanceof Error ? error.message : "获取公共摘要异常";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
