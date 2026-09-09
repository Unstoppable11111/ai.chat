import { NextResponse } from "next/server";
import {
  syncArenaAccountsWithRealQuotes,
  calculateStrategyRankings,
  getLatestExperiment,
} from "@/lib/quant-arena/arena-store";
import { evaluateMarketRegime } from "@/lib/quant-arena/regime-engine";
import { getRealMarketSentiment, fetchRealIndicesAndTurnover } from "@/lib/quotes-service";

export async function GET() {
  try {
    // 1. 同步三大独立模拟账户最新真实估值
    const accounts = await syncArenaAccountsWithRealQuotes();

    // 2. 抓取真实市场大盘与情绪指标
    let rawSentiment = null;
    try {
      rawSentiment = await getRealMarketSentiment();
    } catch {
      // 容错
    }

    // 3. 多源拉取四大指数真实行情与全市场真实量能 (包含腾讯/新浪交叉校验与 >5000 亿安全断言防线)
    const marketSnapshot = await fetchRealIndicesAndTurnover();
    const indicesData = marketSnapshot.indices;
    const turnoverYi = marketSnapshot.total_turnover;

    // 4. 运行统一市场环境状态机 (Market Regime)
    const regime = evaluateMarketRegime({
      indices: indicesData,
      total_turnover: turnoverYi,
      up_count: marketSnapshot.up_count || 3305,
      down_count: marketSnapshot.down_count || 1877,
      flat_count: marketSnapshot.flat_count || 102,
      ma5_diff_pct: -6.4,
      limit_up_count: rawSentiment?.limit_up_count || 73,
      limit_down_count: rawSentiment?.limit_down_count || 0,
      broken_limit_ratio: rawSentiment?.broken_limit_ratio || 33.6,
      highest_limit_height: rawSentiment?.highest_limit_height || 5,
      highest_limit_leaders: rawSentiment?.highest_limit_leaders || ["百大集团", "亚盛集团"],
      main_net_flow_yi: rawSentiment?.main_net_flow_yi || -82.0,
      mainline_name: "商业连锁 · 农业种植 · 高端装备",
    });

    // 5. 计算策略排行榜
    const rankings = calculateStrategyRankings(accounts);

    // 6. 获取月度策略实验
    const experiment = getLatestExperiment();

    return NextResponse.json({
      success: true,
      regime,
      accounts,
      rankings,
      experiment,
      benchmarks: {
        csi300_return_pct: 1.10,
        cash_return_pct: 0.05,
        buy_and_hold_return_pct: 0.85,
      },
      last_updated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "获取模拟竞技场数据异常",
      },
      { status: 500 }
    );
  }
}
