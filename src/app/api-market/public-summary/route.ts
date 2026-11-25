import { NextResponse } from "next/server";
import { fetchRealIndicesAndTurnover, getRealMarketSentiment } from "@/lib/quotes-service";
import { evaluateMarketTrafficLight } from "@/lib/quant-arena/swing-rules";

const SUMMARY_TTL_MS = 30 * 1000;
const SUMMARY_STALE_MS = 5 * 60 * 1000;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

let summaryCache: { payload: Record<string, unknown>; expireAt: number; staleUntil: number } | null = null;
let summaryPending: Promise<Record<string, unknown>> | null = null;

async function computePublicSummary(): Promise<Record<string, unknown>> {
  const [snapshotResult, sentimentResult] = await Promise.allSettled([
    fetchRealIndicesAndTurnover(),
    getRealMarketSentiment(),
  ]);

  let turnoverYi: number | null = null;
  let turnoverLabel = "--";
  let upCount: number | null = null;
  let downCount: number | null = null;
  let limitUp: number | null = null;
  let limitDown: number | null = null;
  let brokenRatio: number | null = null;
  let sentimentTemp: number | null = null;
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
    brokenRatio = sentiment.broken_limit_ratio;
    sentimentTemp = sentiment.sentiment_temperature;
    if (sentiment.highest_limit_leaders?.length) {
      leaders = sentiment.highest_limit_leaders;
    }
  }

  const trafficLight = evaluateMarketTrafficLight(sentimentTemp);

  return {
    success: true,
    market_pulse: {
      state: trafficLight.label,
      style: "沪深主板 + 创业板 · 科技波段",
      suggested_position:
        trafficLight.light === "RED"
          ? "防守 ≤30%"
          : trafficLight.light === "YELLOW"
          ? "均衡 40%~60%"
          : "积极 65%~85%",
      turnover_label: turnoverLabel,
      turnover_yi: turnoverYi,
      up_count: upCount,
      down_count: downCount,
      limit_up_count: limitUp,
      limit_down_count: limitDown,
      broken_ratio: brokenRatio,
      traffic_light: trafficLight,
      mainlines: leaders.length > 0 ? leaders : ["科技产业链主线追踪中"],
    },
    updated_at: new Date().toISOString(),
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
