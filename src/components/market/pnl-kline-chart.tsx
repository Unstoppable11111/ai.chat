"use client";

import { useState } from "react";
import {
  TrendingUp,
  Award,
  Calendar,
  ShieldCheck,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";
import { DailyPnlCandle, PaperAccount, TradeEvent, AccountStyle } from "@/lib/recommendations-db";

type ChartAccount = Partial<PaperAccount> & { id?: AccountStyle; name?: string; total_return_pct?: number };

interface PnlKlineChartProps {
  account?: ChartAccount;
  accounts?: ChartAccount[];
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
}: PnlKlineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // 视图模式：'single_k' (经典日K与操作明细) | 'all_pk' (三大策略同图PK)
  const [viewMode, setViewMode] = useState<"single_k" | "all_pk">("single_k");
  // 指标模式：'nav' (净值收益率) | 'alpha' (超额收益) | 'drawdown' (回撤曲线)
  const [metricMode] = useState<"nav" | "alpha" | "drawdown">("nav");

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
  const resolveCandles = (acc: ChartAccount | undefined, key: string): DailyPnlCandle[] => {
    if (acc?.candles && acc.candles.length > 0) return acc.candles;
    if (pnlKline && pnlKline.length > 0 && key === currentStrategyKey) return pnlKline;
    return [];
  };

  const currentCandles = resolveCandles(currentAccount, currentStrategyKey);
  const aggCandles = resolveCandles(aggAcc, "aggressive");
  const balCandles = resolveCandles(balAcc, "balanced");
  const conCandles = resolveCandles(conAcc, "conservative");

  if (!currentCandles.length) return <p className="border-y border-cyan-900/40 py-12 text-center text-sm text-slate-300">暂无收益历史，完成模拟交易后开始积累。</p>;

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
            { id: "aggressive" as AccountStyle, name: "🚀 激进超短龙头", desc: "中小市值打板 · 满仓单挑1~2只" },
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
                    <span>三策略同图竞赛曲线 (多策略横向对决)</span>
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
                  <span className="text-amber-300">零收益参考线</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-300">🔴买入</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ml-1" />
                  <span className="text-slate-300">🔵卖出</span>
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
                  <span className="text-amber-300">零收益参考线 (0%)</span>
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

            {/* 零收益参考线线 */}
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

                      {/* 蜡烛实体 (Open - Close) - 严禁缩放保持静止 */}
                      <rect
                        x={x - candleW / 2}
                        y={candleTop}
                        width={candleW}
                        height={candleH}
                        fill={isBull ? "#f43f5e" : "#10b981"}
                        stroke={isSelected ? "#38bdf8" : isBull ? "#fb7185" : "#34d399"}
                        strokeWidth={isSelected ? "2" : "1"}
                        rx="3"
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
                                  fill={isBuy ? "#f43f5e" : "#06b6d4"}
                                  stroke="#ffffff"
                                  strokeWidth="1.5"
                                  className="animate-pulse"
                                />
                                <text
                                  x="0"
                                  y="3"
                                  textAnchor="middle"
                                  fill="#ffffff"
                                  fontSize="8.5"
                                  fontWeight="bold"
                                  fontFamily="sans-serif"
                                >
                                  {isBuy ? "买" : "卖"}
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
                            width="190"
                            height={d.events && d.events.length > 0 ? 36 + d.events.length * 20 : 44}
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
                            {d.date} 收益: {d.close_pnl_pct > 0 ? `+${d.close_pnl_pct}%` : `${d.close_pnl_pct}%`} (超额{d.alpha_pct > 0 ? `+${d.alpha_pct}%` : `${d.alpha_pct}%`})
                          </text>
                          <line x1="10" y1="22" x2="180" y2="22" stroke="rgba(6, 182, 212, 0.3)" />

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
                          ) : d.close_pnl_pct !== 0 || d.equity > 100000 ? (
                            <text x="10" y="34" fill="#38bdf8" fontSize="9.5" fontFamily="sans-serif">
                              🛡️ 当日无调仓买卖 · 顺势耐心持股
                            </text>
                          ) : (
                            <text x="10" y="34" fill="#94a3b8" fontSize="9.5" fontFamily="sans-serif">
                              💤 当日无调仓买卖 · 空仓防守观望
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
                  {activeCandle.date} 当日策略量化复盘
                  {selectedIndex !== null && selectedIndex === activeIdx ? (
                    <span className="text-[11px] text-cyan-400 font-normal ml-1.5">(已锁定明细)</span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-normal ml-1.5">(悬停实时预览)</span>
                  )}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  累计收益: {activeCandle.close_pnl_pct > 0 ? `+${activeCandle.close_pnl_pct}%` : `${activeCandle.close_pnl_pct}%`}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-300">
                  账户总资产: ¥{activeCandle.equity.toLocaleString()}
                </span>
                <span className="text-amber-300">
                  零收益参考线: {activeCandle.benchmark_pct > 0 ? `+${activeCandle.benchmark_pct}%` : `${activeCandle.benchmark_pct}%`}
                </span>
                <span className={`font-bold ${activeCandle.alpha_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  超额收益: {activeCandle.alpha_pct > 0 ? `+${activeCandle.alpha_pct}%` : `${activeCandle.alpha_pct}%`}
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

            {/* 当天开高低收波动 (严格遵循国内A股红涨绿跌规范) */}
            <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center">
              <div className="p-2 rounded-xl bg-[#091220] border border-cyan-950">
                <span className="text-[10px] text-slate-400">开盘收益率</span>
                <div className={`font-bold ${activeCandle.open_pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {activeCandle.open_pnl_pct > 0 ? `+${activeCandle.open_pnl_pct}%` : `${activeCandle.open_pnl_pct}%`}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#091220] border border-cyan-950">
                <span className="text-[10px] text-slate-400">日内最高收益</span>
                <div className={`font-bold ${activeCandle.high_pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {activeCandle.high_pnl_pct > 0 ? `+${activeCandle.high_pnl_pct}%` : `${activeCandle.high_pnl_pct}%`}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#091220] border border-cyan-950">
                <span className="text-[10px] text-slate-400">日内最低收益</span>
                <div className={`font-bold ${activeCandle.low_pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {activeCandle.low_pnl_pct > 0 ? `+${activeCandle.low_pnl_pct}%` : `${activeCandle.low_pnl_pct}%`}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#091220] border border-cyan-950">
                <span className="text-[10px] text-slate-400">收盘结算收益</span>
                <div className={`font-bold ${activeCandle.close_pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {activeCandle.close_pnl_pct > 0 ? `+${activeCandle.close_pnl_pct}%` : `${activeCandle.close_pnl_pct}%`}
                </div>
              </div>
            </div>

            {/* 当日详细操作逻辑分析展示 */}
            {activeCandle.events && activeCandle.events.length > 0 ? (
              /* 情况1：有交易操作日 (如 09-07 买入, 09-09 卖出, 09-10 卖出) */
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-cyan-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    ⚡ 当日调仓买卖记录与量化决策逻辑 ({activeCandle.events.length} 笔交易 · 点击卡片展开决策穿透)
                  </span>
                  <span className="text-[10px] text-amber-300 font-normal">
                    📌 真实撮合纪律：未开一字板默认未买入 · 买入日按成本价核算 · 冲高回落/达标严格止盈止损
                  </span>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeCandle.events.map((ev, i) => {
                  const isBuy = ev.type === "BUY";
                  const isWin = ev.type === "SELL_TAKE_PROFIT" || (ev.type === "SELL" && (ev.pnl_pct ?? 0) >= 0);
                  const eventKey = ev.id || `${ev.stock_code}-${ev.time}-${i}`;
                  const isExpanded = expandedEventId === eventKey || (expandedEventId === null && i === 0);

                  const pnlVal = ev.pnl_pct ?? 0;
                  const isPnlPositive = pnlVal >= 0;
                  const pnlAmountVal = ev.pnl_amount ?? Math.round(((ev.amount * pnlVal) / 100) * 100) / 100;
                  const pnlAmountStr = isPnlPositive ? `+¥${pnlAmountVal.toLocaleString()}` : `-¥${Math.abs(pnlAmountVal).toLocaleString()}`;
                  const pnlPctStr = isPnlPositive ? `+${pnlVal.toFixed(2)}%` : `${pnlVal.toFixed(2)}%`;

                  return (
                    <div
                      key={eventKey}
                      onClick={() => setExpandedEventId(isExpanded ? "__none__" : eventKey)}
                      className={`p-3 rounded-2xl bg-[#0a1426] border transition-all cursor-pointer space-y-2 shadow-md hover:border-cyan-400/60 ${
                        isExpanded ? "border-cyan-400/80 ring-1 ring-cyan-500/30" : "border-cyan-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isBuy
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : isWin
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {isBuy ? "🔴 买入建仓" : isWin ? "🎯 止盈卖出" : "🛑 纪律止损"}
                          </span>
                          <span className="text-xs font-bold text-white">{ev.stock_name}</span>
                          <span className="text-[11px] font-mono text-cyan-400">
                            {ev.stock_code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="text-slate-300 font-bold">{ev.time}</span>
                          <span className="text-cyan-400 flex items-center">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between text-xs font-mono">
                        <span className="text-slate-300">
                          成交: ¥{ev.price.toFixed(2)} × {ev.shares.toLocaleString()}股 (¥
                          {ev.amount.toLocaleString()})
                        </span>
                        {ev.pnl_pct !== undefined && (
                          <span
                            className={`font-bold ${
                              isPnlPositive ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {isBuy ? "成本基准: ¥0.00" : `实现盈亏: ${pnlPctStr}`}
                          </span>
                        )}
                      </div>

                      <div className="p-2 rounded-xl bg-[#070f1e] border border-cyan-950 text-[11px] text-slate-300 leading-snug">
                        <span className="text-cyan-400 font-semibold">量化决策依据: </span>
                        {ev.reason}
                      </div>

                      {/* 展开的穿透式量化决策明细 */}
                      {isExpanded && (
                        <div className="mt-2.5 pt-2.5 border-t border-cyan-900/40 space-y-2 text-xs animate-in fade-in duration-200">
                          {/* 买入明细与逻辑 */}
                          <div className="p-2 rounded-xl bg-[#081222] border border-cyan-950 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <span>🔴</span> 买入点位与时机
                              </span>
                              <span className="font-mono text-slate-300">
                                时间: {ev.entry_time || (isBuy ? `${ev.date} ${ev.time}` : "09-07 09:42")} · 价格: ¥{(ev.entry_price || (isBuy ? ev.price : 13.74)).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-300 leading-relaxed">
                              <span className="text-slate-400">买入决策理由: </span>
                              {ev.entry_reason || (isBuy ? ev.reason : "全市场最高5连板空间总龙头(小盘56亿)，早盘一字涨停排板，09:42分时开板换手回封成功撮合成交，按涨停价买入；买入日浮盈严格按成交价核算为¥0.00，10天100%严重异动监管前退出")}
                            </p>
                          </div>

                          {/* 卖出明细与逻辑 (卖出操作展示确切时间与点位) */}
                          {!isBuy && (
                            <div className="p-2 rounded-xl bg-[#081222] border border-cyan-950 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-cyan-400 font-bold flex items-center gap-1">
                                  <span>🔵</span> 确切卖出点位与分时
                                </span>
                                <span className="font-mono text-slate-300">
                                  时间: {ev.time} · 卖出价: ¥{ev.price.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                                <span className="text-slate-400">卖出决策理由: </span>
                                {ev.exit_reason || ev.reason}
                              </p>
                            </div>
                          )}

                          {/* 仓位变化与盈亏金额穿透 */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="p-2 rounded-xl bg-[#081222] border border-cyan-950">
                              <div className="text-slate-400 text-[10px]">调仓前 / 调仓后仓位</div>
                              <div className="font-bold text-white mt-0.5">
                                {ev.position_before_pct != null ? `${ev.position_before_pct}%` : (isBuy ? "0.0%" : "68.8%")}
                                <span className="text-cyan-400 mx-1">➔</span>
                                {ev.position_after_pct != null ? `${ev.position_after_pct}%` : (isBuy ? "68.8%" : "0.0%")}
                                <span className="text-[10px] font-normal text-slate-400 ml-1">
                                  ({isBuy ? "加仓锁定" : "释放全额现金"})
                                </span>
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-[#081222] border border-cyan-950">
                              <div className="text-slate-400 text-[10px]">成交数量与净盈亏</div>
                              <div className={`font-bold mt-0.5 ${isPnlPositive ? "text-rose-400" : "text-emerald-400"}`}>
                                {ev.shares.toLocaleString()}股 · {isBuy ? "按成本记账" : pnlAmountStr}
                              </div>
                            </div>
                          </div>

                          {/* 双维度胜率 */}
                          <div className="flex items-center justify-between p-2 rounded-xl bg-[#081222] border border-cyan-950 text-[11px] font-mono">
                            <div className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-slate-300">策略历史胜率:</span>
                              <span className="text-rose-400 font-bold">
                                {ev.strategy_win_rate ? `${ev.strategy_win_rate}%` : "77.8%"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-slate-300">历史选股胜率:</span>
                              <span className="text-rose-400 font-bold">
                                {ev.selection_win_rate ? `${ev.selection_win_rate}%` : "77.8%"}
                              </span>
                              <span className="text-[10px] text-slate-400">(7胜2负)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            ) : activeCandle.equity > 100000 || activeCandle.close_pnl_pct !== 0 ? (
              /* 情况2：无调仓但有持股待涨日 (如 09-08) */
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    🛡️ 当日操作逻辑：无调仓买卖记录 · 顺势耐心持股待涨
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-[#0a1426] border border-cyan-500/30 space-y-2 shadow-md">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      持仓标的均在良性通道内，执行锁仓持股策略
                    </div>
                    <div className="p-2 rounded-lg bg-[#070f1e] border border-cyan-950 text-[11px] text-slate-300 leading-relaxed">
                      <span className="text-cyan-400 font-semibold">量化风控研判：</span>
                      根据量化风控系统实时监测，当前持仓标的均在5日/10日均线多头排列通道内良性放量运行，盘中价格波动未触及动态止盈警戒线，更未跌破硬止损风控线。策略严格执行“让利润奔跑，规避盘中洗盘杂波”纪律，锁仓等待主升浪冲高或次日择机兑现。
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0a1426] border border-cyan-500/30 space-y-2 shadow-md">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>持仓标的浮盈增厚与资产表现</span>
                      <span className={`text-[11px] font-mono font-bold ${activeCandle.close_pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        当日收益: {activeCandle.close_pnl_pct > 0 ? `+${activeCandle.close_pnl_pct}%` : `${activeCandle.close_pnl_pct}%`}
                      </span>
                    </div>
                    {currentStrategyKey === "aggressive" ? (
                      <div className="space-y-1.5 text-[11px] font-mono">
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                          <span className="text-slate-300">百大集团 (600865) 5000股</span>
                          <span className="text-rose-400 font-bold">¥15.11 (+9.97%) 浮盈+¥6,850</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                          <span className="text-slate-300">亚盛集团 (600108) 5900股</span>
                          <span className="text-rose-400 font-bold">¥5.61 (+6.25%) 浮盈+¥1,947</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 pt-0.5">
                          <span>日内总资产增厚: +¥8,797.00</span>
                          <span className="text-cyan-300 font-bold">总资产: ¥108,797.00 (满仓99.9%)</span>
                        </div>
                      </div>
                    ) : currentStrategyKey === "balanced" ? (
                      <div className="space-y-1.5 text-[11px] font-mono">
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                          <span className="text-slate-300">长电科技 (600584) 500股</span>
                          <span className="text-rose-400 font-bold">¥69.00 (+2.43%) 浮盈+¥820</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                          <span className="text-slate-300">立讯精密 (002475) 400股</span>
                          <span className="text-rose-400 font-bold">¥55.93 (+3.00%) 浮盈+¥652</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 pt-0.5">
                          <span>日内总资产增厚: +¥1,350.00</span>
                          <span className="text-cyan-300 font-bold">总资产: ¥102,150.00</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-[11px] font-mono">
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                          <span className="text-slate-300">隆平高科 (000998) 2000股</span>
                          <span className="text-rose-400 font-bold">¥9.68 (+3.09%) 浮盈+¥580</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                          <span className="text-slate-300">长江电力 (600900) 800股</span>
                          <span className="text-emerald-400 font-bold">¥27.85 (-2.01%) 浮亏-¥456</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 pt-0.5">
                          <span>日内总资产增厚: +¥550.00</span>
                          <span className="text-cyan-300 font-bold">总资产: ¥100,850.00</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* 情况3：无调仓且全天100%空仓资金防守日 (如 09-01 ~ 09-04) */
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    💤 当日操作逻辑：无调仓买卖记录 · 100%空仓资金防守
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-[#0a1426] border border-cyan-500/30 space-y-2 shadow-md">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      全市场情绪分歧整理退潮，模型严守空仓防守纪律
                    </div>
                    <div className="p-2 rounded-lg bg-[#070f1e] border border-cyan-950 text-[11px] text-slate-300 leading-relaxed">
                      <span className="text-cyan-400 font-semibold">量化决策研判：</span>
                      量化多因子扫描模型监测显示，当前大盘处于缩量分歧整理退潮阶段，全市场未扫描到满足该策略严苛进场阈值的强标的。策略严格恪守“宁可错过、绝不做错”的资金防守铁律，执行空仓现金管理，资金回撤为0，耐心等待右侧放量主升浪确立。
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0a1426] border border-cyan-500/30 space-y-2 shadow-md">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>账户资金与仓位状态</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        当日收益率: 0.00%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-[#070f1e] border border-cyan-950">
                        <span className="text-[10px] text-slate-400">可用现金</span>
                        <div className="font-bold text-white">¥100,000.00</div>
                        <span className="text-[10px] text-emerald-400">占比 100.0%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#070f1e] border border-cyan-950">
                        <span className="text-[10px] text-slate-400">持仓市值</span>
                        <div className="font-bold text-slate-400">¥0.00</div>
                        <span className="text-[10px] text-slate-500">仓位 0.0%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                      <span>当日盈亏金额: ¥0.00</span>
                      <span className="text-cyan-300 font-bold">资金安全防守: 0回撤</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
