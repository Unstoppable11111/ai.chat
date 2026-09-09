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
