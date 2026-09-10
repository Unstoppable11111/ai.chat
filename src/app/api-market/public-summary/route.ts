import { NextResponse } from "next/server";
import { getPublicArenaSummary } from "@/lib/quant-arena/arena-store";
import { fetchRealIndicesAndTurnover, getRealMarketSentiment } from "@/lib/quotes-service";

export async function GET() {
  try {
    const arenaSummary = await getPublicArenaSummary();

    let turnoverYi: number | null = null;
    let turnoverLabel = "--";
    let upCount: number | null = null;
    let downCount: number | null = null;
    let limitUp: number | null = null;
    let limitDown: number | null = null;
    let leaders: string[] = [];

    try {
      const marketSnapshot = await fetchRealIndicesAndTurnover();
      if (marketSnapshot.total_turnover > 0) {
        turnoverYi = marketSnapshot.total_turnover;
        turnoverLabel = marketSnapshot.total_turnover_text || (
          marketSnapshot.total_turnover >= 10000 
            ? `${(marketSnapshot.total_turnover / 10000).toFixed(2)}万亿`
            : `${marketSnapshot.total_turnover.toFixed(0)}亿`
        );
      }
      if (marketSnapshot.up_count) upCount = marketSnapshot.up_count;
      if (marketSnapshot.down_count) downCount = marketSnapshot.down_count;
    } catch {
      // 容错
    }

    try {
      const sentiment = await getRealMarketSentiment();
      if (sentiment) {
        limitUp = sentiment.limit_up_count;
        limitDown = sentiment.limit_down_count;
        if (sentiment.highest_limit_leaders?.length) {
          leaders = sentiment.highest_limit_leaders;
        }
      }
    } catch {
      // 容错
    }

    return NextResponse.json({
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
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "获取公共摘要异常";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
