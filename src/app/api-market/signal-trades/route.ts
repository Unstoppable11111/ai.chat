import { NextResponse } from "next/server";
import { readJsonBody, requestOwner, sameOrigin } from "@/lib/server-security";
import {
  closeSignalPaperTrade,
  computeSignalWinRateStats,
  listUserSignalTrades,
  syncUserSignalPaperTrades,
} from "@/lib/signal-paper-db";
import { listUserRollingPool } from "@/lib/rolling-pool-db";
import {
  fetchAllSectorsList,
  fetchStockDailyKline,
  getRealMarketSentiment,
  getRealStockQuotes,
} from "@/lib/quotes-service";
import {
  computeStockTechnicals,
  evaluateMarketTrafficLight,
  evaluateWatchlistSwingSignals,
  type SwingLiveQuote,
} from "@/lib/quant-arena/swing-rules";
import { findSectorPerformance, resolveStockSector } from "@/lib/quant-arena/holding-ai-advisor";

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });

export async function GET(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);

  try {
    const url = new URL(request.url);
    const klineCode = url.searchParams.get("kline_code")?.replace(/^(sh|sz|bj)/i, "").trim();

    if (klineCode && /^\d{6}$/.test(klineCode)) {
      const [bars, quotes, stockTrades] = await Promise.all([
        fetchStockDailyKline(klineCode, 95),
        getRealStockQuotes([klineCode]),
        listUserSignalTrades(userId, klineCode),
      ]);
      const q = quotes[klineCode];
      const list = [...bars];
      if (q && q.current_price > 0 && list.length > 0) {
        const qDate = q.timestamp ? q.timestamp.slice(0, 10) : "";
        const last = list[list.length - 1];
        if (qDate && qDate > last.date) {
          list.push({
            date: qDate,
            open: q.open || q.current_price,
            close: q.current_price,
            high: q.high || q.current_price,
            low: q.low || q.current_price,
            volume: q.volume || 0,
          });
        } else {
          list[list.length - 1] = {
            ...last,
            close: q.current_price,
            high: Math.max(last.high, q.high || q.current_price),
            low: Math.min(last.low, q.low || q.current_price),
            volume: q.volume > 0 ? q.volume : last.volume,
          };
        }
      }

      const recentBars = list.slice(-70).map((b, idx, arr) => {
        const fullIdx = list.length - arr.length + idx;
        const avg = (n: number) => {
          if (fullIdx + 1 < n) return null;
          let s = 0;
          for (let i = fullIdx - n + 1; i <= fullIdx; i++) s += list[i].close;
          return Number((s / n).toFixed(2));
        };
        return {
          ...b,
          ma5: avg(5),
          ma10: avg(10),
          ma20: avg(20),
        };
      });

      return NextResponse.json(
        {
          success: true,
          code: klineCode,
          quote: q || null,
          bars: recentBars,
          trades: stockTrades,
        },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const trades = await listUserSignalTrades(userId);
    const openCodes = [...new Set(trades.filter((t) => t.status === "OPEN").map((t) => t.stock_code))];
    const quotes = openCodes.length ? await getRealStockQuotes(openCodes).catch(() => ({})) : {};
    const liveTrades = trades.map((t) => {
      const q = (quotes as Record<string, { current_price?: number }>)[t.stock_code];
      if (t.status === "OPEN" && q?.current_price && q.current_price > 0 && t.buy_price > 0) {
        const livePnl = Number((((q.current_price - t.buy_price) / t.buy_price) * 100).toFixed(2));
        return {
          ...t,
          live_price: q.current_price,
          pnl_pct: livePnl,
        };
      }
      return {
        ...t,
        live_price: t.sell_price ?? t.buy_price,
      };
    });

    const stats = computeSignalWinRateStats(liveTrades);
    return NextResponse.json(
      {
        success: true,
        stats,
        open_trades: liveTrades.filter((t) => t.status === "OPEN"),
        closed_trades: liveTrades.filter((t) => t.status === "CLOSED"),
        all_trades: liveTrades,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[api-market/signal-trades] GET error:", err);
    return fail("获取推荐股模拟交易数据失败", 500);
  }
}

export async function POST(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);
  if (!sameOrigin(request)) return fail("请求来源不允许", 403);

  try {
    const body = await readJsonBody(request, 8192);
    const action = String(body.action || "sync");

    if (action === "manual_close") {
      const tradeId = Number(body.id);
      if (!Number.isSafeInteger(tradeId) || tradeId <= 0) return fail("交易记录ID无效", 400);
      const trades = await listUserSignalTrades(userId);
      const target = trades.find((t) => t.id === tradeId && t.status === "OPEN");
      if (!target) return fail("未找到持仓中的模拟单", 404);

      const quotes = await getRealStockQuotes([target.stock_code]);
      const sellPrice =
        Number(body.price) > 0
          ? Number(body.price)
          : quotes[target.stock_code]?.current_price || target.buy_price;
      const pnlPct =
        target.buy_price > 0
          ? Number((((sellPrice - target.buy_price) / target.buy_price) * 100).toFixed(2))
          : 0;

      await closeSignalPaperTrade(tradeId, userId, {
        sellSignal: "MANUAL_CLOSE",
        sellPrice,
        sellReason: `手动按 ¥${sellPrice.toFixed(2)} 平仓结算`,
        pnlPct,
        isWin: pnlPct > 0,
        holdDays: target.hold_days,
        peakPrice: Math.max(target.peak_price, sellPrice),
      });

      const updated = await listUserSignalTrades(userId);
      return NextResponse.json({
        success: true,
        message: `${target.stock_name} 模拟单已按 ¥${sellPrice.toFixed(2)} 平仓（${pnlPct >= 0 ? "+" : ""}${pnlPct}%）`,
        stats: computeSignalWinRateStats(updated),
      });
    }

    if (action === "sync") {
      const [{ active }, existingTrades, sentiment, sectorList] = await Promise.all([
        listUserRollingPool(userId),
        listUserSignalTrades(userId),
        getRealMarketSentiment().catch(() => null),
        fetchAllSectorsList().catch(() => []),
      ]);

      const allCodes = [
        ...new Set([
          ...active.map((a) => a.stock_code),
          ...existingTrades.filter((t) => t.status === "OPEN").map((t) => t.stock_code),
        ]),
      ];

      const [quotes, klineEntries] = await Promise.all([
        allCodes.length ? getRealStockQuotes(allCodes) : Promise.resolve({} as Record<string, never>),
        Promise.all(
          allCodes.map(async (c) => [c, await fetchStockDailyKline(c, 90).catch(() => [])] as const)
        ),
      ]);
      const klineMap = new Map(klineEntries);
      const trafficLight = evaluateMarketTrafficLight(sentiment?.sentiment_temperature ?? null);

      const quotesByCode: Record<string, SwingLiveQuote | undefined> = {};
      for (const code of allCodes) {
        const q = quotes[code];
        if (q) {
          quotesByCode[code] = {
            price: q.current_price,
            quote_date: q.timestamp ? q.timestamp.slice(0, 10) : undefined,
            prev_close: q.pre_close,
            open: q.open,
            high: q.high,
            low: q.low,
            change_pct: q.change_pct,
            volume: q.volume,
            amount: q.amount,
            vol_ratio: q.vol_ratio,
            turnover_pct: q.turnover_pct,
          };
        }
      }

      const buySignals: Array<{
        poolItem: (typeof active)[number];
        signal: "BUY_A" | "BUY_B";
        price: number;
        reason: string;
      }> = [];

      for (const item of active) {
        const live = quotesByCode[item.stock_code];
        const tech = computeStockTechnicals(klineMap.get(item.stock_code) || [], item.stock_code, live);
        const sec = resolveStockSector(item.stock_code, item.stock_name, item.sector);
        const secPerf = findSectorPerformance(sec, sectorList);
        const ev = evaluateWatchlistSwingSignals(
          {
            code: item.stock_code,
            name: item.stock_name,
            observed_days: item.observed_days,
            max_days: item.max_days,
            buy_low: item.buy_low,
            buy_high: item.buy_high,
            breakout_price: item.breakout_price,
            invalid_price: item.invalid_price,
          },
          live,
          secPerf.change_pct,
          trafficLight,
          tech
        );
        if ((ev.triggered_signal === "BUY_A" || ev.triggered_signal === "BUY_B") && ev.price) {
          buySignals.push({
            poolItem: item,
            signal: ev.triggered_signal,
            price: ev.price,
            reason: ev.status_summary,
          });
        }
      }

      const syncRes = await syncUserSignalPaperTrades({
        userId,
        activePool: active,
        buySignals,
        quotesByCode,
        klineByCode: klineMap,
      });

      return NextResponse.json({
        success: true,
        message: `信号巡检完成：新买入 ${syncRes.openedCount} 笔，自动卖出 ${syncRes.closedCount} 笔`,
        opened_count: syncRes.openedCount,
        closed_count: syncRes.closedCount,
        stats: computeSignalWinRateStats(syncRes.trades),
      });
    }

    return fail("不支持的操作", 400);
  } catch (err) {
    console.error("[api-market/signal-trades] POST error:", err);
    return fail("模拟买卖同步失败", 500);
  }
}
