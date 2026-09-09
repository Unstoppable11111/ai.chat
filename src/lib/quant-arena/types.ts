/**
 * A股 QUANT STRATEGY LAB - 核心类型定义
 * 包含：三大策略账户、市场环境、多因子评分、信号中心、A股撮合模型、风控与归因
 */

import type { DailyPnlCandle, TradeEvent, AccountStyle } from "@/lib/recommendations-db";

export type StrategyType = "aggressive" | "balanced" | "conservative";

export type MarketRegime = "BULL" | "NEUTRAL" | "BEAR" | "PANIC";

export type RiskStatus = "SAFE" | "WATCH" | "WARNING" | "CRITICAL" | "PROTECTION_MODE";

export interface MarketRegimeAssessment {
  regime: MarketRegime;
  regime_label: string;
  market_score: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  suggested_exposure: {
    aggressive: string;
    balanced: string;
    conservative: string;
  };
  liquidity: {
    total_turnover_yi: number;
    total_turnover_text: string;
    ma5_diff_pct: number | null;
    status: string;
  };
  breadth: {
    up_count: number;
    down_count: number;
    flat_count: number;
    up_ratio_pct: number;
    status: string;
  };
  momentum: {
    limit_up_count: number;
    limit_down_count: number;
    broken_ratio_pct: number;
    highest_height: number;
    highest_leaders: string[];
    main_flow_yi: number;
    status: string;
  };
  volatility: {
    atr_status: string;
    level: "低" | "中" | "高" | "极端";
  };
  mainline: {
    name: string;
    strength_score: number;
    days_persisted: number;
  };
  why_evidences: string[];
  data_status: "REALTIME" | "DELAYED" | "EOD" | "FAILED";
  last_updated: string;
}

export interface FactorItemScore {
  score: number;
  max: number;
  label: string;
  value: string;
  reason: string;
}

export interface QuantScoreDetail {
  total: number;
  industry: FactorItemScore;
  fundamental: FactorItemScore;
  growth: FactorItemScore;
  valuation: FactorItemScore;
  trend: FactorItemScore;
  momentum: FactorItemScore;
  liquidity: FactorItemScore;
  risk: FactorItemScore;
}

export interface DecisionTrace {
  data_as_of: string;
  signal_time: string;
  execution_time: string;
  data_input: string;
  factors: string;
  score_eval: string;
  signal_eval: string;
  risk_check: string;
  sizing_rationale: string;
  execution_plan: string;
  rule_compliance: string;
}

export interface StrategySignal {
  id: string;
  stock_code: string;
  stock_name: string;
  strategy: StrategyType;
  action: "BUY" | "SELL" | "HOLD" | "WATCH";
  score: number;
  score_detail: QuantScoreDetail;
  data_as_of: string;
  signal_time: string;
  execution_time: string;
  current_price: number | null;
  suggested_entry: number | null;
  stop_loss: number | null;
  target_price: number | null;
  position_size_pct: number;
  risk_reward_ratio: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  data_quality: "HIGH" | "MEDIUM" | "LOW" | "FAILED";
  decision_trace: DecisionTrace;
}

export interface ArenaPosition {
  code: string;
  name: string;
  shares: number;
  available_shares: number; // T+1 限制：当日买入的不可卖出
  cost_price: number;
  current_price: number | null;
  market_value: number;
  weight_pct: number;
  pnl: number;
  pnl_pct: number;
  stop_loss_price: number;
  target_price: number;
  holding_days: number;
  buy_date: string;
  strategy_reason: string;
  sector: string;
  beta: number;
}

export interface EquityDataPoint {
  date: string;
  equity: number;
  return_pct: number;
  benchmark_pct: number;
  alpha_pct: number;
  drawdown_pct: number;
}

export interface PortfolioAttribution {
  stock_selection_pct: number;
  industry_allocation_pct: number;
  timing_pct: number;
  position_sizing_pct: number;
  market_beta_pct: number;
  alpha_pct: number;
}

export interface PortfolioRiskMetrics {
  volatility_pct: number;
  beta: number;
  var_95_pct: number;
  cvar_95_pct: number;
  max_single_position_pct: number;
  top_industry: string;
  top_industry_pct: number;
  concentration_top3_pct: number;
}

export interface TradeOrder {
  id: string;
  date: string;
  signal_time: string;
  execution_time: string;
  stock_code: string;
  stock_name: string;
  strategy: StrategyType;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
  amount: number;
  commission: number; // 佣金 (万2.5，最低5元)
  stamp_tax: number;  // 印花税 (卖出千0.5)
  slippage: number;   // 滑点 (买卖各0.02%)
  total_cost: number;
  score: number;
  reason: string;
  pnl?: number;
  pnl_pct?: number;
  holding_days?: number;
  exit_reason?: string;
  // 超短打板与排板撮合规则扩展
  is_limit_up_order?: boolean;
  has_opened_limit?: boolean;
  open_limit_time?: string;
  execution_status?: "FILLED" | "UNFILLED" | "CANCELLED";
  unfilled_reason?: string;
  decision_trace?: DecisionTrace;
}

export interface ArenaAccount {
  id: StrategyType;
  account_id?: AccountStyle; // 兼容多组件接口
  name: string;
  version: string;
  initial_capital: number;
  total_equity: number;
  cash: number;
  market_value: number;
  today_pnl: number;
  today_pnl_pct: number;
  total_return_pct: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  win_rate_pct: number;
  profit_factor: number;
  current_exposure_pct: number;
  position_count: number;
  completed_trades?: number;
  strategy_score: number;
  risk_status: RiskStatus;
  is_protection_mode: boolean;
  positions: ArenaPosition[];
  equity_series: EquityDataPoint[];
  candles?: DailyPnlCandle[]; // 每日收益K线蜡烛
  events?: TradeEvent[];      // 交易事件
  orders: TradeOrder[];
  attribution: PortfolioAttribution;
  risk_metrics: PortfolioRiskMetrics;
}

export interface StrategyRankingItem {
  rank: number;
  strategy: StrategyType;
  name: string;
  total_score: number;
  return_score: number;
  sharpe_score: number;
  drawdown_score: number;
  calmar_score: number;
  winrate_score: number;
  reason: string;
}

export interface StrategyExperiment {
  experiment_id: string;
  name: string;
  period: string;
  start_date: string;
  end_date: string;
  initial_capital_per_account: number;
  strategies: StrategyType[];
  versions: Record<StrategyType, string>;
  cost_model: {
    commission_rate: number;
    stamp_tax_rate: number;
    slippage_rate: number;
    min_commission: number;
  };
  winner: StrategyType;
  runner_up: StrategyType;
  third: StrategyType;
  evaluation_summary: string;
}
