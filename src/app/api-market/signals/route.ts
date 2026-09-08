import { NextRequest, NextResponse } from "next/server";
import { getRecommendations, calculateWinRate, getPaperTradingData } from "@/lib/recommendations-db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountStyle = searchParams.get("account") || "aggressive";

    const all = await getRecommendations();
    const stats = calculateWinRate(all);
    const paper = await getPaperTradingData(all, accountStyle);

    const todayStr = "2026-09-07";
    const todayPicks = all.filter((item) => item.recommend_date === todayStr);
    const history = all.filter((item) => item.recommend_date !== todayStr);

    return NextResponse.json({
      success: true,
      today_picks: todayPicks.length > 0 ? todayPicks : all.slice(0, 4),
      history: history.length > 0 ? history : all.slice(4),
      stats,
      accounts: paper.accounts,
      active_account: paper.active_account,
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
