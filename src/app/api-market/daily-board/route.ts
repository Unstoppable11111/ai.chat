import { NextResponse } from "next/server";
import { readJsonBody, requestOwner, sameOrigin } from "@/lib/server-security";
import { appendAnomalyRecord, getFullDailyBoard } from "@/lib/daily-board-db";
import { getUserHoldings } from "@/lib/portfolio-db";
import { listUserRollingPool } from "@/lib/rolling-pool-db";
import {
  fetchAllSectorsList,
  fetchClsTelegraphNews,
  fetchStockDailyKline,
  getRealMarketSentiment,
  getRealStockQuotes,
} from "@/lib/quotes-service";
import {
  computeStockTechnicals,
  evaluateHoldingSwingSignals,
  evaluateMarketTrafficLight,
  evaluateWatchlistSwingSignals,
} from "@/lib/quant-arena/swing-rules";
import { findSectorPerformance, resolveStockSector } from "@/lib/quant-arena/holding-ai-advisor";
import { generateAnomalyAnalysisWithAI } from "@/lib/quant-arena/swing-ai-escalator";
import { getShanghaiDateStr, getShanghaiParts } from "@/lib/trading-hours";

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });

export async function GET(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);

  try {
    const url = new URL(request.url);
    const reqDate = url.searchParams.get("date");
    const targetDate = reqDate && /^\d{4}-\d{2}-\d{2}$/.test(reqDate) ? reqDate : getShanghaiDateStr();
    const board = await getFullDailyBoard(userId, targetDate);
    return NextResponse.json(
      { success: true, ...board },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[api-market/daily-board] GET error:", err);
    return fail("获取每日看板数据失败", 500);
  }
}

export async function POST(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);
  if (!sameOrigin(request)) return fail("请求来源不允许", 403);

  try {
    const body = await readJsonBody(request, 8192);
    const action = String(body.action || "");
    if (action !== "analyze") return fail("不支持的操作类型", 400);

    const focusCode = typeof body.stock_code === "string" ? body.stock_code.trim() : undefined;
    const focusName = typeof body.stock_name === "string" ? body.stock_name.trim() : undefined;
    const customQuestion = typeof body.question === "string" ? body.question.trim() : "";

    const { dateStr: today, hhmm } = getShanghaiParts();
    const [holdings, pool, sentiment, sectorList, news] = await Promise.all([
      getUserHoldings(userId),
      listUserRollingPool(userId),
      getRealMarketSentiment().catch(() => null),
      fetchAllSectorsList().catch(() => []),
      fetchClsTelegraphNews(10).catch(() => []),
    ]);

    const codes = [
      ...new Set([
        ...holdings.map((h) => h.stock_code),
        ...pool.active.map((w) => w.stock_code),
        ...(focusCode && /^\d{6}$/.test(focusCode) ? [focusCode] : []),
      ]),
    ];

    const [quotesMap, klineEntries] = await Promise.all([
      codes.length ? getRealStockQuotes(codes) : Promise.resolve({} as Record<string, never>),
      Promise.all(codes.map(async (c) => [c, await fetchStockDailyKline(c, 90).catch(() => [])] as const)),
    ]);
    const klineMap = new Map(klineEntries);
    const trafficLight = evaluateMarketTrafficLight(sentiment?.sentiment_temperature ?? null);

    const holdingEvals = holdings.map((h) => {
      const q = quotesMap[h.stock_code];
      const liveInput = q
        ? {
            price: q.current_price,
            prev_close: q.pre_close,
            open: q.open,
            high: q.high,
            low: q.low,
            change_pct: q.change_pct,
            volume: q.volume,
            amount: q.amount,
            vol_ratio: q.vol_ratio,
            turnover_pct: q.turnover_pct,
          }
        : null;
      const tech = computeStockTechnicals(klineMap.get(h.stock_code) || [], h.stock_code, liveInput);
      const sec = resolveStockSector(h.stock_code, h.stock_name, h.sector || undefined);
      const secPerf = findSectorPerformance(sec, sectorList);
      return evaluateHoldingSwingSignals(
        {
          code: h.stock_code,
          name: h.stock_name,
          quantity: h.quantity,
          available_quantity: h.available_quantity ?? h.quantity,
          cost_price: h.cost_price,
          hold_type: h.hold_type,
          sector: sec,
          position_mode: h.position_mode,
          support_defense_price: h.support_defense_price,
          rebound_watch_prices: h.rebound_watch_prices,
          peak_price_since_entry: h.peak_price_since_entry,
          take_profit_pct_1: h.take_profit_pct_1,
          take_profit_pct_2: h.take_profit_pct_2,
          trailing_pullback_pct: h.trailing_pullback_pct,
          stop_loss_pct: h.stop_loss_pct,
          suppress_cost_stoploss: h.suppress_cost_stoploss,
          thesis: h.thesis,
        },
        liveInput,
        tech,
        secPerf.change_pct
      );
    });

    const watchEvals = pool.active.map((w) => {
      const q = quotesMap[w.stock_code];
      const liveInput = q
        ? {
            price: q.current_price,
            prev_close: q.pre_close,
            open: q.open,
            high: q.high,
            low: q.low,
            change_pct: q.change_pct,
            volume: q.volume,
            amount: q.amount,
            vol_ratio: q.vol_ratio,
            turnover_pct: q.turnover_pct,
          }
        : null;
      const tech = computeStockTechnicals(klineMap.get(w.stock_code) || [], w.stock_code, liveInput);
      const sec = resolveStockSector(w.stock_code, w.stock_name, w.sector);
      const secPerf = findSectorPerformance(sec, sectorList);
      return evaluateWatchlistSwingSignals(
        {
          code: w.stock_code,
          name: w.stock_name,
          observed_days: w.observed_days,
          max_days: w.max_days,
          buy_low: w.buy_low,
          buy_high: w.buy_high,
          breakout_price: w.breakout_price,
          invalid_price: w.invalid_price,
        },
        liveInput,
        secPerf.change_pct,
        trafficLight,
        tech
      );
    });

    const reasons = [
      focusName || focusCode
        ? `用户主动发起对【${focusName || ""} ${focusCode || ""}】的实时盘面深度研判`
        : "用户主动发起全盘与持仓波段深度研判",
      ...(customQuestion ? [`补充关注：${customQuestion}`] : []),
    ];

    const aiRes = await generateAnomalyAnalysisWithAI({
      reportDate: today,
      timeStr: hhmm,
      triggerType: "manual",
      focusCode,
      focusName,
      reasons,
      trafficLight,
      holdings: holdingEvals,
      watchlist: watchEvals,
      news,
    });

    const newRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
      trigger_type: "manual" as const,
      focus_code: focusCode,
      focus_name: focusName,
      reasons,
      sentiment_label: trafficLight.label,
      analysis_markdown: aiRes.markdown,
      ai_used: aiRes.aiUsed,
      model_used: aiRes.modelUsed,
    };

    const updated = await appendAnomalyRecord(userId, today, newRecord);
    return NextResponse.json({ success: true, record: newRecord, anomaly: updated });
  } catch (err) {
    console.error("[api-market/daily-board] POST error:", err);
    return fail(err instanceof Error ? err.message : "AI 研判生成失败", 500);
  }
}
