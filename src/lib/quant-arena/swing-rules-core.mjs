/**
 * A股沪深主板与创业板波段风控、市场情绪红绿灯与 5 日轮动买点纯规则核心
 * 使用纯 ESM (.mjs) 编写，同时供 Next.js 服务端/客户端与 Node.js 原生单测直接运行。
 */

function roundOpt(val, digits = 2) {
  if (val === null || val === undefined || !Number.isFinite(val)) return null;
  return Number(val.toFixed(digits));
}

function mean(nums) {
  if (!nums.length) return null;
  return nums.reduce((acc, n) => acc + n, 0) / nums.length;
}

export function classifyAShareBoard(rawCode, name = "") {
  const code = String(rawCode || "").replace(/^(sh|sz|bj)/i, "").trim();
  const upperName = String(name || "").toUpperCase();
  if (upperName.includes("ST") || upperName.includes("退")) {
    return { code, board: "ST风险", allowed: false, limitPct: 5, reason: "ST或退市警示股" };
  }
  if (/^(51|56|58|159)/.test(code)) {
    return { code, board: "ETF", allowed: false, limitPct: 10, reason: "ETF基金不在选股范围" };
  }
  if (/^688/.test(code)) {
    return { code, board: "科创板", allowed: false, limitPct: 20, reason: "科创板不在选股范围" };
  }
  if (/^(4|8|92)/.test(code)) {
    return { code, board: "北交所", allowed: false, limitPct: 30, reason: "北交所不在选股范围" };
  }
  if (/^(300|301)/.test(code)) {
    return { code, board: "创业板", allowed: true, limitPct: 20 };
  }
  if (/^(600|601|603|605)/.test(code)) {
    return { code, board: "沪市主板", allowed: true, limitPct: 10 };
  }
  if (/^(000|001|002|003)/.test(code)) {
    return { code, board: "深市主板", allowed: true, limitPct: 10 };
  }
  return { code, board: "其他", allowed: false, limitPct: 10, reason: "非沪深主板/创业板" };
}

export function evaluateMarketTrafficLight(score, minPullback = 30, minBreakout = 55) {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return {
      light: "YELLOW",
      label: "黄灯·情绪待核实",
      score: null,
      allow_pullback_buy: true,
      allow_breakout_buy: false,
      summary: "情绪数据暂未就绪，谨慎对待右侧放量追涨",
    };
  }
  const rounded = Number(score.toFixed(1));
  if (rounded < minPullback) {
    return {
      light: "RED",
      label: `红灯·冰点防守(${rounded}分)`,
      score: rounded,
      allow_pullback_buy: false,
      allow_breakout_buy: false,
      summary: `全市场情绪低于${minPullback}分冰点线，屏蔽全部新增买点，以风控防守为主`,
    };
  }
  if (rounded < minBreakout) {
    return {
      light: "YELLOW",
      label: `黄灯·分歧谨慎(${rounded}分)`,
      score: rounded,
      allow_pullback_buy: true,
      allow_breakout_buy: false,
      summary: "放行买点A(缩量回踩企稳低吸)，屏蔽买点B右侧突破防炸板",
    };
  }
  return {
    light: "GREEN",
    label: `绿灯·偏强可攻(${rounded}分)`,
    score: rounded,
    allow_pullback_buy: true,
    allow_breakout_buy: true,
    summary: "市场情绪活跃，买点A(回踩低吸)与买点B(放量突破共振)均放行",
  };
}

function getElapsedTradingFraction(now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === "hour")?.value || 0);
    const m = Number(parts.find((p) => p.type === "minute")?.value || 0);
    const totalMin = h * 60 + m;
    if (totalMin < 570) return 1.0; // 盘前视同上日完整收盘
    if (totalMin <= 690) return Math.max(10, totalMin - 570) / 240; // 上午盘 09:30-11:30
    if (totalMin < 780) return 120 / 240; // 午休
    if (totalMin <= 900) return Math.min(240, 120 + (totalMin - 780)) / 240; // 下午盘 13:00-15:00
    return 1.0; // 收盘后
  } catch {
    return 1.0;
  }
}

export function computeStockTechnicals(bars, code = "", liveQuote = undefined) {
  const list = [...bars];
  if (liveQuote && liveQuote.price > 0 && list.length > 0) {
    const last = list[list.length - 1];
    const quoteDate = typeof liveQuote.quote_date === "string" ? liveQuote.quote_date.slice(0, 10) : "";
    if (quoteDate && last.date && quoteDate > last.date) {
      // 当实时行情属于新的交易日时追加今日实时K线，严禁覆盖昨日收盘K线
      list.push({
        date: quoteDate,
        open: liveQuote.open || liveQuote.price,
        close: liveQuote.price,
        high: liveQuote.high || liveQuote.price,
        low: liveQuote.low || liveQuote.price,
        volume: liveQuote.volume && liveQuote.volume > 0 ? liveQuote.volume : 0,
      });
    } else {
      list[list.length - 1] = {
        ...last,
        close: liveQuote.price,
        high: Math.max(last.high, liveQuote.high || liveQuote.price),
        low: Math.min(last.low, liveQuote.low || liveQuote.price),
        volume: liveQuote.volume && liveQuote.volume > 0 ? liveQuote.volume : last.volume,
      };
    }
  }

  if (!list.length) {
    return {
      latest_date: null,
      latest_close: null,
      ma5: null,
      ma10: null,
      ma20: null,
      ma60: null,
      dist_ma5_pct: null,
      dist_ma20_pct: null,
      amp_20d_pct: null,
      above_ma20: false,
      vol_ratio_5_20: null,
      avg_vol_5d: null,
      ret_5d_pct: null,
      ret_20d_pct: null,
      high_60d: null,
      low_20d: null,
      high_52w: null,
      low_52w: null,
      pos_52w_pct: null,
      limit_up_count_1y: 0,
      suggested_buy_low: null,
      suggested_buy_high: null,
      suggested_breakout: null,
      suggested_invalid: null,
    };
  }

  const closes = list.map((b) => b.close);
  const highs = list.map((b) => b.high);
  const lows = list.map((b) => b.low);
  const vols = list.map((b) => b.volume);

  const latest = list[list.length - 1];
  const latestClose = latest.close;

  const tail = (arr, n) => arr.slice(Math.max(0, arr.length - n));
  const ma5 = mean(tail(closes, 5));
  const ma10 = mean(tail(closes, 10));
  const ma20 = mean(tail(closes, 20));
  const ma60 = closes.length >= 60 ? mean(tail(closes, 60)) : null;

  const vol5 = mean(tail(vols, 5));
  const completedPrev5 = vols.length >= 6 ? vols.slice(-6, -1) : tail(vols, 5);
  const avgVol5d = mean(completedPrev5);
  const prev20Vols = vols.length >= 25 ? vols.slice(-25, -5) : tail(vols, 20);
  const volPrev20 = mean(prev20Vols);
  const volRatio5To20 = vol5 && volPrev20 && volPrev20 > 0 ? vol5 / volPrev20 : null;

  const base5 = closes.length >= 6 ? closes[closes.length - 6] : closes[0];
  const base20 = closes.length >= 21 ? closes[closes.length - 21] : closes[0];
  const ret5d = base5 > 0 ? ((latestClose - base5) / base5) * 100 : null;
  const ret20d = base20 > 0 ? ((latestClose - base20) / base20) * 100 : null;

  const high60d = Math.max(...tail(highs, 60));
  const low20d = Math.min(...tail(lows, 20));
  const recent20Bars = tail(list, 20);
  const ampValues = [];
  for (let i = 0; i < recent20Bars.length; i++) {
    const b = recent20Bars[i];
    const base = b.open > 0 ? b.open : b.close;
    if (base > 0 && b.high >= b.low) {
      ampValues.push(((b.high - b.low) / base) * 100);
    }
  }
  const amp20dPct = mean(ampValues);
  const distMa5Pct = ma5 && ma5 > 0 ? ((latestClose - ma5) / ma5) * 100 : null;
  const distMa20Pct = ma20 && ma20 > 0 ? ((latestClose - ma20) / ma20) * 100 : null;
  const high52w = Math.max(...tail(highs, 250));
  const low52w = Math.min(...tail(lows, 250));
  const pos52wPct =
    high52w > low52w ? ((latestClose - low52w) / (high52w - low52w)) * 100 : 50;

  const board = classifyAShareBoard(code);
  const limitThreshold = board.limitPct >= 20 ? 19.6 : 9.8;
  let limitUpCount1Y = 0;
  const startIdx = Math.max(1, list.length - 250);
  for (let i = startIdx; i < list.length; i++) {
    const prevClose = list[i - 1].close;
    if (prevClose > 0) {
      const pct = ((list[i].close - prevClose) / prevClose) * 100;
      if (pct >= limitThreshold) limitUpCount1Y++;
    }
  }

  const anchorLow = ma10 ?? latestClose * 0.96;
  const anchorHigh = ma5 ?? latestClose * 1.005;
  const buyLow = roundOpt(Math.min(anchorLow, latestClose * 0.97));
  const buyHigh = roundOpt(Math.min(Math.max(anchorHigh, latestClose * 0.985), latestClose * 1.008));
  const breakoutPrice = roundOpt(Math.max(high60d * 0.995, latestClose * 1.02));
  const invalidCandidates = [
    ma20 ? ma20 * 0.97 : latestClose * 0.92,
    low20d * 0.99,
    latestClose * 0.92,
  ];
  const suggestedInvalid = roundOpt(Math.min(...invalidCandidates));

  return {
    latest_date: latest.date,
    latest_close: roundOpt(latestClose),
    ma5: roundOpt(ma5),
    ma10: roundOpt(ma10),
    ma20: roundOpt(ma20),
    ma60: roundOpt(ma60),
    dist_ma5_pct: roundOpt(distMa5Pct),
    dist_ma20_pct: roundOpt(distMa20Pct),
    amp_20d_pct: roundOpt(amp20dPct),
    above_ma20: Boolean(ma20 && latestClose >= ma20),
    vol_ratio_5_20: roundOpt(volRatio5To20),
    avg_vol_5d: roundOpt(avgVol5d, 0),
    ret_5d_pct: roundOpt(ret5d),
    ret_20d_pct: roundOpt(ret20d),
    high_60d: roundOpt(high60d),
    low_20d: roundOpt(low20d),
    high_52w: roundOpt(high52w),
    low_52w: roundOpt(low52w),
    pos_52w_pct: roundOpt(pos52wPct, 1),
    limit_up_count_1y: limitUpCount1Y,
    suggested_buy_low: buyLow,
    suggested_buy_high: buyHigh,
    suggested_breakout: breakoutPrice,
    suggested_invalid: suggestedInvalid,
  };
}

function resolveLiveVolRatio(liveQuote, tech, fallback = 0) {
  const direct = Number(liveQuote?.vol_ratio || 0);
  if (direct > 0) return direct;
  if (liveQuote?.volume > 0 && tech?.avg_vol_5d && tech.avg_vol_5d > 0) {
    const frac = getElapsedTradingFraction();
    const projectedVol = frac > 0 ? liveQuote.volume / frac : liveQuote.volume;
    return Number((projectedVol / tech.avg_vol_5d).toFixed(2));
  }
  return fallback;
}

export function evaluateHoldingSwingSignals(holding, liveQuote, tech, sectorChangePct) {
  const boardInfo = classifyAShareBoard(holding.code, holding.name);
  const rawMode =
    holding.position_mode === "deep_drawdown_recovery"
      ? "deep_drawdown_recovery"
      : "swing_normal";
  const suppressCostSl = Boolean(holding.suppress_cost_stoploss);
  const cost = Number(holding.cost_price) || 0;
  const shares = Number(holding.quantity) || 0;
  const livePriceEst = Number(liveQuote?.price || 0);
  const estPnlPct = cost > 0 && livePriceEst > 0 ? ((livePriceEst - cost) / cost) * 100 : 0;
  const mode =
    rawMode === "deep_drawdown_recovery" || suppressCostSl || estPnlPct <= -12
      ? "deep_drawdown_recovery"
      : "swing_normal";

  const slPct = Number.isFinite(Number(holding.stop_loss_pct)) ? Number(holding.stop_loss_pct) : -8.0;
  const manualSupport =
    holding.support_defense_price && holding.support_defense_price > 0
      ? Number(holding.support_defense_price)
      : null;
  const autoSupport =
    tech?.low_20d && tech.low_20d > 0
      ? Number((tech.low_20d * 0.995).toFixed(2))
      : livePriceEst > 0
      ? Number((livePriceEst * 0.94).toFixed(2))
      : null;
  const effectiveSupport = manualSupport ?? (mode === "deep_drawdown_recovery" ? autoSupport : null);
  const fallbackStopLoss =
    mode === "deep_drawdown_recovery" && effectiveSupport
      ? effectiveSupport
      : Number((cost * (1 + slPct / 100)).toFixed(2));

  if (!liveQuote || !Number.isFinite(liveQuote.price) || liveQuote.price <= 0) {
    return {
      code: holding.code,
      name: holding.name,
      board: boardInfo.board,
      position_mode: mode,
      status: "data_error",
      price: cost,
      change_pct: 0,
      open: cost,
      high: cost,
      low: cost,
      amplitude_pct: 0,
      pullback_from_high_pct: 0,
      rebound_from_low_pct: 0,
      pnl_pct: 0,
      pnl_yuan: 0,
      market_value_yuan: Number((cost * shares).toFixed(2)),
      stop_loss_price: fallbackStopLoss,
      peak_price_candidate: Number(holding.peak_price_since_entry || cost),
      vol_ratio: 0,
      turnover_pct: 0,
      technicals: tech,
      signals: [
        {
          key: "data_missing",
          severity: "ERROR",
          llm_escalate: false,
          message: `${holding.name}(${holding.code}) 实时行情缺失，暂停给出操作信号`,
        },
      ],
      llm_escalate: false,
      escalate_reasons: [],
      highest_severity: "ERROR",
      recommendation: "行情缺失暂停判断",
    };
  }

  const price = Number(liveQuote.price);
  const prevClose = Number(liveQuote.prev_close || price);
  const openP = Number(liveQuote.open || price);
  const highP = Number(liveQuote.high || price);
  const lowP = Number(liveQuote.low || price);
  const chgPct =
    liveQuote.change_pct !== undefined && Number.isFinite(liveQuote.change_pct)
      ? Number(liveQuote.change_pct)
      : prevClose > 0
      ? Number((((price - prevClose) / prevClose) * 100).toFixed(2))
      : 0;
  const volRatio = resolveLiveVolRatio(liveQuote, tech, 0);
  const turnoverPct = Number(liveQuote.turnover_pct || 0);

  const amplitudePct = prevClose > 0 ? Number((((highP - lowP) / prevClose) * 100).toFixed(2)) : 0;
  const pullbackFromHighPct = highP > 0 ? Number((((highP - price) / highP) * 100).toFixed(2)) : 0;
  const reboundFromLowPct = lowP > 0 ? Number((((price - lowP) / lowP) * 100).toFixed(2)) : 0;

  const pnlPct = cost > 0 ? Number((((price - cost) / cost) * 100).toFixed(2)) : 0;
  const pnlYuan = cost > 0 ? Number(((price - cost) * shares).toFixed(2)) : 0;
  const mktValYuan = Number((price * shares).toFixed(2));

  const peakPrice = Math.max(Number(holding.peak_price_since_entry || price), price);
  const peakGainPct = cost > 0 ? Number((((peakPrice - cost) / cost) * 100).toFixed(2)) : 0;
  const pullbackFromPeakPct =
    peakPrice > 0 ? Number((((peakPrice - price) / peakPrice) * 100).toFixed(2)) : 0;

  const tp1 = Number(holding.take_profit_pct_1 ?? 15.0);
  const tp2 = Number(holding.take_profit_pct_2 ?? 25.0);
  const trailAct = tp1;
  const trailPb = Number(holding.trailing_pullback_pct ?? 7.0);
  const manualRebounds = Array.isArray(holding.rebound_watch_prices)
    ? holding.rebound_watch_prices.map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : [];
  const reboundLevels =
    manualRebounds.length > 0
      ? manualRebounds
      : [tech?.ma20, tech?.ma60].filter((n) => typeof n === "number" && Number.isFinite(n) && n > 0);
  const supportPrice = effectiveSupport;
  const ma20 = tech?.ma20 ?? null;

  const signals = [];
  const add = (key, severity, message, llmEscalate = false) => {
    signals.push({ key, severity, llm_escalate: llmEscalate, message });
  };

  if (pnlPct >= tp2) {
    add(
      "take_profit_2",
      "ACTION",
      `浮盈达 +${pnlPct.toFixed(2)}%（>= +${tp2.toFixed(0)}%二档目标），建议兑现主仓位锁利`,
      true
    );
  } else if (pnlPct >= tp1) {
    add(
      "take_profit_1",
      "ACTION",
      `浮盈达 +${pnlPct.toFixed(2)}%（>= +${tp1.toFixed(0)}%一档目标），达到波段止盈区间，建议分批止盈`,
      true
    );
  } else if (peakGainPct >= trailAct && pullbackFromPeakPct >= trailPb && pnlPct > 0) {
    add(
      "trailing_take_profit",
      "ACTION",
      `波段高点回撤达 ${pullbackFromPeakPct.toFixed(2)}%（>= ${trailPb.toFixed(0)}%），建议启动移动止盈保护利润`,
      true
    );
  }

  if (mode === "deep_drawdown_recovery") {
    if (supportPrice !== null && price <= supportPrice) {
      add(
        "support_breach",
        "ACTION",
        `现价 ¥${price.toFixed(2)} 跌破前低关键防守位 ¥${supportPrice.toFixed(2)}，触发风控减仓预警`,
        true
      );
    } else if (supportPrice !== null && price <= supportPrice * 1.03) {
      add(
        "support_near",
        "WATCH",
        `现价 ¥${price.toFixed(2)} 逼近防守支撑位 ¥${supportPrice.toFixed(2)}（距今 ${(((price - supportPrice) / price) * 100).toFixed(1)}%），密切观察资金承接`,
        false
      );
    }

    const crossed = reboundLevels.filter((lv) => price >= lv);
    if (crossed.length > 0) {
      const topLv = Math.max(...crossed);
      add(
        `rebound_above_${topLv.toFixed(2)}`,
        "WATCH",
        `现价 ¥${price.toFixed(2)} 站上修复观察位 ¥${topLv.toFixed(2)}，留意放量持续性`,
        true
      );
    } else if (ma20 && price < ma20) {
      add(
        "below_ma20_drawdown_watch",
        "WATCH",
        `现价 ¥${price.toFixed(2)} 位于 MA20(¥${ma20.toFixed(2)}) 下方，重点盯防支撑位 ¥${supportPrice ? supportPrice.toFixed(2) : fallbackStopLoss.toFixed(2)}，未放量收复 MA20 前勿盲目补仓`,
        false
      );
    }
    if (pnlPct >= 0) {
      add(
        "breakeven_recovered",
        "WATCH",
        `已实现回本（现价 ¥${price.toFixed(2)} >= 成本 ¥${cost.toFixed(2)}），可转入标准止盈模式`,
        true
      );
    }
  } else {
    if (!suppressCostSl && pnlPct <= slPct) {
      add(
        "hard_stop_loss",
        "ACTION",
        `浮亏 ${pnlPct.toFixed(2)}% 触及硬止损线 ${slPct.toFixed(0)}%，建议执行风控减仓/止损`,
        true
      );
    }
    if (ma20 && price < ma20 && sectorChangePct !== null && sectorChangePct <= -1.5) {
      add(
        "ma20_sector_weak",
        "ACTION",
        `现价 ¥${price.toFixed(2)} 跌破MA20(¥${ma20.toFixed(2)})且所属板块跌 ${sectorChangePct.toFixed(2)}%，趋势转弱预警`,
        true
      );
    }
  }

  if (Math.abs(chgPct) >= 5.0) {
    const dir = chgPct > 0 ? "急拉" : "急跌";
    add(
      `intraday_move_${chgPct > 0 ? "up" : "down"}`,
      "WATCH",
      `日内${dir} ${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}%（振幅 ${amplitudePct.toFixed(2)}%），触发异动研判`,
      true
    );
  }
  if (highP >= prevClose * 1.03 && pullbackFromHighPct >= 5.0) {
    add(
      "intraday_high_pullback",
      "WATCH",
      `日内冲高大幅回落：最高 ¥${highP.toFixed(2)} 回撤 -${pullbackFromHighPct.toFixed(2)}% 至 ¥${price.toFixed(2)}（振幅 ${amplitudePct.toFixed(2)}%）`,
      true
    );
  }
  if (lowP <= prevClose * 0.97 && reboundFromLowPct >= 5.0) {
    add(
      "intraday_deep_v",
      "WATCH",
      `日内深V反抽：最低 ¥${lowP.toFixed(2)} 拉起 +${reboundFromLowPct.toFixed(2)}% 至 ¥${price.toFixed(2)}`,
      true
    );
  }
  if (amplitudePct >= 7.0 && !signals.some((s) => s.key === "intraday_high_pullback" || s.key === "intraday_deep_v")) {
    add(
      "intraday_wide_amplitude",
      "WATCH",
      `日内宽幅巨震（振幅 ${amplitudePct.toFixed(2)}%），注意主力资金博弈分歧`,
      true
    );
  }
  if (volRatio >= 2.5 && Math.abs(chgPct) >= 3.0) {
    add(
      "volume_surge_extreme",
      "WATCH",
      `巨量异动：量比 ${volRatio.toFixed(2)} 且涨跌 ${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}%`,
      true
    );
  }
  if (sectorChangePct !== null && Math.abs(sectorChangePct) >= 2.5) {
    add(
      `sector_move_${sectorChangePct > 0 ? "up" : "down"}`,
      "WATCH",
      `主板块[${holding.sector || "科技产业链"}]日内波动 ${sectorChangePct >= 0 ? "+" : ""}${sectorChangePct.toFixed(2)}%`,
      Math.abs(sectorChangePct) >= 3.0
    );
  }

  const actionSigs = signals.filter((s) => s.severity === "ACTION");
  const escReasons = signals.filter((s) => s.llm_escalate).map((s) => s.message);

  let recommendation = "趋势/仓位正常，继续波段持有";
  if (actionSigs.some((s) => s.key.startsWith("take_profit") || s.key === "trailing_take_profit")) {
    recommendation = "触发止盈规则，建议分批落袋";
  } else if (actionSigs.length > 0) {
    recommendation = "触发风控防守预警，建议复核减仓";
  } else if (mode === "deep_drawdown_recovery") {
    const defText = supportPrice ? `¥${supportPrice.toFixed(2)}` : `¥${fallbackStopLoss.toFixed(2)}`;
    recommendation =
      ma20 && price >= ma20
        ? `站上MA20右侧修复观察（防守位${defText}），暂持股待涨`
        : `深套修复防守：紧盯支撑位${defText}，未放量收复${ma20 ? `MA20(¥${ma20.toFixed(2)})` : "均线"}前勿盲目补仓`;
  } else if (pnlPct <= -8 && ma20 && price < ma20) {
    recommendation = `浮亏 ${pnlPct.toFixed(2)}% 且位于MA20(¥${ma20.toFixed(2)})下方，趋势偏弱严禁盲目补仓`;
  }

  return {
    code: holding.code,
    name: holding.name,
    board: boardInfo.board,
    position_mode: mode,
    status: "ok",
    price,
    change_pct: chgPct,
    open: openP,
    high: highP,
    low: lowP,
    amplitude_pct: amplitudePct,
    pullback_from_high_pct: pullbackFromHighPct,
    rebound_from_low_pct: reboundFromLowPct,
    pnl_pct: pnlPct,
    pnl_yuan: pnlYuan,
    market_value_yuan: mktValYuan,
    stop_loss_price: fallbackStopLoss,
    peak_price_candidate: peakPrice,
    vol_ratio: volRatio,
    turnover_pct: turnoverPct,
    technicals: tech,
    signals,
    llm_escalate: escReasons.length > 0,
    escalate_reasons: escReasons,
    highest_severity: actionSigs.length > 0 ? "ACTION" : signals.length > 0 ? "WATCH" : "INFO",
    recommendation,
  };
}

export function evaluateWatchlistSwingSignals(item, liveQuote, sectorChangePct, regime, tech = undefined) {
  if (!liveQuote || !Number.isFinite(liveQuote.price) || liveQuote.price <= 0) {
    return {
      code: item.code,
      name: item.name,
      observed_days: item.observed_days,
      max_days: item.max_days,
      price: null,
      change_pct: 0,
      vol_ratio: 0,
      dist_to_buy_high_pct: null,
      dist_to_breakout_pct: null,
      dist_to_invalid_pct: null,
      triggered_signal: null,
      signals: [],
      llm_escalate: false,
      escalate_reasons: [],
      status_summary: "实时行情缺失",
    };
  }

  const price = Number(liveQuote.price);
  const chgPct = Number(liveQuote.change_pct || 0);
  const volRatio = resolveLiveVolRatio(liveQuote, tech, Number(tech?.vol_ratio_5_20 || 1.0));

  const buyLow = item.buy_low;
  const buyHigh = item.buy_high;
  const breakoutP = item.breakout_price;
  const invalidP = item.invalid_price;

  const distToBuyHigh = buyHigh && buyHigh > 0 ? Number((((price - buyHigh) / buyHigh) * 100).toFixed(2)) : null;
  const distToBreakout = breakoutP && breakoutP > 0 ? Number((((breakoutP - price) / price) * 100).toFixed(2)) : null;
  const distToInvalid = invalidP && invalidP > 0 ? Number((((price - invalidP) / invalidP) * 100).toFixed(2)) : null;

  const signals = [];
  const add = (key, severity, message, llmEscalate = false) => {
    signals.push({ key, severity, llm_escalate: llmEscalate, message });
  };

  let triggered = null;

  const invalidHit = invalidP !== null && price < invalidP;
  if (invalidHit && chgPct <= -3.5) {
    triggered = "INVALIDATED";
    add(
      "watch_invalidated",
      "WATCH",
      `跌破失效线 ¥${invalidP.toFixed(2)}（现价 ¥${price.toFixed(2)}，${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}%），结构转弱建议放弃`,
      false
    );
  }

  const inPullbackZone = buyLow !== null && buyHigh !== null && price >= buyLow && price <= buyHigh;
  if (inPullbackZone) {
    if (!regime.allow_pullback_buy) {
      add(
        "buy_a_gated_red",
        "INFO",
        `进入低吸区 [¥${buyLow.toFixed(2)}, ¥${buyHigh.toFixed(2)}] 但市场红灯冰点，暂观望`,
        false
      );
    } else if (volRatio <= 1.05 && chgPct >= -0.5 && !invalidHit) {
      triggered = "BUY_A";
      add(
        "buy_point_pullback",
        "ACTION",
        `触发买点A（缩量回踩企稳）：现价 ¥${price.toFixed(2)} 位于低吸区 [¥${buyLow.toFixed(2)}, ¥${buyHigh.toFixed(2)}]，量比 ${volRatio.toFixed(2)}，日内 ${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}%`,
        true
      );
    } else {
      add(
        "approaching_pullback",
        "INFO",
        `进入低吸区 ¥${price.toFixed(2)}，等待缩量(量比<=1.05)且企稳翻红`,
        false
      );
    }
  }

  if (breakoutP !== null && price >= breakoutP) {
    const sectorOk = sectorChangePct === null || sectorChangePct >= 1.0;
    if (!regime.allow_breakout_buy) {
      add(
        "buy_b_gated",
        "INFO",
        `站上突破位 ¥${breakoutP.toFixed(2)}，但情绪闸门[${regime.label}]屏蔽右侧追涨`,
        false
      );
    } else if (volRatio >= 1.8 && chgPct >= 3.0 && chgPct <= 7.5 && sectorOk) {
      triggered = "BUY_B";
      add(
        "buy_point_breakout",
        "ACTION",
        `触发买点B（放量突破共振）：现价 ¥${price.toFixed(2)} >= 突破位 ¥${breakoutP.toFixed(2)}，量比 ${volRatio.toFixed(2)}，日内 +${chgPct.toFixed(2)}%`,
        true
      );
    }
  }

  const actionSig = signals.find((s) => s.severity === "ACTION");
  const statusSummary = actionSig
    ? actionSig.message
    : signals[0]?.message || `第 ${item.observed_days}/${item.max_days} 天观察中，未触及买卖点`;

  const escReasons = signals.filter((s) => s.llm_escalate).map((s) => s.message);

  return {
    code: item.code,
    name: item.name,
    observed_days: item.observed_days,
    max_days: item.max_days,
    price,
    change_pct: chgPct,
    vol_ratio: Number(volRatio.toFixed(2)),
    dist_to_buy_high_pct: distToBuyHigh,
    dist_to_breakout_pct: distToBreakout,
    dist_to_invalid_pct: distToInvalid,
    triggered_signal: triggered,
    signals,
    llm_escalate: escReasons.length > 0,
    escalate_reasons: escReasons,
    status_summary: statusSummary,
  };
}

export function countTradingWeekdaysBetween(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr || endDateStr <= startDateStr) return 0;
  const start = new Date(`${startDateStr.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${endDateStr.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return 0;
  let days = 0;
  const cur = new Date(start.getTime() + 86400000);
  while (cur.getTime() <= end.getTime()) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) days++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

/**
 * 5日推荐股信号自动模拟卖出规则（严格遵守 A 股 T+1）
 */
export function evaluateSignalPaperExit(trade, liveQuote, tech, tradeDateStr) {
  const buyPrice = Number(trade.buy_price) || 0;
  const price = Number(liveQuote?.price || 0);
  const prevPeak = Math.max(Number(trade.peak_price || buyPrice), buyPrice);

  if (price <= 0 || buyPrice <= 0) {
    return {
      should_sell: false,
      sell_signal: null,
      sell_price: null,
      sell_reason: null,
      pnl_pct: 0,
      is_win: null,
      peak_price_candidate: prevPeak,
      hold_days: Number(trade.hold_days || 0),
      t_plus_1_locked: false,
    };
  }

  const pnlPct = Number((((price - buyPrice) / buyPrice) * 100).toFixed(2));
  const nextPeak = Math.max(prevPeak, Number(liveQuote?.high || price), price);
  const peakGainPct = ((nextPeak - buyPrice) / buyPrice) * 100;
  const drawdownFromPeakPct = nextPeak > 0 ? ((nextPeak - price) / nextPeak) * 100 : 0;

  const computedDays = countTradingWeekdaysBetween(trade.buy_date, tradeDateStr);
  const holdDays = Math.max(Number(trade.hold_days || 0), computedDays);

  // A 股 T+1：买入当日不触发卖出，仅跟踪峰值与浮盈
  if (!tradeDateStr || tradeDateStr <= String(trade.buy_date).slice(0, 10)) {
    return {
      should_sell: false,
      sell_signal: null,
      sell_price: null,
      sell_reason: null,
      pnl_pct: pnlPct,
      is_win: null,
      peak_price_candidate: Number(nextPeak.toFixed(3)),
      hold_days: 0,
      t_plus_1_locked: true,
    };
  }

  const stopLossPrice =
    trade.stop_loss_price && Number(trade.stop_loss_price) > 0
      ? Number(trade.stop_loss_price)
      : null;
  const dayChgPct = Number(liveQuote?.change_pct || 0);
  const ma20 = tech?.ma20 ?? null;

  if ((stopLossPrice && price <= stopLossPrice) || pnlPct <= -8.0) {
    return {
      should_sell: true,
      sell_signal: "HARD_STOP_LOSS",
      sell_price: price,
      sell_reason: `触发止损：现价 ¥${price.toFixed(2)}（浮亏 ${pnlPct.toFixed(2)}%，触及失效/止损线）`,
      pnl_pct: pnlPct,
      is_win: pnlPct > 0,
      peak_price_candidate: Number(nextPeak.toFixed(3)),
      hold_days: holdDays,
      t_plus_1_locked: false,
    };
  }

  if (pnlPct >= 20.0) {
    return {
      should_sell: true,
      sell_signal: "TAKE_PROFIT_2",
      sell_price: price,
      sell_reason: `触发二档止盈：浮盈达 +${pnlPct.toFixed(2)}%（>= +20%目标）`,
      pnl_pct: pnlPct,
      is_win: true,
      peak_price_candidate: Number(nextPeak.toFixed(3)),
      hold_days: holdDays,
      t_plus_1_locked: false,
    };
  }

  if (peakGainPct >= 10.0 && drawdownFromPeakPct >= 5.0) {
    return {
      should_sell: true,
      sell_signal: "TRAILING_STOP",
      sell_price: price,
      sell_reason: `触发移动止盈：最高 ¥${nextPeak.toFixed(2)}(+${peakGainPct.toFixed(1)}%) 回撤 ${drawdownFromPeakPct.toFixed(2)}%`,
      pnl_pct: pnlPct,
      is_win: pnlPct > 0,
      peak_price_candidate: Number(nextPeak.toFixed(3)),
      hold_days: holdDays,
      t_plus_1_locked: false,
    };
  }

  if (ma20 && price < ma20 && dayChgPct <= -3.0) {
    return {
      should_sell: true,
      sell_signal: "MA20_BREAK",
      sell_price: price,
      sell_reason: `趋势破位卖出：跌破MA20(¥${ma20.toFixed(2)})且日内跌幅 ${dayChgPct.toFixed(2)}%`,
      pnl_pct: pnlPct,
      is_win: pnlPct > 0,
      peak_price_candidate: Number(nextPeak.toFixed(3)),
      hold_days: holdDays,
      t_plus_1_locked: false,
    };
  }

  if (holdDays >= 10) {
    return {
      should_sell: true,
      sell_signal: "MAX_HOLD_EXPIRED",
      sell_price: price,
      sell_reason: `持有满 ${holdDays} 个交易日时间止损结算（现价 ¥${price.toFixed(2)}）`,
      pnl_pct: pnlPct,
      is_win: pnlPct > 0,
      peak_price_candidate: Number(nextPeak.toFixed(3)),
      hold_days: holdDays,
      t_plus_1_locked: false,
    };
  }

  return {
    should_sell: false,
    sell_signal: null,
    sell_price: null,
    sell_reason: null,
    pnl_pct: pnlPct,
    is_win: null,
    peak_price_candidate: Number(nextPeak.toFixed(3)),
    hold_days: holdDays,
    t_plus_1_locked: false,
  };
}
