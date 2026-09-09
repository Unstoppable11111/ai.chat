import fs from "fs";
import path from "path";
import {
  ArenaAccount,
  StrategyType,
  StrategyRankingItem,
  StrategyExperiment,
  MarketRegimeAssessment,
} from "./types";
import { getRealStockQuotes } from "@/lib/quotes-service";

const ARENA_DATA_FILE = path.join(process.cwd(), "src", "data", "arena-accounts.json");

/**
 * 初始三大 10 万元独立账户工厂定义
 * 账户A: Aggressive 100k
 * 账户B: Balanced 100k
 * 账户C: Conservative 100k
 * 绝无共享持仓与交易结果，费率与市场环境统一共享
 */
function createInitialArenaAccounts(): Record<StrategyType, ArenaAccount> {
  const initialCapital = 100000;

  // 1. 激进策略账户 (连板高度龙头 · 满仓打板 · 标的≤2只 · 10天100%异动前退出)
  const aggressive: ArenaAccount = {
    id: "aggressive",
    name: "激进超短龙头策略 (AGGRESSIVE)",
    version: "v1.0",
    initial_capital: initialCapital,
    total_equity: 108797,
    cash: 148,
    market_value: 108649,
    today_pnl: 8797,
    today_pnl_pct: 8.80,
    total_return_pct: 8.80,
    max_drawdown_pct: -0.25,
    sharpe_ratio: 3.12,
    sortino_ratio: 4.56,
    calmar_ratio: 4.50,
    win_rate_pct: 100.0,
    profit_factor: 8.50,
    current_exposure_pct: 99.9,
    position_count: 2,
    strategy_score: 94.5,
    risk_status: "SAFE",
    is_protection_mode: false,
    positions: [
      {
        code: "600865",
        name: "百大集团",
        shares: 5000,
        available_shares: 5000, // 昨日买入，今日可卖
        cost_price: 13.74,
        current_price: 15.11,
        market_value: 75550,
        weight_pct: 69.4,
        pnl: 6850,
        pnl_pct: 9.97,
        stop_loss_price: 12.78,
        target_price: 16.63,
        holding_days: 2,
        buy_date: "2026-09-07",
        strategy_reason: "市场最高5连板空间总龙头(小市值56亿)，商贸消费题材，不限科技，打板追涨满仓单挑；核心纪律：10天100%严重异动监管前主动退出",
        sector: "商贸百货/新消费",
        beta: 1.85,
      },
      {
        code: "600108",
        name: "亚盛集团",
        shares: 5900,
        available_shares: 5900,
        cost_price: 5.28,
        current_price: 5.61,
        market_value: 33099,
        weight_pct: 30.4,
        pnl: 1947,
        pnl_pct: 6.25,
        stop_loss_price: 4.91,
        target_price: 6.39,
        holding_days: 2,
        buy_date: "2026-09-07",
        strategy_reason: "农业连板梯队前排共振高弹性龙头，放量突破换手连板，快进快出，持仓严控≤2只",
        sector: "农业种植",
        beta: 1.55,
      },
    ],
    account_id: "aggressive",
    equity_series: [
      { date: "09-01", equity: 100000, return_pct: 0.0, benchmark_pct: 0.10, alpha_pct: -0.10, drawdown_pct: 0 },
      { date: "09-02", equity: 100000, return_pct: 0.0, benchmark_pct: 0.30, alpha_pct: -0.30, drawdown_pct: 0 },
      { date: "09-03", equity: 100000, return_pct: 0.0, benchmark_pct: 0.40, alpha_pct: -0.40, drawdown_pct: 0 },
      { date: "09-04", equity: 100000, return_pct: 0.0, benchmark_pct: 0.50, alpha_pct: -0.50, drawdown_pct: 0 },
      { date: "09-07", equity: 101850, return_pct: 1.85, benchmark_pct: 0.60, alpha_pct: 1.25, drawdown_pct: 0 },
      { date: "09-08", equity: 108797, return_pct: 8.80, benchmark_pct: 1.10, alpha_pct: 7.70, drawdown_pct: 0 },
    ],
    candles: [
      { date: "09-01", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.1, alpha_pct: -0.1, events: [] },
      { date: "09-02", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.3, alpha_pct: -0.3, events: [] },
      { date: "09-03", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.4, alpha_pct: -0.4, events: [] },
      { date: "09-04", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.5, alpha_pct: -0.5, events: [] },
      {
        date: "09-07",
        open_pnl_pct: 0.0,
        high_pnl_pct: 2.2,
        low_pnl_pct: 0.0,
        close_pnl_pct: 1.85,
        equity: 101850,
        benchmark_pct: 0.6,
        alpha_pct: 1.25,
        events: [
          {
            id: "ev-agg-1",
            date: "09-07",
            time: "09:30",
            type: "BUY",
            stock_code: "600865",
            stock_name: "百大集团",
            price: 13.74,
            shares: 5000,
            amount: 68700,
            target_price: 16.63,
            stop_loss_price: 12.78,
            pnl_pct: 9.97,
            reason: "全市场最高5连板空间总龙头(小盘56亿)，不限科技题材，开盘强力封板打板追涨，满仓单挑；严格执行10天100%异动监管前退出",
          },
          {
            id: "ev-agg-2",
            date: "09-07",
            time: "09:30",
            type: "BUY",
            stock_code: "600108",
            stock_name: "亚盛集团",
            price: 5.28,
            shares: 5900,
            amount: 31152,
            target_price: 6.39,
            stop_loss_price: 4.91,
            pnl_pct: 6.25,
            reason: "连板梯队前排共振高弹性龙头，农业消费防御+游资合力，快进快出，持仓严控≤2只",
          },
        ],
      },
      {
        date: "09-08",
        open_pnl_pct: 1.85,
        high_pnl_pct: 9.20,
        low_pnl_pct: 1.85,
        close_pnl_pct: 8.80,
        equity: 108797,
        benchmark_pct: 1.1,
        alpha_pct: 7.70,
        events: [],
      },
    ],
    orders: [
      {
        id: "ord-agg-001",
        date: "2026-09-07",
        signal_time: "2026-09-07 09:15:00",
        execution_time: "2026-09-07 09:30:00",
        stock_code: "600865",
        stock_name: "百大集团",
        strategy: "aggressive",
        action: "BUY",
        price: 13.74,
        shares: 5000,
        amount: 68700,
        commission: 17.18,
        stamp_tax: 0,
        slippage: 13.74,
        total_cost: 68730.92,
        score: 96.0,
        reason: "全市场最高连板高度总龙头，突破打板满仓单挑，10天100%异动前退出",
      },
      {
        id: "ord-agg-002",
        date: "2026-09-07",
        signal_time: "2026-09-07 09:15:00",
        execution_time: "2026-09-07 09:30:00",
        stock_code: "600108",
        stock_name: "亚盛集团",
        strategy: "aggressive",
        action: "BUY",
        price: 5.28,
        shares: 5900,
        amount: 31152,
        commission: 7.79,
        stamp_tax: 0,
        slippage: 6.23,
        total_cost: 31166.02,
        score: 91.5,
        reason: "连板前排梯队中小市值龙头，放量突破换手打板追涨",
      },
    ],
    attribution: {
      stock_selection_pct: 6.20,
      industry_allocation_pct: 1.15,
      timing_pct: 0.85,
      position_sizing_pct: 0.60,
      market_beta_pct: -0.10,
      alpha_pct: 7.70,
    },
    risk_metrics: {
      volatility_pct: 22.5,
      beta: 1.75,
      var_95_pct: -2.80,
      cvar_95_pct: -3.80,
      max_single_position_pct: 100.0,
      top_industry: "商贸百货/新消费",
      top_industry_pct: 69.5,
      concentration_top3_pct: 100.0,
    },
  };

  // 2. 均衡配置策略账户 (GARP中军成长)
  const balanced: ArenaAccount = {
    id: "balanced",
    name: "均衡价值成长策略 (BALANCED)",
    version: "v1.0",
    initial_capital: initialCapital,
    total_equity: 102150,
    cash: 44600,
    market_value: 57550,
    today_pnl: 650,
    today_pnl_pct: 0.64,
    total_return_pct: 2.15,
    max_drawdown_pct: -0.85,
    sharpe_ratio: 1.88,
    sortino_ratio: 2.75,
    calmar_ratio: 2.53,
    win_rate_pct: 75.0,
    profit_factor: 2.65,
    current_exposure_pct: 56.3,
    position_count: 2,
    strategy_score: 84.0,
    risk_status: "SAFE",
    is_protection_mode: false,
    positions: [
      {
        code: "600584",
        name: "长电科技",
        shares: 500,
        available_shares: 500,
        cost_price: 67.36,
        current_price: 69.0,
        market_value: 34500,
        weight_pct: 33.8,
        pnl: 820,
        pnl_pct: 2.43,
        stop_loss_price: 64.0,
        target_price: 75.0,
        holding_days: 2,
        buy_date: "2026-09-07",
        strategy_reason: "半导体封测中军，MA60支撑扎实，PEG合理",
        sector: "半导体封测",
        beta: 1.12,
      },
      {
        code: "002475",
        name: "立讯精密",
        shares: 400,
        available_shares: 400,
        cost_price: 54.3,
        current_price: 55.93,
        market_value: 22372,
        weight_pct: 21.9,
        pnl: 652,
        pnl_pct: 3.0,
        stop_loss_price: 51.5,
        target_price: 62.0,
        holding_days: 2,
        buy_date: "2026-09-07",
        strategy_reason: "消费电子龙头，估值处于合理分位，业绩持续成长",
        sector: "消费电子",
        beta: 1.05,
      },
    ],
    account_id: "balanced",
    equity_series: [
      { date: "09-01", equity: 100000, return_pct: 0.0, benchmark_pct: 0.10, alpha_pct: -0.10, drawdown_pct: 0 },
      { date: "09-02", equity: 100000, return_pct: 0.0, benchmark_pct: 0.30, alpha_pct: -0.30, drawdown_pct: 0 },
      { date: "09-03", equity: 100000, return_pct: 0.0, benchmark_pct: 0.40, alpha_pct: -0.40, drawdown_pct: 0 },
      { date: "09-04", equity: 100000, return_pct: 0.0, benchmark_pct: 0.50, alpha_pct: -0.50, drawdown_pct: 0 },
      { date: "09-07", equity: 100800, return_pct: 0.80, benchmark_pct: 0.50, alpha_pct: 0.30, drawdown_pct: 0 },
      { date: "09-08", equity: 102150, return_pct: 2.15, benchmark_pct: 0.80, alpha_pct: 1.35, drawdown_pct: 0 },
    ],
    candles: [
      { date: "09-01", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.1, alpha_pct: -0.1, events: [] },
      { date: "09-02", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.3, alpha_pct: -0.3, events: [] },
      { date: "09-03", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.4, alpha_pct: -0.4, events: [] },
      { date: "09-04", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.5, alpha_pct: -0.5, events: [] },
      {
        date: "09-07",
        open_pnl_pct: 0.0,
        high_pnl_pct: 1.2,
        low_pnl_pct: 0.0,
        close_pnl_pct: 0.8,
        equity: 100800,
        benchmark_pct: 0.5,
        alpha_pct: 0.3,
        events: [
          {
            id: "ev-bal-1",
            date: "09-07",
            time: "09:35",
            type: "BUY",
            stock_code: "600584",
            stock_name: "长电科技",
            price: 67.36,
            shares: 500,
            amount: 33680,
            target_price: 74.1,
            stop_loss_price: 64.33,
            pnl_pct: 2.43,
            reason: "半导体封测中军，MA60支撑扎实，PEG估值合理，均衡底仓配置",
          },
          {
            id: "ev-bal-2",
            date: "09-07",
            time: "09:35",
            type: "BUY",
            stock_code: "002475",
            stock_name: "立讯精密",
            price: 54.3,
            shares: 400,
            amount: 21720,
            target_price: 59.73,
            stop_loss_price: 51.86,
            pnl_pct: 3.0,
            reason: "消费电子龙头，估值处于合理分位，业绩持续成长，稳健加仓",
          },
        ],
      },
      {
        date: "09-08",
        open_pnl_pct: 0.8,
        high_pnl_pct: 2.6,
        low_pnl_pct: 0.6,
        close_pnl_pct: 2.15,
        equity: 102150,
        benchmark_pct: 0.8,
        alpha_pct: 1.35,
        events: [],
      },
    ],
    orders: [
      {
        id: "ord-bal-001",
        date: "2026-09-07",
        signal_time: "2026-09-07 09:15:00",
        execution_time: "2026-09-07 09:35:00",
        stock_code: "600584",
        stock_name: "长电科技",
        strategy: "balanced",
        action: "BUY",
        price: 67.36,
        shares: 500,
        amount: 33680,
        commission: 8.42,
        stamp_tax: 0,
        slippage: 6.74,
        total_cost: 33688.42,
        score: 88.0,
        reason: "封测中军底仓，稳健均线回踩配置",
      },
      {
        id: "ord-bal-002",
        date: "2026-09-07",
        signal_time: "2026-09-07 09:15:00",
        execution_time: "2026-09-07 09:40:00",
        stock_code: "002475",
        stock_name: "立讯精密",
        strategy: "balanced",
        action: "BUY",
        price: 54.3,
        shares: 400,
        amount: 21720,
        commission: 5.43,
        stamp_tax: 0,
        slippage: 4.34,
        total_cost: 21725.43,
        score: 86.5,
        reason: "消费电子估值合理，GARP分批建仓",
      },
    ],
    attribution: {
      stock_selection_pct: 1.10,
      industry_allocation_pct: 0.45,
      timing_pct: 0.25,
      position_sizing_pct: 0.15,
      market_beta_pct: 0.20,
      alpha_pct: 1.35,
    },
    risk_metrics: {
      volatility_pct: 9.8,
      beta: 1.08,
      var_95_pct: -1.45,
      cvar_95_pct: -2.05,
      max_single_position_pct: 33.8,
      top_industry: "半导体封测",
      top_industry_pct: 33.8,
      concentration_top3_pct: 55.7,
    },
  };

  // 3. 保守稳健策略账户 (高股息红利防御)
  const conservative: ArenaAccount = {
    id: "conservative",
    name: "保守高股息低波策略 (CONSERVATIVE)",
    version: "v1.0",
    initial_capital: initialCapital,
    total_equity: 100850,
    cash: 58484,
    market_value: 42366,
    today_pnl: 180,
    today_pnl_pct: 0.18,
    total_return_pct: 0.85,
    max_drawdown_pct: -0.35,
    sharpe_ratio: 1.62,
    sortino_ratio: 2.40,
    calmar_ratio: 2.43,
    win_rate_pct: 85.0,
    profit_factor: 2.40,
    current_exposure_pct: 42.0,
    position_count: 2,
    strategy_score: 82.0,
    risk_status: "SAFE",
    is_protection_mode: false,
    positions: [
      {
        code: "000998",
        name: "隆平高科",
        shares: 2000,
        available_shares: 2000,
        cost_price: 9.39,
        current_price: 9.68,
        market_value: 19360,
        weight_pct: 19.2,
        pnl: 580,
        pnl_pct: 3.09,
        stop_loss_price: 8.9,
        target_price: 11.5,
        holding_days: 2,
        buy_date: "2026-09-07",
        strategy_reason: "农业粮食安全龙头，低估值秋粮收获季防御",
        sector: "农业种植",
        beta: 0.72,
      },
      {
        code: "600900",
        name: "长江电力",
        shares: 800,
        available_shares: 800,
        cost_price: 28.42,
        current_price: 27.85,
        market_value: 22280,
        weight_pct: 22.1,
        pnl: -456,
        pnl_pct: -2.01,
        stop_loss_price: 26.5,
        target_price: 31.0,
        holding_days: 2,
        buy_date: "2026-09-07",
        strategy_reason: "高股息特许垄断核心压舱石，自由现金流充沛，抗波动首选",
        sector: "高股息水电",
        beta: 0.42,
      },
    ],
    account_id: "conservative",
    equity_series: [
      { date: "09-01", equity: 100000, return_pct: 0.0, benchmark_pct: 0.10, alpha_pct: -0.10, drawdown_pct: 0 },
      { date: "09-02", equity: 100000, return_pct: 0.0, benchmark_pct: 0.30, alpha_pct: -0.30, drawdown_pct: 0 },
      { date: "09-03", equity: 100000, return_pct: 0.0, benchmark_pct: 0.40, alpha_pct: -0.40, drawdown_pct: 0 },
      { date: "09-04", equity: 100000, return_pct: 0.0, benchmark_pct: 0.50, alpha_pct: -0.50, drawdown_pct: 0 },
      { date: "09-07", equity: 100300, return_pct: 0.30, benchmark_pct: 0.20, alpha_pct: 0.10, drawdown_pct: 0 },
      { date: "09-08", equity: 100850, return_pct: 0.85, benchmark_pct: 0.40, alpha_pct: 0.45, drawdown_pct: 0 },
    ],
    candles: [
      { date: "09-01", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.1, alpha_pct: -0.1, events: [] },
      { date: "09-02", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.3, alpha_pct: -0.3, events: [] },
      { date: "09-03", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.4, alpha_pct: -0.4, events: [] },
      { date: "09-04", open_pnl_pct: 0.0, high_pnl_pct: 0.0, low_pnl_pct: 0.0, close_pnl_pct: 0.0, equity: 100000, benchmark_pct: 0.5, alpha_pct: -0.5, events: [] },
      {
        date: "09-07",
        open_pnl_pct: 0.0,
        high_pnl_pct: 0.5,
        low_pnl_pct: -0.1,
        close_pnl_pct: 0.3,
        equity: 100300,
        benchmark_pct: 0.2,
        alpha_pct: 0.1,
        events: [
          {
            id: "ev-con-1",
            date: "09-07",
            time: "09:30",
            type: "BUY",
            stock_code: "000998",
            stock_name: "隆平高科",
            price: 9.39,
            shares: 2000,
            amount: 18780,
            target_price: 9.95,
            stop_loss_price: 9.11,
            pnl_pct: 3.09,
            reason: "种业安全压舱石，低位防御建仓，抗跌低波动",
          },
          {
            id: "ev-con-2",
            date: "09-07",
            time: "09:35",
            type: "BUY",
            stock_code: "600900",
            stock_name: "长江电力",
            price: 28.42,
            shares: 800,
            amount: 22736,
            target_price: 30.13,
            stop_loss_price: 27.57,
            pnl_pct: -2.01,
            reason: "高股息特许垄断核心压舱石，现金流极佳，抗波动首选",
          },
        ],
      },
      {
        date: "09-08",
        open_pnl_pct: 0.3,
        high_pnl_pct: 1.1,
        low_pnl_pct: 0.1,
        close_pnl_pct: 0.85,
        equity: 100850,
        benchmark_pct: 0.4,
        alpha_pct: 0.45,
        events: [],
      },
    ],
    orders: [
      {
        id: "ord-con-001",
        date: "2026-09-07",
        signal_time: "2026-09-07 09:15:00",
        execution_time: "2026-09-07 09:30:00",
        stock_code: "000998",
        stock_name: "隆平高科",
        strategy: "conservative",
        action: "BUY",
        price: 9.39,
        shares: 2000,
        amount: 18780,
        commission: 5.0,
        stamp_tax: 0,
        slippage: 3.76,
        total_cost: 18785.0,
        score: 87.5,
        reason: "种业安全压舱石，低位防御建仓",
      },
      {
        id: "ord-con-002",
        date: "2026-09-07",
        signal_time: "2026-09-07 09:15:00",
        execution_time: "2026-09-07 09:35:00",
        stock_code: "600900",
        stock_name: "长江电力",
        strategy: "conservative",
        action: "BUY",
        price: 28.42,
        shares: 800,
        amount: 22736,
        commission: 5.68,
        stamp_tax: 0,
        slippage: 4.55,
        total_cost: 22741.68,
        score: 85.0,
        reason: "高股息防御底仓配比，平抑波动",
      },
    ],
    attribution: {
      stock_selection_pct: 0.35,
      industry_allocation_pct: 0.25,
      timing_pct: 0.10,
      position_sizing_pct: 0.05,
      market_beta_pct: 0.10,
      alpha_pct: 0.45,
    },
    risk_metrics: {
      volatility_pct: 4.8,
      beta: 0.52,
      var_95_pct: -0.75,
      cvar_95_pct: -1.05,
      max_single_position_pct: 22.1,
      top_industry: "高股息水电",
      top_industry_pct: 22.1,
      concentration_top3_pct: 41.3,
    },
  };

  return { aggressive, balanced, conservative };
}

/**
 * 载入或初始化三大独立账户数据
 */
export function loadArenaAccounts(): Record<StrategyType, ArenaAccount> {
  try {
    const dir = path.dirname(ARENA_DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(ARENA_DATA_FILE)) {
      const initial = createInitialArenaAccounts();
      fs.writeFileSync(ARENA_DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }

    const content = fs.readFileSync(ARENA_DATA_FILE, "utf8");
    const accounts = JSON.parse(content);
    if (accounts && accounts.aggressive && accounts.balanced && accounts.conservative) {
      const initial = createInitialArenaAccounts();
      let updated = false;
      for (const t of ["aggressive", "balanced", "conservative"] as StrategyType[]) {
        if (!accounts[t].account_id) {
          accounts[t].account_id = accounts[t].id || t;
          updated = true;
        }
        if (!accounts[t].candles || accounts[t].candles.length === 0) {
          accounts[t].candles = initial[t].candles;
          updated = true;
        }
        if (!accounts[t].events || accounts[t].events.length === 0) {
          accounts[t].events = initial[t].events;
          updated = true;
        }
      }
      if (updated) {
        fs.writeFileSync(ARENA_DATA_FILE, JSON.stringify(accounts, null, 2), "utf8");
      }
      return accounts;
    }
    const fresh = createInitialArenaAccounts();
    fs.writeFileSync(ARENA_DATA_FILE, JSON.stringify(fresh, null, 2), "utf8");
    return fresh;
  } catch (err) {
    console.error("[ArenaStore] 载入模拟竞技场数据异常，使用基准初始化:", err);
    return createInitialArenaAccounts();
  }
}

/**
 * 保存账户最新快照
 */
export function saveArenaAccounts(accounts: Record<StrategyType, ArenaAccount>) {
  try {
    const dir = path.dirname(ARENA_DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ARENA_DATA_FILE, JSON.stringify(accounts, null, 2), "utf8");
  } catch (err) {
    console.error("[ArenaStore] 持久化模拟竞技场异常:", err);
  }
}

/**
 * 核心：通过腾讯与新浪多源行情实时同步三个账户中持仓的真实最新价格与估值
 * 杜绝假数据：若接口拉取失败，保留原有价格并标注数据状态
 */
export async function syncArenaAccountsWithRealQuotes(): Promise<Record<StrategyType, ArenaAccount>> {
  const accounts = loadArenaAccounts();

  // 收集三大账户所有持仓股票代码
  const allCodes = new Set<string>();
  Object.values(accounts).forEach((acc) => {
    acc.positions.forEach((pos) => allCodes.add(pos.code));
  });

  if (allCodes.size === 0) return accounts;

  try {
    const quotes = await getRealStockQuotes(Array.from(allCodes));

    for (const type of ["aggressive", "balanced", "conservative"] as StrategyType[]) {
      const acc = accounts[type];
      let newMv = 0;
      let dayPnlSum = 0;

      for (const pos of acc.positions) {
        const q = quotes[pos.code];
        if (q && q.current_price > 0) {
          pos.current_price = q.current_price;
          pos.market_value = Math.round(pos.shares * q.current_price);
          pos.pnl = Math.round(pos.shares * (q.current_price - pos.cost_price));
          pos.pnl_pct = parseFloat((((q.current_price - pos.cost_price) / pos.cost_price) * 100).toFixed(2));
          dayPnlSum += Math.round(pos.shares * (q.current_price - q.pre_close));
        }
        newMv += pos.market_value;
      }

      acc.market_value = newMv;
      acc.total_equity = parseFloat((acc.cash + newMv).toFixed(2));
      acc.total_return_pct = parseFloat((((acc.total_equity - acc.initial_capital) / acc.initial_capital) * 100).toFixed(2));
      acc.today_pnl = dayPnlSum;
      acc.today_pnl_pct = parseFloat(((dayPnlSum / acc.total_equity) * 100).toFixed(2));
      acc.current_exposure_pct = parseFloat(((newMv / acc.total_equity) * 100).toFixed(1));
      acc.position_count = acc.positions.length;

      // 重新核算持仓个股的权重
      for (const pos of acc.positions) {
        pos.weight_pct = parseFloat(((pos.market_value / acc.total_equity) * 100).toFixed(1));
      }

      // 同步最新日K线数据
      if (acc.candles && acc.candles.length > 0) {
        const lastCandle = acc.candles[acc.candles.length - 1];
        lastCandle.close_pnl_pct = acc.total_return_pct;
        lastCandle.equity = acc.total_equity;
        lastCandle.high_pnl_pct = Math.max(lastCandle.high_pnl_pct, acc.total_return_pct);
        lastCandle.low_pnl_pct = Math.min(lastCandle.low_pnl_pct, acc.total_return_pct);
      }

      // 动态核算风控与熔断保护模式
      const currentDD = Math.min(0, parseFloat((((acc.total_equity - acc.initial_capital) / acc.initial_capital) * 100).toFixed(2)));
      acc.max_drawdown_pct = Math.min(acc.max_drawdown_pct, currentDD);

      if (currentDD <= -20.0) {
        acc.risk_status = "PROTECTION_MODE";
        acc.is_protection_mode = true;
      } else if (currentDD <= -15.0) {
        acc.risk_status = "CRITICAL";
        acc.is_protection_mode = false;
      } else if (currentDD <= -10.0) {
        acc.risk_status = "WARNING";
        acc.is_protection_mode = false;
      } else if (currentDD <= -5.0) {
        acc.risk_status = "WATCH";
        acc.is_protection_mode = false;
      } else {
        acc.risk_status = "SAFE";
        acc.is_protection_mode = false;
      }
    }

    saveArenaAccounts(accounts);
  } catch (err) {
    console.error("[ArenaStore] 实时更新行情失败，使用现有快照:", err);
  }

  return accounts;
}

/**
 * 策略排名计算引擎 (综合 30% 收益率 + 25% 夏普 + 20% 最大回撤 + 15% 卡玛 + 10% 胜率盈亏比)
 */
export function calculateStrategyRankings(accounts: Record<StrategyType, ArenaAccount>): StrategyRankingItem[] {
  const items: StrategyRankingItem[] = [];

  for (const type of ["aggressive", "balanced", "conservative"] as StrategyType[]) {
    const acc = accounts[type];

    // 1. 收益得分 (0-30)
    const retScore = Math.max(0, Math.min(30, acc.total_return_pct * 6.5));
    // 2. 夏普得分 (0-25)
    const shaScore = Math.max(0, Math.min(25, acc.sharpe_ratio * 11));
    // 3. 回撤控制得分 (0-20, 回撤越小得分越高)
    const ddScore = Math.max(0, Math.min(20, 20 - Math.abs(acc.max_drawdown_pct) * 5));
    // 4. 卡玛得分 (0-15)
    const calScore = Math.max(0, Math.min(15, acc.calmar_ratio * 5.5));
    // 5. 胜率与盈亏比得分 (0-10)
    const winScore = Math.max(0, Math.min(10, (acc.win_rate_pct / 10) * 0.6 + acc.profit_factor * 1.2));

    const total = parseFloat((retScore + shaScore + ddScore + calScore + winScore).toFixed(1));

    let reason = "";
    if (type === "aggressive") {
      reason = "收益率与Alpha领跑全场（超短龙头战法+8.80%），5连板总龙头百大集团斩获连板溢价，持仓≤2只满仓单挑，盈亏比高达8.5";
    } else if (type === "balanced") {
      reason = "风险收益比均衡，回撤严格控制在-0.85%以内，GARP配置兼顾稳健性与向上弹性";
    } else {
      reason = "最大回撤最小（仅-0.35%），防御能力极佳，但收益弹性在普涨行情中相对滞后";
    }

    items.push({
      rank: 0,
      strategy: type,
      name: acc.name,
      total_score: total,
      return_score: parseFloat(retScore.toFixed(1)),
      sharpe_score: parseFloat(shaScore.toFixed(1)),
      drawdown_score: parseFloat(ddScore.toFixed(1)),
      calmar_score: parseFloat(calScore.toFixed(1)),
      winrate_score: parseFloat(winScore.toFixed(1)),
      reason,
    });
  }

  items.sort((a, b) => b.total_score - a.total_score);
  items.forEach((item, index) => {
    item.rank = index + 1;
  });

  return items;
}

/**
 * 月度策略实验记录 (Experiment Center #001)
 */
export function getLatestExperiment(): StrategyExperiment {
  return {
    experiment_id: "EXP-202609-001",
    name: "2026年9月金秋开门红·三策略实盘模拟对抗赛",
    period: "2026-09-07 ~ 2026-09-30",
    start_date: "2026-09-07",
    end_date: "2026-09-30",
    initial_capital_per_account: 100000,
    strategies: ["aggressive", "balanced", "conservative"],
    versions: {
      aggressive: "v1.0 (突破动量)",
      balanced: "v1.0 (GARP成长)",
      conservative: "v1.0 (高股息低波)",
    },
    cost_model: {
      commission_rate: 0.00025,
      stamp_tax_rate: 0.0005,
      slippage_rate: 0.0002,
      min_commission: 5.0,
    },
    winner: "aggressive",
    runner_up: "balanced",
    third: "conservative",
    evaluation_summary: "当前市场处于放量攻坚与结构性主升阶段，两市成交额突破1.9万亿，激进策略凭借高仓位抓牢CPO光模块龙头，Alpha超额最为明显；均衡策略抗跌平稳，保守策略筑牢底线。",
  };
}
