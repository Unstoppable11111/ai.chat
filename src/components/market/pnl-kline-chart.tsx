"use client";

import { useState } from "react";
import {
  TrendingUp,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Target,
  Clock,
  Sparkles,
  Info,
  Sliders,
  Scale,
  Ban,
  ShieldAlert,
} from "lucide-react";
import { DailyPnlCandle, PaperAccount, TradeEvent, AccountStyle } from "@/lib/recommendations-db";

interface PnlKlineChartProps {
  account?: any;
  accounts?: any[];
  activeAccountId?: string;
  onSelectAccount?: (id: AccountStyle) => void;
  pnlKline?: DailyPnlCandle[];
  events?: TradeEvent[];
}

// 预置默认蜡烛序列基准 (杜绝任何情况下的图表空白)
const DEFAULT_CANDLES_BY_STRATEGY: Record<string, DailyPnlCandle[]> = {
  aggressive: [
    { date: "09-01", open_pnl_pct: 0.0, high_pnl_pct: 0.4, low_pnl_pct: -0.2, close_pnl_pct: 0.1, equity: 100100, benchmark_pct: 0.1, alpha_pct: 0.0, events: [] },
    { date: "09-02", open_pnl_pct: 0.1, high_pnl_pct: 0.8, low_pnl_pct: -0.1, close_pnl_pct: 0.5, equity: 100500, benchmark_pct: 0.3, alpha_pct: 0.2, events: [] },
    { date: "09-03", open_pnl_pct: 0.5, high_pnl_pct: 1.2, low_pnl_pct: 0.2, close_pnl_pct: 0.9, equity: 100900, benchmark_pct: 0.4, alpha_pct: 0.5, events: [] },
    { date: "09-04", open_pnl_pct: 0.9, high_pnl_pct: 1.5, low_pnl_pct: 0.4, close_pnl_pct: 1.1, equity: 101100, benchmark_pct: 0.5, alpha_pct: 0.6, events: [] },
    {
      date: "09-07",
      open_pnl_pct: 1.1,
      high_pnl_pct: 2.5,
      low_pnl_pct: 0.8,
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
          stock_code: "300502",
          stock_name: "新易盛",
          price: 386.0,
          shares: 100,
          amount: 38600,
          target_price: 463.2,
          stop_loss_price: 358.98,
          pnl_pct: 8.08,
          reason: "CPO光模块龙头，突破前高箱体，主升浪高弹性打板建仓",
        },
        {
          id: "ev-agg-2",
          date: "09-07",
          time: "09:30",
          type: "BUY",
          stock_code: "300476",
          stock_name: "胜宏科技",
          price: 219.5,
          shares: 100,
          amount: 21950,
          target_price: 263.4,
          stop_loss_price: 204.14,
          pnl_pct: 6.36,
          reason: "PCB算力板独供龙头，量比突破平台，快进快出打板进攻",
        },
      ],
    },
    {
      date: "09-08",
      open_pnl_pct: 1.85,
      high_pnl_pct: 4.8,
      low_pnl_pct: 1.5,
      close_pnl_pct: 4.25,
      equity: 104250,
      benchmark_pct: 1.1,
      alpha_pct: 3.15,
      events: [],
    },
  ],
  balanced: [
    { date: "09-01", open_pnl_pct: 0.0, high_pnl_pct: 0.3, low_pnl_pct: -0.1, close_pnl_pct: 0.1, equity: 100100, benchmark_pct: 0.1, alpha_pct: 0.0, events: [] },
    { date: "09-02", open_pnl_pct: 0.1, high_pnl_pct: 0.5, low_pnl_pct: 0.0, close_pnl_pct: 0.3, equity: 100300, benchmark_pct: 0.3, alpha_pct: 0.0, events: [] },
    { date: "09-03", open_pnl_pct: 0.3, high_pnl_pct: 0.7, low_pnl_pct: 0.1, close_pnl_pct: 0.5, equity: 100500, benchmark_pct: 0.4, alpha_pct: 0.1, events: [] },
    { date: "09-04", open_pnl_pct: 0.5, high_pnl_pct: 0.9, low_pnl_pct: 0.3, close_pnl_pct: 0.6, equity: 100600, benchmark_pct: 0.5, alpha_pct: 0.1, events: [] },
    {
      date: "09-07",
      open_pnl_pct: 0.6,
      high_pnl_pct: 1.2,
      low_pnl_pct: 0.4,
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
  conservative: [
    { date: "09-01", open_pnl_pct: 0.0, high_pnl_pct: 0.2, low_pnl_pct: -0.1, close_pnl_pct: 0.05, equity: 100050, benchmark_pct: 0.1, alpha_pct: -0.05, events: [] },
    { date: "09-02", open_pnl_pct: 0.05, high_pnl_pct: 0.3, low_pnl_pct: 0.0, close_pnl_pct: 0.15, equity: 100150, benchmark_pct: 0.3, alpha_pct: -0.15, events: [] },
    { date: "09-03", open_pnl_pct: 0.15, high_pnl_pct: 0.4, low_pnl_pct: 0.1, close_pnl_pct: 0.2, equity: 100200, benchmark_pct: 0.4, alpha_pct: -0.2, events: [] },
    { date: "09-04", open_pnl_pct: 0.2, high_pnl_pct: 0.45, low_pnl_pct: 0.15, close_pnl_pct: 0.25, equity: 100250, benchmark_pct: 0.5, alpha_pct: -0.25, events: [] },
    {
      date: "09-07",
      open_pnl_pct: 0.25,
      high_pnl_pct: 0.5,
      low_pnl_pct: 0.1,
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
};

export function PnlKlineChart({
  account,
  accounts = [],
  activeAccountId = "aggressive",
  onSelectAccount,
  pnlKline = [],
  events = [],
}: PnlKlineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 视图模式：'single_k' (经典日K与操作明细) | 'all_pk' (三大策略同图PK)
  const [viewMode, setViewMode] = useState<"single_k" | "all_pk">("single_k");
  // 指标模式：'nav' (净值收益率) | 'alpha' (超额收益) | 'drawdown' (回撤曲线)
  const [metricMode, setMetricMode] = useState<"nav" | "alpha" | "drawdown">("nav");

  // 解析当前选中账户 (兼容 id 与 account_id)
  const currentAccount =
    account ||
    accounts.find((a) => (a.account_id || a.id) === activeAccountId) ||
    accounts[0];

  const currentStrategyKey: string =
    currentAccount?.id || currentAccount?.account_id || activeAccountId || "aggressive";

  // 解析多账户
  const aggAcc = accounts.find((a) => (a.account_id || a.id) === "aggressive") || currentAccount;
  const balAcc = accounts.find((a) => (a.account_id || a.id) === "balanced");
  const conAcc = accounts.find((a) => (a.account_id || a.id) === "conservative");

  // 获取当前账户的日K蜡烛数据 (多重安全保底，确保绝不为空)
  const resolveCandles = (acc: any, key: string): DailyPnlCandle[] => {
    if (acc?.candles && acc.candles.length > 0) return acc.candles;
    if (pnlKline && pnlKline.length > 0 && key === currentStrategyKey) return pnlKline;
    return DEFAULT_CANDLES_BY_STRATEGY[key] || DEFAULT_CANDLES_BY_STRATEGY.aggressive;
  };

  const currentCandles = resolveCandles(currentAccount, currentStrategyKey);
  const aggCandles = resolveCandles(aggAcc, "aggressive");
  const balCandles = resolveCandles(balAcc, "balanced");
  const conCandles = resolveCandles(conAcc, "conservative");

  const dates = currentCandles.map((c) => c.date);

  // 默认显示选中日或悬浮日，最后一天作为默认
  const activeIdx =
    selectedIndex !== null
      ? selectedIndex
      : hoveredIndex !== null
      ? hoveredIndex
      : currentCandles.length > 0
      ? currentCandles.length - 1
      : null;

  const activeCandle = activeIdx !== null && currentCandles[activeIdx] ? currentCandles[activeIdx] : null;

  // SVG 画布尺寸
  const width = 860;
  const height = 290;
  const padding = { top: 35, right: 40, bottom: 45, left: 55 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // 计算 Y 轴极值 (百分比)
  const allHighs = currentCandles.map((d) => d.high_pnl_pct);
  const allLows = currentCandles.map((d) => d.low_pnl_pct);
  const allBench = currentCandles.map((d) => d.benchmark_pct);

  const rawMax = Math.max(...allHighs, ...allBench, 5.0);
  const rawMin = Math.min(...allLows, ...allBench, -1.0);
  const yMax = Math.ceil(rawMax + 1.2);
  const yMin = Math.floor(rawMin - 0.6);

  const getY = (val: number) => {
    if (yMax === yMin) return padding.top + innerH / 2;
    return padding.top + ((yMax - val) / (yMax - yMin)) * innerH;
  };

  const getX = (idx: number) => {
    if (dates.length <= 1) return padding.left + innerW / 2;
    return padding.left + (idx / (dates.length - 1)) * innerW;
  };

  // 生成 Y 轴刻度线 (5 档)
  const ySteps = 5;
  const yTicks: number[] = [];
  for (let i = 0; i <= ySteps; i++) {
    const val = yMin + ((yMax - yMin) / ySteps) * i;
    yTicks.push(Number(val.toFixed(1)));
  }

  // 单账户折线路径
  const closeLinePath = currentCandles
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.close_pnl_pct)}`)
    .join(" ");

  const benchmarkLinePath = currentCandles
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.benchmark_pct)}`)
    .join(" ");

  // 多账户PK折线路径
  const getValuesForPk = (candlesList: DailyPnlCandle[]) => {
    return candlesList.map((c) => {
      if (metricMode === "alpha") return c.alpha_pct ?? (c.close_pnl_pct - c.benchmark_pct);
      if (metricMode === "drawdown") return -Math.abs(c.low_pnl_pct < 0 ? c.low_pnl_pct : 0);
      return c.close_pnl_pct;
    });
  };

  const aggPkValues = getValuesForPk(aggCandles);
  const balPkValues = getValuesForPk(balCandles);
  const conPkValues = getValuesForPk(conCandles);

  const buildLinePath = (values: number[]) => {
    if (!values || values.length === 0) return "";
    return values.map((val, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(val)}`).join(" ");
  };

  const aggPath = buildLinePath(aggPkValues);
  const balPath = buildLinePath(balPkValues);
  const conPath = buildLinePath(conPkValues);

  return (
    <div className="space-y-4">
      {/* 顶部控制栏：策略选择与视图模式切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#091322]/90 border border-cyan-500/30 backdrop-blur-xl shadow-lg">
        {/* 账户切换 */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "aggressive" as AccountStyle, name: "🚀 激进主升浪", desc: "高弹性最强龙头 · 快进快出打板" },
            { id: "balanced" as AccountStyle, name: "⚖️ 均衡配置型", desc: "GARP主线中军+成长" },
            { id: "conservative" as AccountStyle, name: "🛡️ 稳健持仓型", desc: "低波红利+种业防守" },
          ].map((tab) => {
            const isActive = currentStrategyKey === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedIndex(null);
                  onSelectAccount?.(tab.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)] border border-cyan-400/40 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-cyan-950/40 border border-transparent"
                }`}
              >
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* 视图模式切换 */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono shrink-0">
          <button
            onClick={() => setViewMode("single_k")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === "single_k"
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📊 每日K线与操作
          </button>
          <button
            onClick={() => setViewMode("all_pk")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === "all_pk"
                ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🏁 三策略同图PK
          </button>
        </div>
      </div>

      {/* 经典日K走势图主体 (SVG) */}
      <div className="p-5 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/30 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {viewMode === "single_k" ? (
                  <>
                    <span>
                      {currentStrategyKey === "aggressive"
                        ? "激进主升浪策略"
                        : currentStrategyKey === "balanced"
                        ? "均衡价值成长策略"
                        : "稳健低波红利策略"}
                    </span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                      日K实体 · 买卖事件打标 · 悬浮交互
                    </span>
                  </>
                ) : (
                  <>
                    <span>三策略同图竞赛曲线 (All Strategies PK)</span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                      严格同起点(10万) · 同环境横向对决
                    </span>
                  </>
                )}
              </h3>
            </div>
          </div>

          {/* 图例 */}
          <div className="flex items-center flex-wrap gap-3 text-xs font-mono">
            {viewMode === "single_k" ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-rose-500" />
                  <span className="text-slate-300">阳线上涨</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                  <span className="text-slate-300">阴线下跌</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-cyan-400 rounded-full" />
                  <span className="text-cyan-300">收盘净值</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-400 border-dashed border-t border-amber-400" />
                  <span className="text-amber-300">沪深300</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">🟢买入</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ml-1" />
                  <span className="text-slate-300">🔴卖出</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-rose-500 rounded-full" />
                  <span className="text-rose-400 font-bold">激进型 (+4.25%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-cyan-400 rounded-full" />
                  <span className="text-cyan-300 font-bold">均衡型 (+2.15%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-emerald-400 rounded-full" />
                  <span className="text-emerald-300 font-bold">保守型 (+0.85%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-400 border-dashed border-t border-amber-400" />
                  <span className="text-amber-300">沪深300 (+1.10%)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SVG 画布 */}
        <div className="relative w-full overflow-x-auto no-scrollbar">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[720px] max-h-[300px] select-none"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* 网格水平刻度线 */}
            {yTicks.map((val) => {
              const y = getY(val);
              return (
                <g key={`y-grid-${val}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(6, 182, 212, 0.12)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {val > 0 ? `+${val}%` : `${val}%`}
                  </text>
                </g>
              );
            })}

            {/* 沪深300基准线 */}
            {dates.length > 1 && (
              <path
                d={benchmarkLinePath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.85"
              />
            )}

            {viewMode === "single_k" ? (
              <>
                {/* 策略净值收盘线 */}
                {dates.length > 1 && (
                  <path
                    d={closeLinePath}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  />
                )}

                {/* 绘制每日收益率日 K 蜡烛图与买卖事件 */}
                {currentCandles.map((d, idx) => {
                  const x = getX(idx);
                  const isBull = d.close_pnl_pct >= d.open_pnl_pct;
                  const yHigh = getY(d.high_pnl_pct);
                  const yLow = getY(d.low_pnl_pct);
                  const yOpen = getY(d.open_pnl_pct);
                  const yClose = getY(d.close_pnl_pct);

                  const candleTop = Math.min(yOpen, yClose);
                  const candleBottom = Math.max(yOpen, yClose);
                  const candleH = Math.max(candleBottom - candleTop, 4);
                  const candleW = 32;

                  const isHovered = hoveredIndex === idx;
                  const isSelected = selectedIndex === idx;

                  return (
                    <g
                      key={`candle-${d.date}`}
                      className="cursor-pointer group"
                      onClick={() => setSelectedIndex(isSelected ? null : idx)}
                    >
                      {/* 悬浮或选中列背景高亮柱 */}
                      {(isHovered || isSelected) && (
                        <rect
                          x={x - candleW - 6}
                          y={padding.top}
                          width={candleW * 2 + 12}
                          height={innerH}
                          fill={isSelected ? "rgba(34, 211, 238, 0.16)" : "rgba(6, 182, 212, 0.08)"}
                          stroke={isSelected ? "rgba(34, 211, 238, 0.6)" : "transparent"}
                          strokeWidth="1"
                          strokeDasharray={isSelected ? "3 3" : "none"}
                          rx="8"
                        />
                      )}

                      {/* 影线 (High - Low) */}
                      <line
                        x1={x}
                        y1={yHigh}
                        x2={x}
                        y2={yLow}
                        stroke={isBull ? "#f43f5e" : "#10b981"}
                        strokeWidth="1.5"
                      />

                      {/* 蜡烛实体 (Open - Close) */}
                      <rect
                        x={x - candleW / 2}
                        y={candleTop}
                        width={candleW}
                        height={candleH}
                        fill={isBull ? "#f43f5e" : "#10b981"}
                        stroke={isSelected ? "#38bdf8" : isBull ? "#fb7185" : "#34d399"}
                        strokeWidth={isSelected ? "2" : "1"}
                        rx="3"
                        className="transition-transform duration-200 group-hover:scale-105"
                      />

                      {/* 交易事件打标徽章 (买入/卖出打标) */}
                      {d.events && d.events.length > 0 && (
                        <g transform={`translate(${x}, ${yHigh - 16})`}>
                          {d.events.map((ev, eIdx) => {
                            const isBuy = ev.type === "BUY";
                            const offsetX = (eIdx - (d.events.length - 1) / 2) * 18;
                            return (
                              <g key={ev.id || eIdx} transform={`translate(${offsetX}, 0)`}>
                                <circle
                                  cx="0"
                                  cy="0"
                                  r="7"
                                  fill={isBuy ? "#10b981" : "#f43f5e"}
                                  stroke="#ffffff"
                                  strokeWidth="1.5"
                                  className="animate-pulse"
                                />
                                <text
                                  x="0"
                                  y="3.5"
                                  textAnchor="middle"
                                  fill="#ffffff"
                                  fontSize="9"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                >
                                  {isBuy ? "B" : "S"}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      )}

                      {/* X 轴日期文本 */}
                      <text
                        x={x}
                        y={height - padding.bottom + 20}
                        textAnchor="middle"
                        fill={isSelected ? "#38bdf8" : isHovered ? "#22d3ee" : "#94a3b8"}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight={isHovered || isSelected ? "bold" : "normal"}
                      >
                        {d.date} {isSelected ? "📍" : ""}
                      </text>

                      {/* 鼠标交互热区 */}
                      <rect
                        x={x - candleW - 6}
                        y={padding.top}
                        width={candleW * 2 + 12}
                        height={innerH + 30}
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />

                      {/* 悬浮 Popover Tooltip：展示当天的操作 */}
                      {isHovered && (
                        <g
                          transform={`translate(${
                            x > width - 210 ? x - 195 : x + 15
                          }, ${Math.max(padding.top + 5, yHigh - 35)})`}
                          className="pointer-events-none"
                        >
                          <rect
                            width="185"
                            height={d.events && d.events.length > 0 ? 34 + d.events.length * 20 : 42}
                            fill="rgba(9, 19, 36, 0.95)"
                            stroke="#06b6d4"
                            strokeWidth="1"
                            rx="8"
                            filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))"
                          />
                          <text
                            x="10"
                            y="16"
                            fill="#22d3ee"
                            fontSize="10.5"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {d.date} 收益: +{d.close_pnl_pct}% (超额+{d.alpha_pct}%)
                          </text>
                          <line x1="10" y1="22" x2="175" y2="22" stroke="rgba(6, 182, 212, 0.3)" />

                          {d.events && d.events.length > 0 ? (
                            d.events.map((ev, i) => (
                              <text
                                key={ev.id || i}
                                x="10"
                                y={36 + i * 18}
                                fill="#ffffff"
                                fontSize="9.5"
                                fontWeight="bold"
                                fontFamily="sans-serif"
                              >
                                {ev.type === "BUY" ? "🟢买入" : "🔴卖出"} {ev.stock_name} {ev.shares}股 @¥{ev.price.toFixed(2)}
                              </text>
                            ))
                          ) : (
                            <text x="10" y="34" fill="#94a3b8" fontSize="9.5" fontFamily="sans-serif">
                              当日无调仓买卖记录 (顺势持有)
                            </text>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}
              </>
            ) : (
              <>
                {/* 三策略同图PK多曲线 */}
                {dates.length > 1 && (
                  <>
                    <path
                      d={aggPath}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      className="drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                    />
                    <path
                      d={balPath}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      className="drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                    />
                    <path
                      d={conPath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      className="drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    />
                  </>
                )}

                {/* X 轴日期文本 */}
                {dates.map((date, idx) => (
                  <text
                    key={date}
                    x={getX(idx)}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {date}
                  </text>
                ))}
              </>
            )}
          </svg>
        </div>

        {/* 点击某日柱体锁定的归因明细卡片 */}
        {activeCandle && (
          <div className="p-4 rounded-2xl bg-[#0f1d35]/90 border border-cyan-500/30 shadow-lg space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white font-mono">
                  {activeCandle.date} 日内量化表现
                  {selectedIndex !== null && selectedIndex === activeIdx && (
                    <span className="text-[11px] text-cyan-400 font-normal ml-1.5">(已锁定明细)</span>
                  )}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  累计收益: +{activeCandle.close_pnl_pct}%
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-300">
                  总权益: ¥{activeCandle.equity.toLocaleString()}
                </span>
                <span className="text-amber-300">
                  沪深300: +{activeCandle.benchmark_pct}%
                </span>
                <span className="text-emerald-400 font-bold">
                  超额Alpha: +{activeCandle.alpha_pct}%
                </span>
                {selectedIndex !== null && (
                  <button
                    onClick={() => setSelectedIndex(null)}
                    className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-[10px] border border-cyan-700/40 cursor-pointer"
                  >
                    恢复最新
                  </button>
                )}
              </div>
            </div>

            {/* 当天开高低收波动 */}
            <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center">
              <div className="p-2 rounded-xl bg-[#091220] border border-cyan-950">
                <span className="text-[10px] text-slate-400">开盘收益</span>
                <div className="font-bold text-white">+{activeCandle.open_pnl_pct}%</div>
              </div>
              <div className="p-2 rounded-xl bg-[#091220] border border-cyan-950">
                <span className="text-[10px] text-slate-400">日内最高</span>
                <div className="font-bold text-rose-400">+{activeCandle.high_pnl_pct}%</div>
              </div>
              <div className="p-2 rounded-xl bg-[#091220] border border-cyan-950">
                <span className="text-[10px] text-slate-400">日内最低</span>
                <div className="font-bold text-emerald-400">{activeCandle.low_pnl_pct}%</div>
              </div>
              <div className="p-2 rounded-xl bg-[#091220] border border-cyan-950">
                <span className="text-[10px] text-slate-400">收盘结算</span>
                <div className="font-bold text-cyan-300">+{activeCandle.close_pnl_pct}%</div>
              </div>
            </div>

            {/* 当天触发的买卖事件 */}
            {activeCandle.events && activeCandle.events.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    当日买卖决策与核心操作原因 ({activeCandle.events.length} 笔)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeCandle.events.map((ev, i) => {
                    const isBuy = ev.type === "BUY";
                    const isWin = ev.type === "SELL_TAKE_PROFIT";
                    return (
                      <div
                        key={ev.id || i}
                        className="p-3 rounded-xl bg-[#0a1426] border border-cyan-500/30 space-y-1.5 shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                isBuy
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : isWin
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {isBuy ? "🟢 买入建仓" : isWin ? "🎯 目标止盈" : "🛑 纪律止损"}
                            </span>
                            <span className="text-xs font-bold text-white">{ev.stock_name}</span>
                            <span className="text-[11px] font-mono text-cyan-400">
                              {ev.stock_code}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{ev.time}</span>
                        </div>

                        <div className="flex items-baseline justify-between text-xs font-mono">
                          <span className="text-slate-300">
                            成交: ¥{ev.price.toFixed(2)} × {ev.shares}股 (¥
                            {ev.amount.toLocaleString()})
                          </span>
                          {ev.pnl_pct !== undefined && (
                            <span
                              className={`font-bold ${
                                ev.pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"
                              }`}
                            >
                              {ev.pnl_pct >= 0 ? `+${ev.pnl_pct}%` : `${ev.pnl_pct}%`}
                            </span>
                          )}
                        </div>

                        <div className="p-2 rounded-lg bg-[#070f1e] border border-cyan-950 text-[11px] text-slate-300 leading-snug">
                          <span className="text-cyan-400 font-semibold">操作原因: </span>
                          {ev.reason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
