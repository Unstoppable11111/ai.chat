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
} from "lucide-react";
import { DailyPnlCandle, PaperAccount, TradeEvent, AccountStyle } from "@/lib/recommendations-db";

interface PnlKlineChartProps {
  account?: PaperAccount;
  accounts?: PaperAccount[];
  activeAccountId?: string;
  onSelectAccount?: (id: AccountStyle) => void;
  pnlKline?: DailyPnlCandle[];
  events?: TradeEvent[];
}

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

  // 视图模式：'all_pk' (三大策略同图PK) | 'single_k' (单策略日K)
  const [viewMode, setViewMode] = useState<"all_pk" | "single_k">("all_pk");
  // 指标模式：'nav' (净值收益率) | 'alpha' (超额收益) | 'drawdown' (回撤曲线)
  const [metricMode, setMetricMode] = useState<"nav" | "alpha" | "drawdown">("nav");
  // 周期：'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' (默认 1M)
  const [timeRange, setTimeRange] = useState<"1D" | "1W" | "1M" | "3M" | "6M" | "1Y">("1M");

  // 当前账户
  const currentAccount = account || accounts.find((a) => a.account_id === activeAccountId) || accounts[0];

  // 统一的交易日日期序列（保证同图多曲线严格对齐）
  const aggAcc = accounts.find((a) => a.account_id === "aggressive") || currentAccount;
  const balAcc = accounts.find((a) => a.account_id === "balanced");
  const conAcc = accounts.find((a) => a.account_id === "conservative");

  // 基础蜡烛序列
  const baseCandles = currentAccount?.candles || pnlKline || [];
  const dates = baseCandles.map((c) => c.date);

  const activeIdx =
    selectedIndex !== null
      ? selectedIndex
      : hoveredIndex !== null
      ? hoveredIndex
      : dates.length > 0
      ? dates.length - 1
      : null;

  // SVG 画布尺寸
  const width = 860;
  const height = 280;
  const padding = { top: 35, right: 40, bottom: 45, left: 55 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // 提取各策略在对应日期的数值
  const getValuesForAccount = (acc?: PaperAccount) => {
    if (!acc || !acc.candles) return [];
    return acc.candles.map((c) => {
      if (metricMode === "alpha") return c.alpha_pct ?? (c.close_pnl_pct - c.benchmark_pct);
      if (metricMode === "drawdown") return -Math.abs(c.low_pnl_pct < 0 ? c.low_pnl_pct : 0);
      return c.close_pnl_pct;
    });
  };

  const aggValues = getValuesForAccount(aggAcc);
  const balValues = getValuesForAccount(balAcc);
  const conValues = getValuesForAccount(conAcc);
  const benchValues = baseCandles.map((c) => (metricMode === "alpha" ? 0 : c.benchmark_pct));

  // 计算 Y 轴极值 (百分比)
  const allValues = [
    ...aggValues,
    ...balValues,
    ...conValues,
    ...(metricMode !== "alpha" ? benchValues : [0]),
  ];

  const rawMax = allValues.length > 0 ? Math.max(...allValues, 2.0) : 5.0;
  const rawMin = allValues.length > 0 ? Math.min(...allValues, -0.5) : -1.0;
  const yMax = Math.ceil(rawMax + 1.0);
  const yMin = Math.floor(rawMin - 0.5);

  const getY = (val: number) => {
    if (yMax === yMin) return padding.top + innerH / 2;
    return padding.top + ((yMax - val) / (yMax - yMin)) * innerH;
  };

  const getX = (idx: number) => {
    if (dates.length <= 1) return padding.left + innerW / 2;
    return padding.left + (idx / (dates.length - 1)) * innerW;
  };

  // 生成 Y 轴刻度线 (5 档)
  const ySteps = 4;
  const yTicks: number[] = [];
  for (let i = 0; i <= ySteps; i++) {
    const val = yMin + ((yMax - yMin) / ySteps) * i;
    yTicks.push(Number(val.toFixed(1)));
  }

  // 折线路径生成器
  const buildLinePath = (values: number[]) => {
    if (!values || values.length === 0) return "";
    return values.map((val, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(val)}`).join(" ");
  };

  const aggPath = buildLinePath(aggValues);
  const balPath = buildLinePath(balValues);
  const conPath = buildLinePath(conValues);
  const benchPath = buildLinePath(benchValues);

  return (
    <div className="space-y-4">
      {/* 顶部控制栏：模式切换、周期选择与账户切换 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#091322]/90 border border-cyan-500/30 shadow-lg">
        <div className="flex items-center flex-wrap gap-2">
          {/* 同图PK vs 单账户切换 */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => setViewMode("all_pk")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === "all_pk"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🏁 三策略同图PK (重点)
            </button>
            <button
              onClick={() => setViewMode("single_k")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === "single_k"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📊 单账户日K深度
            </button>
          </div>

          {/* 曲线指标模式切换 */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => setMetricMode("nav")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricMode === "nav" ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/30" : "text-slate-400"
              }`}
            >
              净值收益 (NAV)
            </button>
            <button
              onClick={() => setMetricMode("alpha")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricMode === "alpha" ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/30" : "text-slate-400"
              }`}
            >
              超额收益 (Alpha)
            </button>
            <button
              onClick={() => setMetricMode("drawdown")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricMode === "drawdown" ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-500/30" : "text-slate-400"
              }`}
            >
              回撤控制 (MDD)
            </button>
          </div>
        </div>

        {/* 周期切换按钮 (1D ~ 1Y) */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
          {(["1D", "1W", "1M", "3M", "6M", "1Y"] as const).map((rng) => (
            <button
              key={rng}
              onClick={() => setTimeRange(rng)}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                timeRange === rng
                  ? "bg-cyan-500 text-black font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {rng}
            </button>
          ))}
        </div>
      </div>

      {/* SVG 多曲线同图对比图表卡片 */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-b from-[#0c182b]/95 via-[#08111e]/95 to-[#0c182b]/95 border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.12)]">
        {/* 顶栏图例指示说明 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-900/40 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              STRATEGY PERFORMANCE CURVES
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              基准: 沪深300 (000300) · 初始资金: 各10万元
            </span>
          </div>

          {/* 图例 (Legend) */}
          <div className="flex items-center flex-wrap gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onSelectAccount?.("aggressive")}>
              <span className="w-3 h-1 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-bold">激进 (+4.25%)</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onSelectAccount?.("balanced")}>
              <span className="w-3 h-1 rounded-full bg-cyan-400" />
              <span className="text-cyan-300 font-bold">均衡 (+2.15%)</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onSelectAccount?.("conservative")}>
              <span className="w-3 h-1 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold">保守 (+0.85%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-500/80" />
              <span className="text-amber-300/70">沪深300 (+1.10%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-slate-600" />
              <span className="text-slate-400">现金基准 (0%)</span>
            </div>
          </div>
        </div>

        {/* 动态悬浮十字线详细数据胶囊 */}
        {activeIdx !== null && (
          <div className="my-3 p-3 rounded-2xl bg-[#070e18]/90 border border-cyan-500/40 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400">交易日期</span>
              <div className="text-white font-bold">{dates[activeIdx] || "2026-09-08"}</div>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-bold">激进策略</span>
              <div className="text-amber-300 font-bold">
                {aggValues[activeIdx] != null ? `${aggValues[activeIdx] > 0 ? "+" : ""}${aggValues[activeIdx]}%` : "--"}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold">均衡策略</span>
              <div className="text-cyan-300 font-bold">
                {balValues[activeIdx] != null ? `${balValues[activeIdx] > 0 ? "+" : ""}${balValues[activeIdx]}%` : "--"}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold">保守策略</span>
              <div className="text-emerald-400 font-bold">
                {conValues[activeIdx] != null ? `${conValues[activeIdx] > 0 ? "+" : ""}${conValues[activeIdx]}%` : "--"}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-amber-300/80">沪深300基准</span>
              <div className="text-slate-300">
                {benchValues[activeIdx] != null ? `+${benchValues[activeIdx]}%` : "--"}
              </div>
            </div>
          </div>
        )}

        {/* SVG 主图 */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
            {/* 渐变与滤镜定义 */}
            <defs>
              <linearGradient id="aggGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y 轴网格线与刻度 */}
            {yTicks.map((tick) => {
              const y = getY(tick);
              const isZero = tick === 0;
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke={isZero ? "rgba(255,255,255,0.25)" : "rgba(6,182,212,0.1)"}
                    strokeDasharray={isZero ? "none" : "3,3"}
                    strokeWidth={isZero ? 1.2 : 0.8}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    fill={isZero ? "#ffffff" : "#64748b"}
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {tick > 0 ? `+${tick}%` : `${tick}%`}
                  </text>
                </g>
              );
            })}

            {/* X 轴日期刻度 */}
            {dates.map((d, i) => (
              <text
                key={d}
                x={getX(i)}
                y={height - padding.bottom + 20}
                fill={activeIdx === i ? "#06b6d4" : "#64748b"}
                fontSize="11"
                fontWeight={activeIdx === i ? "bold" : "normal"}
                fontFamily="monospace"
                textAnchor="middle"
              >
                {d}
              </text>
            ))}

            {/* 沪深300 基准折线 (琥珀金虚线) */}
            {benchPath && (
              <path
                d={benchPath}
                fill="none"
                stroke="#d97706"
                strokeWidth="1.8"
                strokeDasharray="4,4"
                opacity="0.8"
              />
            )}

            {/* 1. 保守策略折线 (翡翠绿) */}
            {conPath && (
              <path
                d={conPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            )}

            {/* 2. 均衡策略折线 (电光青) */}
            {balPath && (
              <path
                d={balPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* 3. 激进策略折线 (高亮金橙) */}
            {aggPath && (
              <path
                d={aggPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.0"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              />
            )}

            {/* 各策略数据圆点 */}
            {dates.map((_, i) => (
              <g key={i}>
                {aggValues[i] != null && (
                  <circle
                    cx={getX(i)}
                    cy={getY(aggValues[i])}
                    r={activeIdx === i ? 5 : 3.5}
                    fill="#f59e0b"
                    stroke="#0a101d"
                    strokeWidth="2"
                  />
                )}
                {balValues[i] != null && (
                  <circle
                    cx={getX(i)}
                    cy={getY(balValues[i])}
                    r={activeIdx === i ? 4.5 : 3}
                    fill="#06b6d4"
                    stroke="#0a101d"
                    strokeWidth="1.5"
                  />
                )}
                {conValues[i] != null && (
                  <circle
                    cx={getX(i)}
                    cy={getY(conValues[i])}
                    r={activeIdx === i ? 4.5 : 3}
                    fill="#10b981"
                    stroke="#0a101d"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            ))}

            {/* 鼠标交互十字竖线 */}
            {activeIdx !== null && (
              <line
                x1={getX(activeIdx)}
                y1={padding.top}
                x2={getX(activeIdx)}
                y2={height - padding.bottom}
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="2,2"
              />
            )}

            {/* 交互透明点击/悬浮感应热区 */}
            {dates.map((_, i) => (
              <rect
                key={i}
                x={getX(i) - (innerW / (dates.length || 1)) / 2}
                y={padding.top}
                width={innerW / (dates.length || 1)}
                height={innerH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setSelectedIndex(i)}
              />
            ))}
          </svg>
        </div>

        {/* 图表底注 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-cyan-950/60 font-mono">
          <span>* 撮合规则严格遵循 A 股 T+1、百股整数倍与真实买卖摩擦成本模型</span>
          <span className="text-cyan-400">同屏实时对齐对比 ｜ 每日收盘后自动锁定日K净值</span>
        </div>
      </div>
    </div>
  );
}
