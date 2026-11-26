import { executeQuery, getDbPool } from "@/lib/db";
import { takeQuota } from "@/lib/server-security";
import { getUserHoldings } from "@/lib/portfolio-db";
import { listUserRollingPool, ensureRollingPoolTable } from "@/lib/rolling-pool-db";
import { listUserSignalTrades, syncUserSignalPaperTrades } from "@/lib/signal-paper-db";
import {
  appendAnomalyRecord,
  appendIntradayTick,
  getBoardReport,
  upsertBoardReport,
  type IntradayReportPayload,
  type PostmarketReportPayload,
  type PremarketReportPayload,
} from "@/lib/daily-board-db";
import {
  fetchAllSectorsList,
  fetchClsTelegraphNews,
  fetchRealIndicesAndTurnover,
  fetchStockDailyKline,
  getRealMarketSentiment,
  getRealStockQuotes,
} from "@/lib/quotes-service";
import {
  computeStockTechnicals,
  evaluateHoldingSwingSignals,
  evaluateMarketTrafficLight,
  evaluateWatchlistSwingSignals,
  type HoldingSwingEvaluation,
  type WatchItemSwingEvaluation,
} from "@/lib/quant-arena/swing-rules";
import { findSectorPerformance, resolveStockSector } from "@/lib/quant-arena/holding-ai-advisor";
import { runSwingScreener, settleAndEnrollForUser } from "@/lib/quant-arena/rolling-screener";
import {
  generateAnomalyAnalysisWithAI,
  generatePremarketPlanWithAI,
} from "@/lib/quant-arena/swing-ai-escalator";
import {
  getShanghaiDateStr,
  getShanghaiParts,
  isAShareTradingDay,
} from "@/lib/trading-hours";

async function listTargetUsers(targetUserId?: string): Promise<string[]> {
  if (targetUserId) return [targetUserId];
  if (!getDbPool()) return [];
  await ensureRollingPoolTable();

  // 分别查询活跃用户与持仓/观察池 user_id 并在内存取交集，彻底避免历史表与新表因字符集排序规则不同导致 ER_CANT_AGGREGATE_2COLLATIONS
  const [activeUsers, portfolioUsers, poolUsers] = await Promise.all([
    executeQuery<{ id: string }>(`SELECT id FROM studio_users WHERE disabled = 0`),
    executeQuery<{ user_id: string }>(`SELECT DISTINCT user_id FROM user_portfolios`),
    executeQuery<{ user_id: string }>(`SELECT DISTINCT user_id FROM stock_rolling_pool`),
  ]);

  const activeSet = new Set((activeUsers || []).map((r) => r.id));
  const candidateIds = new Set<string>([
    ...(portfolioUsers || []).map((r) => r.user_id),
    ...(poolUsers || []).map((r) => r.user_id),
  ]);

  return [...candidateIds].filter((id) => activeSet.has(id));
}

/**
 * 01 盘前全天计划任务（交易日 08:35 自动执行，也可手动触发）
 */
export async function runPremarketJob(options?: { targetUserId?: string; force?: boolean }) {
  const today = getShanghaiDateStr();
  if (!options?.force && !isAShareTradingDay()) {
    return { skipped: true, reason: "非A股交易日" };
  }

  const users = await listTargetUsers(options?.targetUserId);
  if (!users.length) {
    return { skipped: true, reason: "暂无需要监控的持仓或观察池账户", processedUsers: 0 };
  }

  const [news, sentiment] = await Promise.all([
    fetchClsTelegraphNews(15).catch(() => []),
    getRealMarketSentiment().catch(() => null),
  ]);
  const trafficLight = evaluateMarketTrafficLight(sentiment?.sentiment_temperature ?? null);

  let processed = 0;
  for (const userId of users) {
    try {
      const [holdings, pool] = await Promise.all([
        getUserHoldings(userId),
        listUserRollingPool(userId),
      ]);

      const holdingsPlan = holdings.map((h) => {
        const slPct = h.stop_loss_pct ?? -8;
        const defaultStop =
          h.position_mode === "deep_drawdown_recovery" && h.support_defense_price
            ? h.support_defense_price
            : Number((h.cost_price * (1 + slPct / 100)).toFixed(2));
        return {
          code: h.stock_code,
          name: h.stock_name,
          cost_price: h.cost_price,
          position_mode: h.position_mode || "swing_normal",
          stop_loss_price: defaultStop,
          support_defense_price: h.support_defense_price ?? null,
          rebound_watch_prices: h.rebound_watch_prices ?? null,
          thesis: h.thesis || null,
        };
      });

      const watchlistPlan = pool.active.map((w) => ({
        code: w.stock_code,
        name: w.stock_name,
        board: w.board,
        observed_days: w.observed_days,
        max_days: w.max_days,
        buy_low: w.buy_low,
        buy_high: w.buy_high,
        breakout_price: w.breakout_price,
        invalid_price: w.invalid_price,
      }));

      const aiRes = await generatePremarketPlanWithAI({
        reportDate: today,
        trafficLight,
        news,
        holdings: holdingsPlan,
        watchlist: watchlistPlan,
      });

      const payload: PremarketReportPayload = {
        report_date: today,
        generated_at: new Date().toISOString(),
        traffic_light: trafficLight,
        news: news.slice(0, 10),
        holdings_plan: holdingsPlan,
        watchlist_plan: watchlistPlan,
        plan_markdown: aiRes.markdown,
        ai_used: aiRes.aiUsed,
        model_used: aiRes.modelUsed,
      };
      await upsertBoardReport(userId, "premarket", today, payload);
      processed++;
    } catch (err) {
      console.error(`[MarketScheduler] premarket failed for ${userId}:`, err);
    }
  }

  return { skipped: false, reportDate: today, processedUsers: processed };
}

/**
 * 02 盘中 5 分钟规则巡检 + 重大异常自动唤醒 AI 研判（写入 04）
 */
export async function runIntradayTickJob(options?: { targetUserId?: string; force?: boolean }) {
  const { dateStr: today, hhmm, totalMinutes } = getShanghaiParts();
  const inTradingSession =
    (totalMinutes >= 565 && totalMinutes <= 692) || (totalMinutes >= 778 && totalMinutes <= 905);

  if (!options?.force && (!isAShareTradingDay() || !inTradingSession)) {
    return { skipped: true, reason: "非盘中交易时段" };
  }

  const users = await listTargetUsers(options?.targetUserId);
  if (!users.length) {
    return { skipped: true, reason: "暂无监控账户", processedUsers: 0 };
  }

  // 共享全市场行情与情绪快照（1 次抓取供所有账户复用）
  const [indicesSnapshot, sentiment, sectorList] = await Promise.all([
    fetchRealIndicesAndTurnover().catch(() => null),
    getRealMarketSentiment().catch(() => null),
    fetchAllSectorsList().catch(() => []),
  ]);

  const trafficLight = evaluateMarketTrafficLight(sentiment?.sentiment_temperature ?? null);
  const indicesSummary = indicesSnapshot?.indices?.length
    ? indicesSnapshot.indices
        .slice(0, 3)
        .map((i) => `${i.name} ${i.close.toFixed(2)}(${i.change_pct >= 0 ? "+" : ""}${i.change_pct.toFixed(2)}%)`)
        .join(" | ")
    : "指数行情待刷新";

  // 收集全用户持仓、观察股及正在持仓的模拟信号单代码，一次性批量拉取行情
  const userStates = await Promise.all(
    users.map(async (userId) => {
      const [holdings, pool, signalTrades] = await Promise.all([
        getUserHoldings(userId),
        listUserRollingPool(userId),
        listUserSignalTrades(userId).catch(() => []),
      ]);
      return { userId, holdings, activeWatch: pool.active, signalTrades };
    })
  );

  const allCodes = [
    ...new Set(
      userStates.flatMap((u) => [
        ...u.holdings.map((h) => h.stock_code),
        ...u.activeWatch.map((w) => w.stock_code),
        ...u.signalTrades.filter((t) => t.status === "OPEN").map((t) => t.stock_code),
      ])
    ),
  ];

  const [quotesMap, klineEntries] = await Promise.all([
    allCodes.length ? getRealStockQuotes(allCodes) : Promise.resolve({} as Record<string, never>),
    Promise.all(
      allCodes.slice(0, 40).map(async (c) => [c, await fetchStockDailyKline(c, 60).catch(() => [])] as const)
    ),
  ]);
  const klineMap = new Map(klineEntries);

  let processed = 0;
  let escalatedUsers = 0;

  for (const state of userStates) {
    try {
      const prevIntraday = await getBoardReport<IntradayReportPayload>(
        state.userId,
        "intraday",
        today
      );
      const prevSentiment = prevIntraday?.latest_sentiment_score ?? null;
      const curSentiment = trafficLight.score;
      const sentimentJumped =
        prevSentiment !== null &&
        curSentiment !== null &&
        Math.abs(curSentiment - prevSentiment) >= 15;

      const holdingEvals: HoldingSwingEvaluation[] = state.holdings.map((h) => {
        const q = quotesMap[h.stock_code];
        const bars = klineMap.get(h.stock_code) || [];
        const liveInput = q
          ? {
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
            }
          : null;
        const tech = computeStockTechnicals(bars, h.stock_code, liveInput);
        const resolvedSector = resolveStockSector(h.stock_code, h.stock_name, h.sector || undefined);
        const sectorPerf = findSectorPerformance(resolvedSector, sectorList);

        return evaluateHoldingSwingSignals(
          {
            code: h.stock_code,
            name: h.stock_name,
            quantity: h.quantity,
            available_quantity: h.available_quantity ?? h.quantity,
            cost_price: h.cost_price,
            hold_type: h.hold_type,
            sector: resolvedSector,
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
          sectorPerf.change_pct
        );
      });

      const watchEvals: WatchItemSwingEvaluation[] = state.activeWatch.map((w) => {
        const q = quotesMap[w.stock_code];
        const bars = klineMap.get(w.stock_code) || [];
        const liveInput = q
          ? {
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
            }
          : null;
        const tech = computeStockTechnicals(bars, w.stock_code, liveInput);
        const resolvedSector = resolveStockSector(w.stock_code, w.stock_name, w.sector);
        const sectorPerf = findSectorPerformance(resolvedSector, sectorList);

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
          sectorPerf.change_pct,
          trafficLight,
          tech
        );
      });

      // 自动同步推荐股买点建仓与模拟持仓 T+1 卖出监控
      const paperQuotesByCode: Record<string, { price: number; quote_date?: string; prev_close?: number; open?: number; high?: number; low?: number; change_pct?: number; volume?: number; amount?: number; vol_ratio?: number; turnover_pct?: number } | undefined> = {};
      for (const code of allCodes) {
        const q = quotesMap[code];
        if (q) {
          paperQuotesByCode[code] = {
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
      const buySignalsForPaper: Array<{
        poolItem: (typeof state.activeWatch)[number];
        signal: "BUY_A" | "BUY_B";
        price: number;
        reason: string;
      }> = [];
      watchEvals.forEach((we, idx) => {
        const item = state.activeWatch[idx];
        if (item && (we.triggered_signal === "BUY_A" || we.triggered_signal === "BUY_B") && we.price) {
          buySignalsForPaper.push({
            poolItem: item,
            signal: we.triggered_signal,
            price: we.price,
            reason: we.status_summary,
          });
        }
      });
      await syncUserSignalPaperTrades({
        userId: state.userId,
        activePool: state.activeWatch,
        buySignals: buySignalsForPaper,
        quotesByCode: paperQuotesByCode,
        klineByCode: klineMap,
        tradeDateStr: today,
        timeStr: hhmm,
      }).catch((err) => console.warn("[MarketScheduler] signal paper sync warning:", err));

      const escalateItems: Array<{ code: string; reason: string }> = [];
      for (const he of holdingEvals) {
        if (he.llm_escalate) {
          for (const reason of he.escalate_reasons) {
            escalateItems.push({ code: he.code, reason: `${he.name}(${he.code}): ${reason}` });
          }
        }
      }
      for (const we of watchEvals) {
        if (we.llm_escalate) {
          for (const reason of we.escalate_reasons) {
            escalateItems.push({ code: we.code, reason: `${we.name}(${we.code}): ${reason}` });
          }
        }
      }
      if (sentimentJumped) {
        escalateItems.push({
          code: "MARKET",
          reason: `全市场情绪分由 ${prevSentiment} 分骤变至 ${curSentiment} 分（波动 >= 15 分）`,
        });
      }

      let didEscalate = false;
      if (escalateItems.length > 0) {
        // 60 分钟冷却检查（至少有 1 个触发项过冷却才唤醒 AI）
        const freshReasons: string[] = [];
        for (const item of escalateItems) {
          const allowed = await takeQuota(
            `swing:ai:cool:${state.userId}:${item.code}`,
            1,
            60 * 60 * 1000
          ).catch(() => true);
          if (allowed) freshReasons.push(item.reason);
        }

        if (freshReasons.length > 0) {
          didEscalate = true;
          escalatedUsers++;
          const news = await fetchClsTelegraphNews(8).catch(() => []);
          const aiRes = await generateAnomalyAnalysisWithAI({
            reportDate: today,
            timeStr: hhmm,
            triggerType: "auto",
            reasons: freshReasons,
            trafficLight,
            holdings: holdingEvals,
            watchlist: watchEvals,
            news,
          });
          await appendAnomalyRecord(state.userId, today, {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            created_at: new Date().toISOString(),
            trigger_type: "auto",
            reasons: freshReasons,
            sentiment_label: trafficLight.label,
            analysis_markdown: aiRes.markdown,
            ai_used: aiRes.aiUsed,
            model_used: aiRes.modelUsed,
          });
        }
      }

      await appendIntradayTick(state.userId, today, {
        tick_time: hhmm,
        indices_summary: indicesSummary,
        sentiment_score: trafficLight.score,
        traffic_light: trafficLight,
        up_count: indicesSnapshot?.up_count || 0,
        down_count: indicesSnapshot?.down_count || 0,
        limit_up_count: sentiment?.limit_up_count || 0,
        limit_down_count: sentiment?.limit_down_count || 0,
        broken_ratio: sentiment?.broken_limit_ratio || 0,
        holdings: holdingEvals.map((h) => ({
          code: h.code,
          name: h.name,
          price: h.price,
          change_pct: h.change_pct,
          pnl_pct: h.pnl_pct,
          amplitude_pct: h.amplitude_pct,
          pullback_from_high_pct: h.pullback_from_high_pct,
          recommendation: h.recommendation,
          highest_severity: h.highest_severity,
          signals: h.signals.map((s) => s.message),
        })),
        watchlist: watchEvals.map((w) => ({
          code: w.code,
          name: w.name,
          price: w.price,
          change_pct: w.change_pct,
          observed_days: w.observed_days,
          max_days: w.max_days,
          triggered_signal: w.triggered_signal,
          status_summary: w.status_summary,
        })),
        escalated: didEscalate,
      });

      processed++;
    } catch (err) {
      console.error(`[MarketScheduler] intraday tick failed for ${state.userId}:`, err);
    }
  }

  return { skipped: false, reportDate: today, tickTime: hhmm, processedUsers: processed, escalatedUsers };
}

/**
 * 03 盘后选股与 5 日观察池轮动任务（交易日 15:35 自动执行）
 */
export async function runPostmarketJob(options?: { targetUserId?: string; force?: boolean }) {
  const today = getShanghaiDateStr();
  if (!options?.force && !isAShareTradingDay()) {
    return { skipped: true, reason: "非A股交易日" };
  }

  const users = await listTargetUsers(options?.targetUserId);
  if (!users.length) {
    return { skipped: true, reason: "暂无活跃账户", processedUsers: 0 };
  }

  // 全市场选股只扫一次，结果供各账户独立结算与去重入池
  const screenerResult = await runSwingScreener({
    sampleLimit: 100,
    minAmountYi: 3.0,
    maxResults: 12,
    tradeDateStr: today,
  });

  // 抓取所有观察池及未平仓模拟单涉及股票的最新收盘快照
  const watchByUser = await Promise.all(
    users.map(async (u) => ({
      userId: u,
      pool: await listUserRollingPool(u),
      signalTrades: await listUserSignalTrades(u).catch(() => []),
    }))
  );
  const allWatchCodes = [
    ...new Set(
      watchByUser.flatMap((u) => [
        ...u.pool.active.map((w) => w.stock_code),
        ...u.signalTrades.filter((t) => t.status === "OPEN").map((t) => t.stock_code),
      ])
    ),
  ];
  const quotesMap = allWatchCodes.length ? await getRealStockQuotes(allWatchCodes) : {};

  let processed = 0;
  for (const { userId } of watchByUser) {
    try {
      const settled = await settleAndEnrollForUser(userId, screenerResult, quotesMap, 3);
      const paperQuotesByCode: Record<string, { price: number; quote_date?: string; prev_close?: number; open?: number; high?: number; low?: number; change_pct?: number; volume?: number; amount?: number; vol_ratio?: number; turnover_pct?: number } | undefined> = {};
      for (const code of allWatchCodes) {
        const q = quotesMap[code];
        if (q) {
          paperQuotesByCode[code] = {
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
      await syncUserSignalPaperTrades({
        userId,
        quotesByCode: paperQuotesByCode,
        tradeDateStr: today,
        timeStr: "15:00",
      }).catch(() => {});
      const report: PostmarketReportPayload = {
        report_date: today,
        generated_at: new Date().toISOString(),
        scanned_count: screenerResult.scanned_count,
        qualified_count: screenerResult.qualified_count,
        enrolled: settled.enrolledToday.map((e) => ({
          code: e.stock_code,
          name: e.stock_name,
          board: e.board,
          sector: e.sector,
          entry_ref_price: e.entry_ref_price,
          buy_low: e.buy_low,
          buy_high: e.buy_high,
          breakout_price: e.breakout_price,
          invalid_price: e.invalid_price,
          vol_ratio_5_20: e.vol_ratio_5_20,
          limit_up_count_1y: e.limit_up_count_1y,
          thesis: e.thesis,
        })),
        expired_today: settled.expiredToday.map((x) => ({
          code: x.stock_code,
          name: x.stock_name,
          reason: x.drop_reason || "满5日自动放弃",
        })),
        invalidated_today: settled.invalidatedToday.map((x) => ({
          code: x.stock_code,
          name: x.stock_name,
          reason: x.drop_reason || "破位提前淘汰",
        })),
        active_pool_count: settled.activeAfter.length,
        candidates_preview: screenerResult.candidates.slice(0, 8).map((c) => ({
          code: c.code,
          name: c.name,
          board: c.board,
          sector: c.sector,
          price: c.price,
          change_pct: c.change_pct,
          composite_score: c.composite_score,
          score_note: c.score_note,
        })),
      };
      await upsertBoardReport(userId, "postmarket", today, report);
      processed++;
    } catch (err) {
      console.error(`[MarketScheduler] postmarket failed for ${userId}:`, err);
    }
  }

  return { skipped: false, reportDate: today, processedUsers: processed };
}

/**
 * 内部 60 秒后台时钟检查器：自动对应 08:35 盘前、盘中每 5 分钟、15:35 盘后
 */
let schedulerStarted = false;

export async function tickMarketScheduler(): Promise<void> {
  if (!getDbPool() || !isAShareTradingDay()) return;
  const { dateStr, hour, minute, totalMinutes } = getShanghaiParts();

  // 1. 08:35 - 08:40 盘前计划槽位
  if (totalMinutes >= 515 && totalMinutes <= 520) {
    const acquired = await takeQuota(`market:cron:premarket:${dateStr}`, 1, 20 * 3600 * 1000).catch(
      () => false
    );
    if (acquired) {
      await runPremarketJob();
    }
    return;
  }

  // 2. 盘中每 5 分钟巡检槽位：09:25~11:32 及 12:58~15:05
  const inMorning = totalMinutes >= 565 && totalMinutes <= 692;
  const inAfternoon = totalMinutes >= 778 && totalMinutes <= 905;
  if ((inMorning || inAfternoon) && minute % 5 === 0) {
    const slot = `${dateStr}:${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const acquired = await takeQuota(`market:cron:intraday:${slot}`, 1, 180 * 1000).catch(
      () => false
    );
    if (acquired) {
      await runIntradayTickJob();
    }
    return;
  }

  // 3. 15:35 - 15:42 盘后选股与 5 日轮动槽位
  if (totalMinutes >= 935 && totalMinutes <= 942) {
    const acquired = await takeQuota(`market:cron:postmarket:${dateStr}`, 1, 20 * 3600 * 1000).catch(
      () => false
    );
    if (acquired) {
      await runPostmarketJob();
    }
  }
}

export function startBackgroundMarketScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // 延迟 25 秒首检，确保不影响 Next.js 服务冷启动或部署健康检查短命进程
  const initTimer = setTimeout(() => {
    void tickMarketScheduler().catch((err) =>
      console.warn("[MarketScheduler] tick warning:", err)
    );
  }, 25000);
  initTimer.unref();

  const loopTimer = setInterval(() => {
    void tickMarketScheduler().catch((err) =>
      console.warn("[MarketScheduler] loop warning:", err)
    );
  }, 60000);
  loopTimer.unref();
}
