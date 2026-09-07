import { NextResponse } from "next/server";
import { getRecommendations, calculateWinRate, getPaperTradingData } from "@/lib/recommendations-db";

export async function GET() {
  try {
    const all = await getRecommendations();
    const stats = calculateWinRate(all);
    const paper = getPaperTradingData(all);

    const todayStr = "2026-09-07";
    const todayPicks = all.filter((item) => item.recommend_date === todayStr);
    const history = all.filter((item) => item.recommend_date !== todayStr);

    return NextResponse.json({
      success: true,
      today_picks: todayPicks.length > 0 ? todayPicks : all.slice(0, 3),
      history: history.length > 0 ? history : all.slice(3),
      stats,
      paper_account: paper.paper_account,
      pnl_kline: paper.pnl_kline,
      trade_events: paper.trade_events,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "获取量化金股与胜率失败",
      },
      { status: 500 }
    );
  }
}
