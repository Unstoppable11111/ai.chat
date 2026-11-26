/**
 * A股波段规则引擎 TypeScript 类型声明与导出层（零重复逻辑，实际实现在 swing-rules-core.mjs）
 */

import {
  classifyAShareBoard as rawClassifyAShareBoard,
  evaluateMarketTrafficLight as rawEvaluateMarketTrafficLight,
  computeStockTechnicals as rawComputeStockTechnicals,
  evaluateHoldingSwingSignals as rawEvaluateHoldingSwingSignals,
  evaluateWatchlistSwingSignals as rawEvaluateWatchlistSwingSignals,
  evaluateSignalPaperExit as rawEvaluateSignalPaperExit,
} from "./swing-rules-core.mjs";

export type MarketTrafficLight = "RED" | "YELLOW" | "GREEN";
export type HoldingPositionMode = "swing_normal" | "deep_drawdown_recovery";
export type SignalSeverity = "ACTION" | "WATCH" | "INFO" | "ERROR";

export interface MarketTrafficLightState {
  light: MarketTrafficLight;
  label: string;
  score: number | null;
  allow_pullback_buy: boolean;
  allow_breakout_buy: boolean;
  summary: string;
}

export interface DailyKlineBar {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface StockTechnicals {
  latest_date: string | null;
  latest_close: number | null;
  ma5: number | null;
  ma10: number | null;
  ma20: number | null;
  ma60: number | null;
  dist_ma5_pct?: number | null;
  dist_ma20_pct?: number | null;
  amp_20d_pct?: number | null;
  above_ma20: boolean;
  vol_ratio_5_20: number | null;
  avg_vol_5d?: number | null;
  ret_5d_pct: number | null;
  ret_20d_pct: number | null;
  high_60d: number | null;
  low_20d: number | null;
  high_52w: number | null;
  low_52w: number | null;
  pos_52w_pct: number | null;
  limit_up_count_1y: number;
  suggested_buy_low: number | null;
  suggested_buy_high: number | null;
  suggested_breakout: number | null;
  suggested_invalid: number | null;
}

export interface SwingLiveQuote {
  price: number;
  quote_date?: string;
  prev_close?: number;
  open?: number;
  high?: number;
  low?: number;
  change_pct?: number;
  volume?: number;
  amount?: number;
  vol_ratio?: number;
  turnover_pct?: number;
}

export interface SwingSignalItem {
  key: string;
  severity: SignalSeverity;
  llm_escalate: boolean;
  message: string;
}

export interface HoldingSwingInput {
  code: string;
  name: string;
  quantity: number;
  available_quantity?: number | null;
  cost_price: number;
  hold_type?: string;
  sector?: string | null;
  position_mode?: HoldingPositionMode | string | null;
  support_defense_price?: number | null;
  rebound_watch_prices?: number[] | null;
  peak_price_since_entry?: number | null;
  take_profit_pct_1?: number | null;
  take_profit_pct_2?: number | null;
  trailing_pullback_pct?: number | null;
  stop_loss_pct?: number | null;
  suppress_cost_stoploss?: boolean | number | null;
  thesis?: string | null;
}

export interface HoldingSwingEvaluation {
  code: string;
  name: string;
  board: string;
  position_mode: HoldingPositionMode;
  status: "ok" | "data_error";
  price: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  amplitude_pct: number;
  pullback_from_high_pct: number;
  rebound_from_low_pct: number;
  pnl_pct: number;
  pnl_yuan: number;
  market_value_yuan: number;
  stop_loss_price: number;
  peak_price_candidate: number;
  vol_ratio: number;
  turnover_pct: number;
  technicals: StockTechnicals | null;
  signals: SwingSignalItem[];
  llm_escalate: boolean;
  escalate_reasons: string[];
  highest_severity: SignalSeverity;
  recommendation: string;
}

export interface WatchItemSwingInput {
  code: string;
  name: string;
  observed_days: number;
  max_days: number;
  buy_low: number | null;
  buy_high: number | null;
  breakout_price: number | null;
  invalid_price: number | null;
}

export interface WatchItemSwingEvaluation {
  code: string;
  name: string;
  observed_days: number;
  max_days: number;
  price: number | null;
  change_pct: number;
  vol_ratio: number;
  dist_to_buy_high_pct: number | null;
  dist_to_breakout_pct: number | null;
  dist_to_invalid_pct: number | null;
  triggered_signal: "BUY_A" | "BUY_B" | "INVALIDATED" | null;
  signals: SwingSignalItem[];
  llm_escalate: boolean;
  escalate_reasons: string[];
  status_summary: string;
}

export interface BoardClassification {
  code: string;
  board: "沪市主板" | "深市主板" | "创业板" | "科创板" | "北交所" | "ETF" | "ST风险" | "其他";
  allowed: boolean;
  limitPct: number;
  reason?: string;
}

export function classifyAShareBoard(rawCode: string, name = ""): BoardClassification {
  return rawClassifyAShareBoard(rawCode, name) as BoardClassification;
}

export function evaluateMarketTrafficLight(
  score: number | null | undefined,
  minPullback = 30,
  minBreakout = 55
): MarketTrafficLightState {
  return rawEvaluateMarketTrafficLight(score, minPullback, minBreakout) as MarketTrafficLightState;
}

export function computeStockTechnicals(
  bars: DailyKlineBar[],
  code = "",
  liveQuote?: SwingLiveQuote | null
): StockTechnicals {
  return rawComputeStockTechnicals(
    bars,
    code,
    (liveQuote ?? undefined) as undefined
  ) as StockTechnicals;
}

export function evaluateHoldingSwingSignals(
  holding: HoldingSwingInput,
  liveQuote: SwingLiveQuote | null | undefined,
  tech: StockTechnicals | null,
  sectorChangePct: number | null
): HoldingSwingEvaluation {
  return rawEvaluateHoldingSwingSignals(holding, liveQuote, tech, sectorChangePct) as HoldingSwingEvaluation;
}

export function evaluateWatchlistSwingSignals(
  item: WatchItemSwingInput,
  liveQuote: SwingLiveQuote | null | undefined,
  sectorChangePct: number | null,
  regime: MarketTrafficLightState,
  tech?: StockTechnicals | null
): WatchItemSwingEvaluation {
  return rawEvaluateWatchlistSwingSignals(
    item,
    liveQuote,
    sectorChangePct,
    regime,
    (tech ?? undefined) as undefined
  ) as WatchItemSwingEvaluation;
}

export interface SignalPaperExitEvaluation {
  should_sell: boolean;
  sell_signal: string | null;
  sell_price: number | null;
  sell_reason: string | null;
  pnl_pct: number;
  is_win: boolean | null;
  peak_price_candidate: number;
  hold_days: number;
  t_plus_1_locked: boolean;
}

export function evaluateSignalPaperExit(
  trade: {
    stock_code: string;
    stock_name: string;
    buy_date: string;
    buy_price: number;
    stop_loss_price?: number | null;
    peak_price?: number | null;
    hold_days?: number;
  },
  liveQuote: SwingLiveQuote | null | undefined,
  tech: StockTechnicals | null | undefined,
  tradeDateStr: string
): SignalPaperExitEvaluation {
  return rawEvaluateSignalPaperExit(
    trade,
    liveQuote,
    tech,
    tradeDateStr
  ) as SignalPaperExitEvaluation;
}
