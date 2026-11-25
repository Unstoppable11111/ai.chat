import { NextResponse } from "next/server";
import {
  getUserHoldings,
  addUserHolding,
  updateUserHolding,
  deleteUserHolding,
  type HoldingInput,
} from "@/lib/portfolio-db";
import { readJsonBody, requestOwner, sameOrigin } from "@/lib/server-security";
import {
  fetchAllSectorsList,
  fetchStockDailyKline,
  getRealStockQuotes,
} from "@/lib/quotes-service";
import {
  computeStockTechnicals,
  evaluateHoldingSwingSignals,
} from "@/lib/quant-arena/swing-rules";
import {
  findSectorPerformance,
  resolveStockSector,
} from "@/lib/quant-arena/holding-ai-advisor";

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });
const positiveId = (value: unknown) => Number.isSafeInteger(Number(value)) && Number(value) > 0;

function parseReboundPricesInput(raw: unknown): number[] | null {
  if (raw === null || raw === "") return null;
  if (Array.isArray(raw)) {
    const arr = raw.map(Number).filter((n) => Number.isFinite(n) && n > 0 && n < 1e6);
    return arr.length ? arr.slice(0, 6) : null;
  }
  if (typeof raw === "string") {
    const arr = raw
      .split(/[,，\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0 && n < 1e6);
    return arr.length ? arr.slice(0, 6) : null;
  }
  throw new Error("修复观察位格式不正确");
}

function validateFields(body: Record<string, unknown>, partial = false): Partial<HoldingInput> {
  const patch: Partial<HoldingInput> = {};

  if (!partial || body.quantity !== undefined) {
    const value = Number(body.quantity);
    if (!Number.isSafeInteger(value) || value <= 0 || value > 1e9) {
      throw new Error("数量必须为有效正整数");
    }
    patch.quantity = value;
  }

  if (body.available_quantity !== undefined && body.available_quantity !== null && body.available_quantity !== "") {
    const avail = Number(body.available_quantity);
    if (!Number.isSafeInteger(avail) || avail < 0 || avail > 1e9) {
      throw new Error("可卖股数必须为非负整数");
    }
    patch.available_quantity = avail;
  }

  if (!partial || body.cost_price !== undefined) {
    const value = Number(body.cost_price);
    if (!Number.isFinite(value) || value <= 0 || value > 1e6) {
      throw new Error("成本价必须为有效正数");
    }
    patch.cost_price = value;
  }

  if (!partial || body.hold_type !== undefined) {
    if (!["core", "trend", "attack", "trial"].includes(String(body.hold_type))) {
      throw new Error("持仓类型不正确");
    }
    patch.hold_type = body.hold_type as HoldingInput["hold_type"];
  }

  if (body.position_mode !== undefined) {
    if (!["swing_normal", "deep_drawdown_recovery"].includes(String(body.position_mode))) {
      throw new Error("持仓模式不正确");
    }
    patch.position_mode = body.position_mode as HoldingInput["position_mode"];
  }

  if (body.support_defense_price !== undefined) {
    if (body.support_defense_price === null || body.support_defense_price === "") {
      patch.support_defense_price = null;
    } else {
      const val = Number(body.support_defense_price);
      if (!Number.isFinite(val) || val <= 0 || val > 1e6) {
        throw new Error("前低防守位必须为有效正数");
      }
      patch.support_defense_price = val;
    }
  }

  if (body.peak_price_since_entry !== undefined) {
    if (body.peak_price_since_entry === null || body.peak_price_since_entry === "") {
      patch.peak_price_since_entry = null;
    } else {
      const val = Number(body.peak_price_since_entry);
      if (!Number.isFinite(val) || val <= 0 || val > 1e6) {
        throw new Error("波段最高价必须为有效正数");
      }
      patch.peak_price_since_entry = val;
    }
  }

  if (body.rebound_watch_prices !== undefined) {
    patch.rebound_watch_prices = parseReboundPricesInput(body.rebound_watch_prices);
  }

  for (const [key, min, max, label] of [
    ["take_profit_pct_1", 1, 500, "一档止盈幅度"],
    ["take_profit_pct_2", 1, 1000, "二档止盈幅度"],
    ["trailing_pullback_pct", 1, 50, "移动止盈回撤幅度"],
    ["stop_loss_pct", -50, -0.5, "硬止损幅度"],
  ] as const) {
    if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
      const v = Number(body[key]);
      if (!Number.isFinite(v) || v < min || v > max) {
        throw new Error(`${label}超出合理范围 (${min}% ~ ${max}%)`);
      }
      patch[key] = v;
    }
  }

  if (body.suppress_cost_stoploss !== undefined) {
    patch.suppress_cost_stoploss = Boolean(body.suppress_cost_stoploss);
  }

  for (const [field, maxLen] of [
    ["stock_name", 64],
    ["sector", 64],
    ["entry_date", 20],
    ["thesis", 1000],
    ["notes", 2000],
  ] as const) {
    if (body[field] !== undefined && body[field] !== null) {
      if (typeof body[field] !== "string" || body[field].length > maxLen) {
        throw new Error(`${field} 长度不正确`);
      }
      patch[field] = body[field].trim();
    }
  }

  return patch;
}

export async function GET(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);

  try {
    const rawHoldings = await getUserHoldings(userId);
    if (!rawHoldings.length) {
      return NextResponse.json(
        {
          success: true,
          raw_holdings: [],
          diagnose: {
            data_status: "REALTIME",
            summary: {
              total_market_value: 0,
              total_cost: 0,
              total_pnl: 0,
              total_pnl_pct: 0,
              holdings_count: 0,
              market_state: "空仓观察",
              overall_action: "暂无实盘持仓",
              diagnose_time: new Date().toISOString(),
            },
            diagnosed_holdings: [],
          },
          is_live: true,
          data_status: "REALTIME",
        },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const codes = rawHoldings.map((h) => h.stock_code);
    const [quotes, sectorList, klineEntries] = await Promise.all([
      getRealStockQuotes(codes),
      fetchAllSectorsList().catch(() => []),
      Promise.all(
        [...new Set(codes)].map(async (code) => {
          const bars = await fetchStockDailyKline(code, 90).catch(() => []);
          return [code, bars] as const;
        })
      ),
    ]);
    const klineMap = new Map(klineEntries);

    let totalCost = 0;
    let totalMarketValue = 0;
    let hasAnyEscalation = false;
    let actionCount = 0;

    const diagnosedHoldings = rawHoldings.map((h) => {
      const cleanCode = h.stock_code.replace(/^(sh|sz|bj)/i, "");
      const quote = quotes[h.stock_code] || quotes[cleanCode];
      const hasQuote = Boolean(quote && quote.current_price > 0);
      const bars = klineMap.get(h.stock_code) || klineMap.get(cleanCode) || [];
      const liveInput = quote
        ? {
            price: quote.current_price,
            prev_close: quote.pre_close,
            open: quote.open,
            high: quote.high,
            low: quote.low,
            change_pct: quote.change_pct,
            volume: quote.volume,
            amount: quote.amount,
            vol_ratio: quote.vol_ratio,
            turnover_pct: quote.turnover_pct,
          }
        : null;

      const tech = computeStockTechnicals(bars, cleanCode, liveInput);
      const resolvedSector = resolveStockSector(cleanCode, h.stock_name, h.sector || undefined);
      const sectorPerf = findSectorPerformance(resolvedSector, sectorList);

      const evalResult = evaluateHoldingSwingSignals(
        {
          code: cleanCode,
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

      const currentPrice = hasQuote ? evalResult.price : h.cost_price;
      const costVal = h.cost_price * h.quantity;
      const mktVal = currentPrice * h.quantity;
      totalCost += costVal;
      totalMarketValue += mktVal;

      if (evalResult.llm_escalate) hasAnyEscalation = true;
      if (evalResult.highest_severity === "ACTION") actionCount++;

      // 若现价创入场后波段新高，异步更新 peak_price_since_entry（不阻塞主响应）
      if (
        hasQuote &&
        evalResult.peak_price_candidate > (h.peak_price_since_entry || h.cost_price)
      ) {
        void updateUserHolding(h.id, userId, {
          peak_price_since_entry: evalResult.peak_price_candidate,
        }).catch(() => {});
      }

      const primarySignal = evalResult.signals[0];
      const riskLevel =
        evalResult.highest_severity === "ACTION"
          ? "高风险预警"
          : evalResult.highest_severity === "WATCH"
          ? "异动关注"
          : "受控";

      return {
        id: h.id,
        code: cleanCode,
        name: h.stock_name,
        board: evalResult.board,
        quantity: h.quantity,
        available_quantity: h.available_quantity ?? h.quantity,
        cost_price: h.cost_price,
        current_price: currentPrice,
        market_value: mktVal,
        pnl: mktVal - costVal,
        pnl_pct: evalResult.pnl_pct,
        day_change_pct: evalResult.change_pct,
        open: evalResult.open,
        high: evalResult.high,
        low: evalResult.low,
        amplitude_pct: evalResult.amplitude_pct,
        pullback_from_high_pct: evalResult.pullback_from_high_pct,
        rebound_from_low_pct: evalResult.rebound_from_low_pct,
        vol_ratio: evalResult.vol_ratio,
        turnover_pct: evalResult.turnover_pct,
        hold_type: h.hold_type,
        position_mode: evalResult.position_mode,
        sector: resolvedSector,
        sector_change_pct: sectorPerf.change_pct,
        entry_date: h.entry_date,
        support_defense_price: h.support_defense_price,
        rebound_watch_prices: h.rebound_watch_prices,
        peak_price_since_entry: evalResult.peak_price_candidate,
        take_profit_pct_1: h.take_profit_pct_1 ?? 15,
        take_profit_pct_2: h.take_profit_pct_2 ?? 25,
        trailing_pullback_pct: h.trailing_pullback_pct ?? 7,
        stop_loss_pct: h.stop_loss_pct ?? -8,
        suppress_cost_stoploss: Boolean(h.suppress_cost_stoploss),
        stop_loss_price: evalResult.stop_loss_price,
        technicals: tech,
        signals: evalResult.signals,
        highest_severity: evalResult.highest_severity,
        llm_escalate: evalResult.llm_escalate,
        escalate_reasons: evalResult.escalate_reasons,
        action: evalResult.recommendation,
        advice_reason: primarySignal?.message || evalResult.recommendation,
        risk_level: riskLevel,
        quote_available: hasQuote,
        thesis: h.thesis,
        notes: h.notes,
      };
    });

    const totalPnl = totalMarketValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return NextResponse.json(
      {
        success: true,
        raw_holdings: rawHoldings,
        diagnose: {
          data_status: "REALTIME",
          summary: {
            total_market_value: totalMarketValue,
            total_cost: totalCost,
            total_pnl: totalPnl,
            total_pnl_pct: totalPnlPct,
            holdings_count: rawHoldings.length,
            market_state: hasAnyEscalation ? "盘中异动需关注" : "波段纪律运行中",
            overall_action:
              actionCount > 0
                ? `有 ${actionCount} 只触及风控/止盈动作`
                : totalPnl >= 0
                ? "组合浮盈健康持有"
                : "防守观望严控回撤",
            diagnose_time: new Date().toISOString(),
          },
          diagnosed_holdings: diagnosedHoldings,
        },
        is_live: true,
        data_status: "REALTIME",
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[api-portfolio] GET error:", err);
    return fail("持仓存储不可用，请稍后重试", 503);
  }
}

export async function POST(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);
  if (!sameOrigin(request)) return fail("请求来源不允许", 403);

  let item: HoldingInput;
  try {
    const body = await readJsonBody(request, 16384);
    const code = String(body.stock_code || "").trim();
    if (!/^\d{6}$/.test(code)) return fail("股票代码必须为6位数字", 400);
    const patch = validateFields(body);
    item = {
      stock_code: code,
      stock_name: patch.stock_name || code,
      quantity: patch.quantity!,
      available_quantity: patch.available_quantity ?? patch.quantity!,
      cost_price: patch.cost_price!,
      hold_type: patch.hold_type!,
      sector: patch.sector || null,
      position_mode: patch.position_mode || "swing_normal",
      entry_date: patch.entry_date || null,
      support_defense_price: patch.support_defense_price ?? null,
      rebound_watch_prices: patch.rebound_watch_prices ?? null,
      peak_price_since_entry: patch.peak_price_since_entry ?? patch.cost_price!,
      take_profit_pct_1: patch.take_profit_pct_1 ?? 15,
      take_profit_pct_2: patch.take_profit_pct_2 ?? 25,
      trailing_pullback_pct: patch.trailing_pullback_pct ?? 7,
      stop_loss_pct: patch.stop_loss_pct ?? -8,
      suppress_cost_stoploss: patch.suppress_cost_stoploss ?? false,
      thesis: patch.thesis || null,
      notes: patch.notes || "",
    };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "参数不正确", 400);
  }

  try {
    return NextResponse.json({ success: true, item: await addUserHolding(userId, item) }, { status: 201 });
  } catch {
    return fail("保存失败，数据未写入，请稍后重试", 503);
  }
}

export async function PUT(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);
  if (!sameOrigin(request)) return fail("请求来源不允许", 403);

  let id: number;
  let patch: Partial<HoldingInput>;
  try {
    const body = await readJsonBody(request, 16384);
    if (!positiveId(body.id)) return fail("持仓 ID 不正确", 400);
    id = Number(body.id);
    patch = validateFields(body, true);
    if (!Object.keys(patch).length) return fail("没有可更新的字段", 400);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "参数不正确", 400);
  }

  try {
    return (await updateUserHolding(id, userId, patch))
      ? NextResponse.json({ success: true })
      : fail("持仓不存在", 404);
  } catch {
    return fail("更新失败，请稍后重试", 503);
  }
}

export async function DELETE(request: Request) {
  const userId = await requestOwner(request);
  if (!userId) return fail("请先登录", 401);
  if (!sameOrigin(request)) return fail("请求来源不允许", 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!positiveId(id)) return fail("持仓 ID 不正确", 400);
  try {
    return (await deleteUserHolding(Number(id), userId))
      ? NextResponse.json({ success: true })
      : fail("持仓不存在", 404);
  } catch {
    return fail("删除失败，请稍后重试", 503);
  }
}
