import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyAShareBoard,
  evaluateMarketTrafficLight,
  computeStockTechnicals,
  evaluateHoldingSwingSignals,
  evaluateWatchlistSwingSignals,
} from "../src/lib/quant-arena/swing-rules-core.mjs";

test("板块准入过滤：仅允许沪深主板与创业板，严格拦截科创/北交/ETF/ST", () => {
  assert.equal(classifyAShareBoard("603629", "利通电子").allowed, true);
  assert.equal(classifyAShareBoard("002436", "兴森科技").allowed, true);
  assert.equal(classifyAShareBoard("300857", "协创数据").allowed, true);
  assert.equal(classifyAShareBoard("688981", "中芯国际").allowed, false);
  assert.equal(classifyAShareBoard("832982", "锦波生物").allowed, false);
  assert.equal(classifyAShareBoard("510300", "沪深300ETF").allowed, false);
  assert.equal(classifyAShareBoard("002001", "ST示范").allowed, false);
});

test("市场情绪红绿灯总闸门准确控制买点放行", () => {
  const red = evaluateMarketTrafficLight(24.5);
  assert.equal(red.light, "RED");
  assert.equal(red.allow_pullback_buy, false);
  assert.equal(red.allow_breakout_buy, false);

  const yellow = evaluateMarketTrafficLight(35.7);
  assert.equal(yellow.light, "YELLOW");
  assert.equal(yellow.allow_pullback_buy, true);
  assert.equal(yellow.allow_breakout_buy, false);

  const green = evaluateMarketTrafficLight(68.2);
  assert.equal(green.light, "GREEN");
  assert.equal(green.allow_pullback_buy, true);
  assert.equal(green.allow_breakout_buy, true);
});

test("兴森科技真实回放：深套修复模式不误报-8%止损，并精准捕获高点回撤 -9.07% 触发 AI 介入", () => {
  const holding = {
    code: "002436",
    name: "兴森科技",
    quantity: 6300,
    cost_price: 37.49,
    position_mode: "deep_drawdown_recovery",
    suppress_cost_stoploss: true,
    support_defense_price: 23.3,
    rebound_watch_prices: [27.5, 34.45],
    peak_price_since_entry: 37.49,
  };
  const liveQuote = {
    price: 24.37,
    prev_close: 24.9,
    open: 26.5,
    high: 26.8,
    low: 24.3,
    change_pct: -2.13,
    vol_ratio: 1.85,
  };
  const bars = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-10-${String(i + 1).padStart(2, "0")}`,
    open: 25,
    close: 25.5,
    high: 26,
    low: 24.5,
    volume: 1000000,
  }));
  const tech = computeStockTechnicals(bars, "002436", liveQuote);
  const res = evaluateHoldingSwingSignals(holding, liveQuote, tech, -1.2);

  assert.equal(res.status, "ok");
  assert.equal(res.pullback_from_high_pct, 9.07);
  assert.equal(res.llm_escalate, true);
  assert.ok(res.signals.some((s) => s.key === "intraday_high_pullback"));
  assert.ok(!res.signals.some((s) => s.key === "hard_stop_loss"));
});

test("5日观察池买点A/B与情绪红绿灯联动判定", () => {
  const watch = {
    code: "002916",
    name: "深南电路",
    observed_days: 1,
    max_days: 5,
    buy_low: 201.28,
    buy_high: 208.54,
    breakout_price: 282.4,
    invalid_price: 176.3,
  };

  // 红灯拦截买点A
  const redRes = evaluateWatchlistSwingSignals(
    watch,
    { price: 205.0, change_pct: 0.6, vol_ratio: 0.85 },
    1.2,
    evaluateMarketTrafficLight(20)
  );
  assert.equal(redRes.triggered_signal, null);
  assert.ok(redRes.signals.some((s) => s.key === "buy_a_gated_red"));

  // 黄灯放行买点A（缩量回踩企稳）
  const yellowBuyA = evaluateWatchlistSwingSignals(
    watch,
    { price: 205.0, change_pct: 0.6, vol_ratio: 0.85 },
    0.5,
    evaluateMarketTrafficLight(35.7)
  );
  assert.equal(yellowBuyA.triggered_signal, "BUY_A");
  assert.equal(yellowBuyA.llm_escalate, true);

  // 黄灯屏蔽买点B右侧突破，绿灯放行买点B
  const yellowBlockedB = evaluateWatchlistSwingSignals(
    watch,
    { price: 285.0, change_pct: 4.5, vol_ratio: 2.1 },
    1.5,
    evaluateMarketTrafficLight(42)
  );
  assert.equal(yellowBlockedB.triggered_signal, null);
  assert.ok(yellowBlockedB.signals.some((s) => s.key === "buy_b_gated"));

  const greenBuyB = evaluateWatchlistSwingSignals(
    watch,
    { price: 285.0, change_pct: 4.5, vol_ratio: 2.1 },
    1.5,
    evaluateMarketTrafficLight(65)
  );
  assert.equal(greenBuyB.triggered_signal, "BUY_B");
  assert.equal(greenBuyB.llm_escalate, true);
});

test("深套修复兼容兜底：即使旧持仓为 swing_normal 且未设支撑位，仍自动推导20日低点防守且不误报正常持有", () => {
  const holding = {
    code: "002436",
    name: "兴森科技",
    quantity: 6300,
    cost_price: 34.0,
    position_mode: "swing_normal",
    suppress_cost_stoploss: true,
    support_defense_price: null,
  };
  const liveQuote = {
    price: 24.38,
    quote_date: "2026-11-25",
    prev_close: 24.9,
    open: 24.8,
    high: 25.0,
    low: 24.2,
    change_pct: -2.09,
    volume: 1200000,
  };
  const bars = Array.from({ length: 25 }, (_, i) => ({
    date: `2026-10-${String(i + 1).padStart(2, "0")}`,
    open: 26.5,
    close: 26.7,
    high: 27.2,
    low: 23.42,
    volume: 1000000,
  }));
  const tech = computeStockTechnicals(bars, "002436", liveQuote);
  assert.equal(tech.latest_date, "2026-11-25", "新交易日实时行情应追加而非覆盖昨日K线");
  const res = evaluateHoldingSwingSignals(holding, liveQuote, tech, -0.5);
  assert.equal(res.position_mode, "deep_drawdown_recovery");
  assert.ok(res.stop_loss_price < liveQuote.price, `防守价(${res.stop_loss_price})应低于现价(${liveQuote.price})`);
  assert.ok(!res.recommendation.includes("趋势/仓位正常"), `深套亏28%不应建议正常持有: ${res.recommendation}`);
  assert.ok(res.signals.some((s) => s.key === "below_ma20_drawdown_watch"));
});
