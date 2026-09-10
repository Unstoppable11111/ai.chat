import { NextResponse } from "next/server";
import { getPublicArenaSummary } from "@/lib/quant-arena/arena-store";
import { fetchRealIndicesAndTurnover, getRealMarketSentiment } from "@/lib/quotes-service";

export async function GET() {
  try {
    const arenaSummary = await getPublicArenaSummary();

    let turnoverYi = 19200;
    let turnoverLabel = "1.92万亿";
    let upCount = 3305;
    let downCount = 1877;
    let limitUp = 73;
    let limitDown = 0;

    try {
      const marketSnapshot = await fetchRealIndicesAndTurnover();
      if (marketSnapshot.total_turnover > 0) {
        turnoverYi = marketSnapshot.total_turnover;
        turnoverLabel = marketSnapshot.total_turnover >= 10000 
          ? `${(marketSnapshot.total_turnover / 10000).toFixed(2)}万亿`
          : `${marketSnapshot.total_turnover.toFixed(0)}亿`;
      }
      if (marketSnapshot.up_count) upCount = marketSnapshot.up_count;
      if (marketSnapshot.down_count) downCount = marketSnapshot.down_count;
    } catch {
      // 容错
    }

    try {
      const sentiment = await getRealMarketSentiment();
      if (sentiment?.limit_up_count) limitUp = sentiment.limit_up_count;
      if (sentiment?.limit_down_count) limitDown = sentiment.limit_down_count;
    } catch {
      // 容错
    }

    return NextResponse.json({
      success: true,
      market_pulse: {
        state: "主升攻坚",
        style: "科技成长 · 游资龙头",
        suggested_position: "65%~85%",
        turnover_label: turnoverLabel,
        turnover_yi: turnoverYi,
        up_count: upCount,
        down_count: downCount,
        limit_up_count: limitUp,
        limit_down_count: limitDown,
        mainlines: ["CPO光模块", "连板龙头", "半导体中军"],
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
