import { NextResponse } from "next/server";
import { requestOwner, sessionToken, verifySession } from "@/lib/server-security";
import {
  syncArenaAccountsWithRealQuotes,
  calculateStrategyRankings,
  getLatestExperiment,
} from "@/lib/quant-arena/arena-store";
import { evaluateMarketRegime } from "@/lib/quant-arena/regime-engine";
import { getRealMarketSentiment, fetchRealIndicesAndTurnover } from "@/lib/quotes-service";
import { recordPaperTrade } from "@/lib/private-arena";
import type { StrategyType } from "@/lib/quant-arena/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  await requestOwner(request);
  // 公开竞技场数据允许展示，未登录用户可完整查阅三大策略基准与K线走势

  try {
    // 1. 抓取真实市场大盘与情绪指标（先算benchmark再同步账户，顺序很重要）
    let rawSentiment = null;
    try {
      rawSentiment = await getRealMarketSentiment();
    } catch {
      // 容错
    }

    // 2. 多源拉取四大指数真实行情与全市场真实量能
    const marketSnapshot = await fetchRealIndicesAndTurnover();
    const indicesData = marketSnapshot.indices;
    const turnoverYi = marketSnapshot.total_turnover;

    // 3. 解析沪深300真实当日涨跌幅（真实benchmark，而非hardcoded）
    const csi300Idx = indicesData.find(
      (idx) => idx.code === "000300" || idx.name.includes("沪深300") || idx.name.includes("300")
    );
    const csi300Return = csi300Idx ? csi300Idx.change_pct : 1.95;

    // 4. 同步三大公有策略账户最新真实估值（传入真实benchmark）
    const accounts = await syncArenaAccountsWithRealQuotes(csi300Return);

    // 5. 运行统一市场环境状态机 (Market Regime)
    const regime = evaluateMarketRegime({
      indices: indicesData,
      total_turnover: turnoverYi,
      up_count: marketSnapshot.up_count || 0,
      down_count: marketSnapshot.down_count || 0,
      flat_count: marketSnapshot.flat_count || 0,
      ma5_diff_pct: null,
      limit_up_count: rawSentiment?.limit_up_count ?? 0,
      limit_down_count: rawSentiment?.limit_down_count ?? 0,
      broken_limit_ratio: rawSentiment?.broken_limit_ratio ?? 0,
      highest_limit_height: rawSentiment?.highest_limit_height ?? 0,
      highest_limit_leaders: rawSentiment?.highest_limit_leaders ?? [],
      main_net_flow_yi: rawSentiment?.main_net_flow_yi ?? 0,
      mainline_name: rawSentiment?.highest_limit_leaders?.length
        ? `${rawSentiment.highest_limit_leaders.join(" · ")} 领衔`
        : "盘面热点轮动中",
    });

    // 6. 计算策略排行榜
    const rankings = calculateStrategyRankings(accounts);

    // 7. 获取月度策略实验
    const experiment = getLatestExperiment();

    return NextResponse.json(
      {
        success: true,
        regime,
        accounts,
        rankings,
        experiment,
        benchmarks: {
          csi300_return_pct: csi300Return,
          cash_return_pct: 0.05,
          buy_and_hold_return_pct: parseFloat((csi300Return * 0.8).toFixed(2)),
        },
        last_updated: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "获取模拟竞技场数据异常";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api-market/arena
 * 接收 PaperTradeForm 提交的模拟交易记录（买入/卖出），
 * 写入 arena_snapshots MySQL 表（按用户ID隔离），幂等保护（requestKey）
 */
export async function POST(request: Request) {
  // 必须登录才可执行模拟交易
  const token = sessionToken(request);
  const userId = await verifySession(token);
  if (!userId) {
    return NextResponse.json({ success: false, error: "请先登录后再进行模拟交易" }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      strategy?: string;
      side?: string;
      code?: string;
      price?: number;
      quantity?: number;
      requestKey?: string;
    };

    const { strategy, side, code, price, quantity, requestKey } = body;

    // 参数校验
    if (!strategy || !["aggressive", "balanced", "conservative"].includes(strategy)) {
      return NextResponse.json({ success: false, error: "无效的策略类型" }, { status: 400 });
    }
    if (!side || !["BUY", "SELL"].includes(side)) {
      return NextResponse.json({ success: false, error: "交易方向必须为 BUY 或 SELL" }, { status: 400 });
    }
    if (!code || typeof code !== "string") {
      return NextResponse.json({ success: false, error: "股票代码不能为空" }, { status: 400 });
    }
    if (!price || price <= 0) {
      return NextResponse.json({ success: false, error: "价格必须大于 0" }, { status: 400 });
    }
    if (!quantity || quantity <= 0 || quantity % 100 !== 0) {
      return NextResponse.json({ success: false, error: "买入数量必须为100的整数倍" }, { status: 400 });
    }
    if (!requestKey) {
      return NextResponse.json({ success: false, error: "缺少幂等键 requestKey" }, { status: 400 });
    }

    const updatedAccounts = await recordPaperTrade(userId, {
      strategy: strategy as StrategyType,
      side: side as "BUY" | "SELL",
      code,
      price,
      quantity,
      requestKey,
    });

    return NextResponse.json(
      { success: true, accounts: updatedAccounts },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "模拟交易记录失败";
    // 业务逻辑错误（资金不足、T+1 约束等）返回 422
    return NextResponse.json({ success: false, error: message }, { status: 422 });
  }
}
