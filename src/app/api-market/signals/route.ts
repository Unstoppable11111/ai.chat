import { NextResponse } from "next/server";
import { requestOwner } from "@/lib/server-security";
import { readPrivateArena } from "@/lib/private-arena";
import {
  syncArenaAccountsWithRealQuotes,
  getDynamicWatchlist,
} from "@/lib/quant-arena/arena-store";
import { StrategyType, ArenaAccount } from "@/lib/quant-arena/types";
import {
  calculateWinRateStats,
  StockRecommendation,
  PaperAccount,
  AccountStyle,
  TradeEvent,
} from "@/lib/recommendations-db";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const userId = await requestOwner(request);
  const style = (new URL(request.url).searchParams.get("account") || "aggressive") as AccountStyle;
  if (!["aggressive", "balanced", "conservative"].includes(style)) {
    return NextResponse.json({ error: "账户类型无效" }, { status: 400 });
  }

  try {
    // 1. 同步系统三大公有策略账户（保证拥有完整连续的日K蜡烛与真实记账）
    const arenaMap = await syncArenaAccountsWithRealQuotes();

    // 2. 读取用户私有模拟账户 (未登录则直接使用公有策略账户)
    let privateAccounts: ArenaAccount[] = [];
    if (userId) {
      try {
        privateAccounts = await readPrivateArena(userId);
      } catch {
        privateAccounts = [];
      }
    }

    // 若私有账户无完整连续日K（少于15天，存在断档风险），自动将完整连续日K注入保底，绝不留断层
    const hasPrivateData = privateAccounts.some(
      (acc) => (acc.candles && acc.candles.length >= 15) || (acc.positions && acc.positions.length > 0)
    );

    let accounts: PaperAccount[] = [];

    if (hasPrivateData) {
      accounts = privateAccounts.map((account) => {
        const stratKey = (account.account_id || "aggressive") as StrategyType;
        const fallbackItem = arenaMap[stratKey] || arenaMap.aggressive;
        return {
          account_id: account.account_id || "aggressive",
          account_name: account.name,
          style_desc: "个人私有模拟盘",
          initial_capital: account.initial_capital,
          total_equity: account.total_equity,
          cash: account.cash,
          market_value: account.market_value,
          total_pnl: account.total_equity - account.initial_capital,
          total_pnl_pct: account.total_return_pct,
          today_pnl: account.today_pnl,
          today_pnl_pct: account.today_pnl_pct,
          position_ratio_pct: account.current_exposure_pct,
          win_rate: account.win_rate_pct,
          profit_loss_ratio: account.profit_factor,
          completed_trades: account.completed_trades || 0,
          max_drawdown_pct: account.max_drawdown_pct,
          start_date: account.equity_series?.[0]?.date || "09-01",
          rules_desc: "多因子量化风控监控中",
          holdings: (account.positions || []).map((p) => ({
            code: p.code,
            name: p.name,
            shares: p.shares,
            cost_price: p.cost_price,
            current_price: p.current_price ?? p.cost_price,
            market_value: p.market_value,
            pnl: p.pnl,
            pnl_pct: p.pnl_pct,
            stop_loss_price: p.stop_loss_price,
            target_price: p.target_price,
            action: p.pnl_pct >= 8 ? "分批止盈" : p.pnl_pct <= -5 ? "破位止损" : "顺势持有",
            advice_reason: p.strategy_reason,
          })),
          // 关键防护：若私有账户蜡烛天数少于15天，回退使用公有竞技场连续完整日K，彻底解决断档问题
          candles:
            account.candles && account.candles.length >= 15
              ? account.candles
              : fallbackItem?.candles || [],
          events:
            account.candles && account.candles.length >= 15
              ? account.events || []
              : fallbackItem?.candles?.flatMap((c: { events?: TradeEvent[] }) => c.events || []) || [],
        };
      });
    } else {
      // 使用三大专业风格量化账户
      accounts = (["aggressive", "balanced", "conservative"] as const).map((key) => {
        const item = arenaMap[key];
        return {
          account_id: key,
          account_name: item.name,
          style_desc:
            key === "aggressive"
              ? "连板高标接力 · 断板反包 · 退潮100%空仓"
              : key === "balanced"
              ? "GARP成长中军 · 趋势波段 · 回撤控制"
              : "高股息特许垄断 · 现金流压舱石 · 低波吃息",
          initial_capital: item.initial_capital,
          total_equity: item.total_equity,
          cash: item.cash,
          market_value: item.market_value,
          total_pnl: item.total_equity - item.initial_capital,
          total_pnl_pct: item.total_return_pct,
          today_pnl: item.today_pnl,
          today_pnl_pct: item.today_pnl_pct,
          position_ratio_pct: item.current_exposure_pct,
          win_rate: item.win_rate_pct,
          profit_loss_ratio: item.profit_factor,
          completed_trades: item.completed_trades || 0,
          max_drawdown_pct: item.max_drawdown_pct,
          start_date: item.equity_series?.[0]?.date || "09-01",
          rules_desc: "真实会计账本，杜绝指标污染，空仓绝对归零",
          holdings: (item.positions || []).map((p) => ({
            code: p.code,
            name: p.name,
            shares: p.shares,
            cost_price: p.cost_price,
            current_price: p.current_price ?? p.cost_price,
            market_value: p.market_value,
            pnl: p.pnl,
            pnl_pct: p.pnl_pct,
            stop_loss_price: p.stop_loss_price,
            target_price: p.target_price,
            action: p.pnl_pct >= 8 ? "分批止盈" : p.pnl_pct <= -5 ? "破位止损" : "顺势持有",
            advice_reason: p.strategy_reason,
          })),
          candles: item.candles || [],
          events: item.candles?.flatMap((c) => c.events || []) || [],
        };
      });
    }

    const selected = accounts.find((account) => account.account_id === style) || accounts[0];

    // 3. 读取并解析每日金股与历史跟踪全量数据
    const recFile = path.join(process.cwd(), "src", "data", "quant-recommendations.json");
    let allRecommendations: StockRecommendation[] = [];
    if (fs.existsSync(recFile)) {
      try {
        allRecommendations = JSON.parse(fs.readFileSync(recFile, "utf-8"));
      } catch (err) {
        console.error("读取 quant-recommendations.json 失败:", err);
      }
    }

    // 划分最新今日推荐（最新日期）与历史跟踪列表
    const latestDate = allRecommendations.length > 0 ? allRecommendations[0].recommend_date : "2026-09-23";
    const todayPicks = allRecommendations.filter((r) => r.recommend_date === latestDate);
    const history = allRecommendations.filter((r) => r.recommend_date !== latestDate || r.status !== "holding");

    // 计算全局历史推荐胜率与战绩指标
    const stats = calculateWinRateStats(allRecommendations);

    // 4. 获取盘中/盘后动态梯队备选股票池
    const watchlist = getDynamicWatchlist();

    return NextResponse.json(
      {
        success: true,
        today_picks: todayPicks,
        history,
        stats,
        accounts,
        active_account: style,
        paper_account: selected,
        pnl_kline: selected?.candles || [],
        trade_events: selected?.events || [],
        dynamic_watchlist: watchlist[style] || [],
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("处理 signals 接口异常:", err);
    return NextResponse.json({ error: "账户数据暂不可用" }, { status: 503 });
  }
}
