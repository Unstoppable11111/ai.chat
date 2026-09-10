import { NextResponse } from "next/server";
import { fetchRealIndicesAndTurnover, getRealMarketSentiment } from "@/lib/quotes-service";
import { checkAShareTradingTime } from "@/lib/trading-hours";

export async function GET() {
  try {
    const tradingStatus = checkAShareTradingTime();
    const isTradingHours = tradingStatus.isTrading;

    const [realSentiment, directData] = await Promise.all([
      getRealMarketSentiment().catch(() => null),
      fetchRealIndicesAndTurnover().catch(() => null),
    ]);

    if (!directData || !directData.indices || directData.indices.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data_status: "UPSTREAM_UNAVAILABLE",
          error: "行情数据接口未响应，全景量能与大盘综合分析暂不可用",
          indices: [],
        },
        { status: 503 }
      );
    }

    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const bjDate = new Date(utc + 3600000 * 8);
    const dateStr = bjDate.toISOString().slice(0, 10);
    const timeStr = bjDate.toTimeString().slice(0, 8);

    const totalTurnover = directData.total_turnover;
    const totalTurnoverText = directData.total_turnover_text;
    const upCount = directData.up_count || 0;
    const downCount = directData.down_count || 0;
    const flatCount = directData.flat_count || 0;

    const volumeMetrics = {
      today: totalTurnover,
      volume_ma5: null,
      volume_ma20: null,
      diff_ma5_pct: null,
      percentile: null,
      is_trading_hours: isTradingHours,
      status_label: isTradingHours ? "盘中交投动态累积中" : "收盘量能锁定",
      status_detail: isTradingHours 
        ? "盘中交投动态累积中，收盘后锁定全日量能" 
        : `今日两市总成交额 ${totalTurnoverText}`,
      series: totalTurnover > 0 ? [{ date: dateStr.slice(5), turnover: totalTurnover }] : [],
    };

    // 动态评估市场得分与定性
    let marketState = "震荡分化整固";
    let marketScore = 55.0;
    const totalBreadth = upCount + downCount;
    if (totalBreadth > 0) {
      const upRatio = upCount / totalBreadth;
      if (upRatio >= 0.7 && (realSentiment?.limit_up_count ?? 0) >= 40) {
        marketState = "极强普涨主升";
        marketScore = 85.0;
      } else if (upRatio >= 0.55) {
        marketState = "偏多震荡攻坚";
        marketScore = 70.0;
      } else if (upRatio <= 0.3) {
        marketState = "短线退潮分化";
        marketScore = 38.0;
      } else {
        marketState = "多空结构博弈";
        marketScore = 52.0;
      }
    }

    const leadersList = realSentiment?.highest_limit_leaders || [];
    const marketStyle = leadersList.length > 0 
      ? `${leadersList.slice(0, 3).join(" · ")} 领涨`
      : "科技成长 · 结构轮动";

    return NextResponse.json({
      success: true,
      market_date: dateStr,
      snapshot_time: timeStr,
      market_score: marketScore,
      market_state: marketState,
      market_style: marketStyle,
      suggested_position: marketScore >= 70 ? "70%~90%" : marketScore >= 50 ? "50%~70%" : "30%~50%",
      confidence: "high",
      indices: directData.indices,
      total_turnover: totalTurnover,
      total_turnover_text: totalTurnoverText,
      up_count: upCount,
      down_count: downCount,
      flat_count: flatCount,
      volume_metrics: volumeMetrics,
      sentiment_metrics: realSentiment,
      is_trading_hours: isTradingHours,
      last_updated: `${dateStr} ${timeStr}`,
      is_live_service: true,
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "行情服务异常";
    return NextResponse.json(
      {
        success: false,
        data_status: "ERROR",
        error: `行情数据接口连接异常(${msg})，暂无法生成全景指标`,
        indices: [],
      },
      { status: 500 }
    );
  }
}
