export interface StockRecommendation {
  id: number;
  recommend_date: string;
  stock_code: string;
  stock_name: string;
  category: string;
  score: number;
  entry_price: number;
  target_price: number;
  stop_loss_price: number;
  reason: string;
  current_price: number;
  t1_return: number;
  t3_return: number;
  t5_max_return: number;
  status: "holding" | "win" | "stopped";
  created_at: string;
}

export interface TradeEvent {
  id: string;
  date: string;
  time: string;
  type: "BUY" | "SELL" | "SELL_TAKE_PROFIT" | "SELL_STOP_LOSS";
  stock_code: string;
  stock_name: string;
  price: number;
  shares: number;
  amount: number;
  target_price?: number;
  stop_loss_price?: number;
  pnl_pct?: number;
  pnl_amount?: number;
  reason: string;
  // 穿透式量化决策与明细字段
  entry_price?: number;          // 买入价格/成本价
  entry_time?: string;           // 买入确切时间 (如 "09-07 09:42")
  entry_reason?: string;         // 买入量化决策依据
  exit_reason?: string;          // 卖出量化决策依据
  position_before_pct?: number;  // 调仓前仓位比例 (如 68.8%)
  position_after_pct?: number;   // 调仓后仓位比例 (如 0.0%)
  strategy_win_rate?: number;    // 策略整体历史胜率 (如 77.8%)
  selection_win_rate?: number;   // 该战法/标的历史选股胜率 (如 77.8%)
}

export interface DailyPnlCandle {
  date: string;
  open_pnl_pct: number;
  high_pnl_pct: number;
  low_pnl_pct: number;
  close_pnl_pct: number;
  equity: number;
  benchmark_pct: number;
  alpha_pct: number;
  events: TradeEvent[];
}

export interface PaperHolding {
  code: string;
  name: string;
  shares: number;
  cost_price: number;
  current_price: number;
  market_value: number;
  pnl: number;
  pnl_pct: number;
  stop_loss_price: number;
  target_price: number;
  action: string;
  advice_reason: string;
}

export type AccountStyle = "aggressive" | "balanced" | "conservative";

export interface PaperAccount {
  account_id: AccountStyle;
  account_name: string;
  style_desc: string;
  initial_capital: number;
  total_equity: number;
  cash: number;
  market_value: number;
  total_pnl: number;
  total_pnl_pct: number;
  today_pnl: number;
  today_pnl_pct: number;
  position_ratio_pct: number;
  win_rate: number;
  profit_loss_ratio: number;
  completed_trades: number;
  max_drawdown_pct: number;
  start_date: string;
  rules_desc: string;
  holdings: PaperHolding[];
  candles: DailyPnlCandle[];
  events: TradeEvent[];
}

export interface WinRateStats {
  total_signals: number;
  win_count: number;
  loss_count: number;
  holding_count: number;
  win_rate: number;
  profit_loss_ratio: number;
  avg_return_pct: number;
  max_return_pct: number;
}

/**
 * 计算多因子选股策略历史胜率统计
 */
export function calculateWinRateStats(history: StockRecommendation[]): WinRateStats {
  if (!history || history.length === 0) {
    return {
      total_signals: 0,
      win_count: 0,
      loss_count: 0,
      holding_count: 0,
      win_rate: 0,
      profit_loss_ratio: 0,
      avg_return_pct: 0,
      max_return_pct: 0,
    };
  }

  const winPicks = history.filter((p) => p.status === "win");
  const stoppedPicks = history.filter((p) => p.status === "stopped");
  const holdingPicks = history.filter((p) => p.status === "holding");

  const completed = winPicks.length + stoppedPicks.length;
  const winRate = completed > 0 ? parseFloat(((winPicks.length / completed) * 100).toFixed(1)) : 0;

  // 盈利单平均收益率与亏损单平均亏损
  const winReturns = winPicks.map((p) => Math.max(p.t1_return, p.t3_return, p.t5_max_return));
  const avgWin = winReturns.length > 0 ? winReturns.reduce((a, b) => a + b, 0) / winReturns.length : 0;

  const lossReturns = stoppedPicks.map((p) => Math.min(p.t1_return, p.t3_return, p.t5_max_return));
  const avgLoss = lossReturns.length > 0 ? Math.abs(lossReturns.reduce((a, b) => a + b, 0) / lossReturns.length) : 0;

  const pnlRatio = avgLoss > 0 ? parseFloat((avgWin / avgLoss).toFixed(2)) : parseFloat(avgWin.toFixed(2));

  // 全部样本平均最大收益率与单笔最高
  const allMaxReturns = history.map((p) => Math.max(p.t1_return, p.t3_return, p.t5_max_return));
  const avgReturn = allMaxReturns.length > 0 ? parseFloat((allMaxReturns.reduce((a, b) => a + b, 0) / allMaxReturns.length).toFixed(1)) : 0;
  const maxReturn = allMaxReturns.length > 0 ? parseFloat(Math.max(...allMaxReturns).toFixed(1)) : 0;

  return {
    total_signals: history.length,
    win_count: winPicks.length,
    loss_count: stoppedPicks.length,
    holding_count: holdingPicks.length,
    win_rate: winRate,
    profit_loss_ratio: pnlRatio,
    avg_return_pct: avgReturn,
    max_return_pct: maxReturn,
  };
}

