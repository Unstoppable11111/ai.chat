import { NextResponse } from "next/server";
import { readJsonBody, requestOwner, sameOrigin } from "@/lib/server-security";
import {
  addRollingWatchItem,
  convertWatchItemToHolding,
  dropRollingWatchItem,
  listUserRollingPool,
  seedInitialSelectPortfolio,
} from "@/lib/rolling-pool-db";
import {
  fetchAllSectorsList,
  fetchStockDailyKline,
  getRealMarketSentiment,
  getRealStockQuotes,
} from "@/lib/quotes-service";
import {
  classifyAShareBoard,
  computeStockTechnicals,
  evaluateMarketTrafficLight,
  evaluateWatchlistSwingSignals,
} from "@/lib/quant-arena/swing-rules";
import {
  findSectorPerformance,
  resolveStockSector,
} from "@/lib/quant-arena/holding-ai-advisor";
import {
  runSwingScreener,
  settleAndEnrollForUser,
} from "@/lib/quant-arena/rolling-screener";

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });

export async function GET(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);

  try {
    const { active, archive } = await listUserRollingPool(userId);
    const codes = active.map((i) => i.stock_code);

    const [quotes, sentiment, sectorList, klineEntries] = await Promise.all([
      codes.length ? getRealStockQuotes(codes) : Promise.resolve({} as Record<string, never>),
      getRealMarketSentiment().catch(() => null),
      fetchAllSectorsList().catch(() => []),
      Promise.all(
        codes.map(async (c) => [c, await fetchStockDailyKline(c, 90).catch(() => [])] as const)
      ),
    ]);

    const klineMap = new Map(klineEntries);
    const trafficLight = evaluateMarketTrafficLight(sentiment?.sentiment_temperature ?? null);

    const enrichedActive = active.map((item) => {
      const q = quotes[item.stock_code];
      const bars = klineMap.get(item.stock_code) || [];
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
      const tech = computeStockTechnicals(bars, item.stock_code, liveInput);
      const resolvedSector = resolveStockSector(item.stock_code, item.stock_name, item.sector);
      const sectorPerf = findSectorPerformance(resolvedSector, sectorList);

      const evaluation = evaluateWatchlistSwingSignals(
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
        liveInput,
        sectorPerf.change_pct,
        trafficLight,
        tech
      );

      return {
        ...item,
        sector: resolvedSector,
        sector_change_pct: sectorPerf.change_pct,
        live_price: evaluation.price,
        live_change_pct: evaluation.change_pct,
        live_vol_ratio: evaluation.vol_ratio,
        dist_to_buy_high_pct: evaluation.dist_to_buy_high_pct,
        dist_to_breakout_pct: evaluation.dist_to_breakout_pct,
        dist_to_invalid_pct: evaluation.dist_to_invalid_pct,
        triggered_signal: evaluation.triggered_signal,
        signals: evaluation.signals,
        llm_escalate: evaluation.llm_escalate,
        status_summary: evaluation.status_summary,
        technicals: tech,
      };
    });

    const convertedCount = archive.filter((a) => a.status === "CONVERTED").length;
    const expiredCount = archive.filter((a) => a.status === "EXPIRED").length;
    const invalidatedCount = archive.filter((a) => a.status === "INVALIDATED").length;

    return NextResponse.json(
      {
        success: true,
        traffic_light: trafficLight,
        active: enrichedActive,
        archive,
        stats: {
          active_count: enrichedActive.length,
          max_active: 12,
          buy_ready_count: enrichedActive.filter(
            (i) => i.triggered_signal === "BUY_A" || i.triggered_signal === "BUY_B"
          ).length,
          converted_count: convertedCount,
          expired_count: expiredCount,
          invalidated_count: invalidatedCount,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[api-market/rolling-pool] GET error:", err);
    return fail("获取5日轮动观察池失败", 500);
  }
}

export async function POST(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);
  if (!sameOrigin(request)) return fail("请求来源不允许", 403);

  try {
    const body = await readJsonBody(request, 16384);
    const action = String(body.action || "");

    if (action === "seed_select") {
      const res = await seedInitialSelectPortfolio(userId);
      return NextResponse.json({
        success: true,
        message: `导入完成：${res.addedHolding ? "已加入兴森科技持仓、" : ""}新增 ${res.addedWatchCount} 只观察池标的`,
        ...res,
      });
    }

    if (action === "run_postmarket") {
      const screenerResult = await runSwingScreener({ sampleLimit: 80, maxResults: 8 });
      const { active } = await listUserRollingPool(userId);
      const codes = active.map((i) => i.stock_code);
      const quotes = codes.length ? await getRealStockQuotes(codes) : {};
      const settled = await settleAndEnrollForUser(userId, screenerResult, quotes, 3);
      return NextResponse.json({
        success: true,
        message: `扫描 ${screenerResult.scanned_count} 只活跃股，新入选 ${settled.enrolledToday.length} 只（淘汰/过期 ${settled.invalidatedToday.length + settled.expiredToday.length} 只）`,
        screener: screenerResult,
        ...settled,
      });
    }

    if (action === "add") {
      const code = String(body.stock_code || "").replace(/^(sh|sz|bj)/i, "").trim();
      const name = String(body.stock_name || "").trim();
      if (!/^\d{6}$/.test(code)) return fail("股票代码必须为6位数字", 400);
      const board = classifyAShareBoard(code, name);
      if (!board.allowed) {
        return fail(`${name || code} 属于${board.board}，仅允许沪深主板与创业板`, 400);
      }

      const [quotes, bars] = await Promise.all([
        getRealStockQuotes([code]),
        fetchStockDailyKline(code, 260),
      ]);
      const q = quotes[code];
      const livePrice = q?.current_price || Number(body.entry_ref_price || 0);
      if (!livePrice || livePrice <= 0) {
        return fail("无法获取该股票现价，请核对代码", 400);
      }

      const tech = computeStockTechnicals(bars, code, q ? { price: q.current_price, change_pct: q.change_pct } : null);
      const finalName = q?.name || name || code;
      const sector = resolveStockSector(code, finalName, typeof body.sector === "string" ? body.sector : undefined);

      const added = await addRollingWatchItem(userId, {
        code,
        name: finalName,
        board: board.board,
        sector,
        entry_ref_price: livePrice,
        buy_low: body.buy_low ? Number(body.buy_low) : tech.suggested_buy_low,
        buy_high: body.buy_high ? Number(body.buy_high) : tech.suggested_buy_high,
        breakout_price: body.breakout_price ? Number(body.breakout_price) : tech.suggested_breakout,
        invalid_price: body.invalid_price ? Number(body.invalid_price) : tech.suggested_invalid,
        vol_ratio_5_20: tech.vol_ratio_5_20,
        limit_up_count_1y: tech.limit_up_count_1y,
        thesis:
          typeof body.thesis === "string" && body.thesis.trim()
            ? body.thesis.trim()
            : `手动加入5日观察池（5日/20日量比 ${tech.vol_ratio_5_20 ?? "--"}x，近1年 ${tech.limit_up_count_1y} 次涨停）`,
      });
      if (!added) return fail("该标的已在你的5日观察池中", 409);
      return NextResponse.json({ success: true, item: added });
    }

    if (action === "drop") {
      const id = Number(body.id);
      if (!Number.isSafeInteger(id) || id <= 0) return fail("记录 ID 无效", 400);
      const ok = await dropRollingWatchItem(id, userId, typeof body.reason === "string" ? body.reason : "手动放弃");
      return ok ? NextResponse.json({ success: true }) : fail("观察记录不存在或已归档", 404);
    }

    if (action === "convert") {
      const id = Number(body.id);
      const quantity = Number(body.quantity || 100);
      const price = Number(body.price || 0);
      if (!Number.isSafeInteger(id) || id <= 0) return fail("记录 ID 无效", 400);
      if (!Number.isSafeInteger(quantity) || quantity <= 0) return fail("买入股数必须为正整数", 400);
      if (!Number.isFinite(price) || price <= 0) return fail("成交价格必须为正数", 400);
      const ok = await convertWatchItemToHolding(id, userId, {
        quantity,
        price,
        signal: typeof body.signal === "string" ? body.signal : undefined,
      });
      return ok ? NextResponse.json({ success: true, message: "已转入实盘持仓监控" }) : fail("观察记录不存在", 404);
    }

    return fail("不支持的操作类型", 400);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "操作失败", 400);
  }
}
