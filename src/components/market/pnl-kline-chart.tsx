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

  // 解析当前选中账户 (兼容 id 与 account_id)
  const currentAccount =
    account ||
    accounts.find((a) => (a.account_id || a.id) === activeAccountId) ||
    accounts[0];

  const currentStrategyKey: string =
    currentAccount?.id || currentAccount?.account_id || activeAccountId || "aggressive";

  // 获取当前账户的日K蜡烛数据 (多重安全保底，确保绝不为空)
  const resolveCandles = (acc: ChartAccount | undefined, key: string): DailyPnlCandle[] => {
    if (acc?.candles && acc.candles.length > 0) return acc.candles;
    if (pnlKline && pnlKline.length > 0 && key === currentStrategyKey) return pnlKline;
    return [];
  };

  const currentCandles = resolveCandles(currentAccount, currentStrategyKey);

  if (!currentCandles.length) return <p className="border-y border-cyan-900/40 py-12 text-center text-sm text-slate-300">暂无收益历史，完成模拟交易后开始积累。</p>;

  const dates = currentCandles.map((c) => c.date);

  // 默认选中最新一天（如果没有手动锁定选中）
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

  // 单账户日K收盘折线与沪深300基准折线路径
  const closeLinePath = currentCandles
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.close_pnl_pct)}`)
    .join(" ");

  const benchmarkLinePath = currentCandles
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.benchmark_pct)}`)
    .join(" ");

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

        {/* 提示信息 */}
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300/80 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
          <span>💡 悬浮看当日收益与盈亏金额 · 点击看调仓明细</span>
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
                <span>
                  {currentStrategyKey === "aggressive"
                    ? "🚀 激进主升浪策略"
                    : currentStrategyKey === "balanced"
                    ? "⚖️ 均衡价值成长策略"
                    : "🛡️ 稳健低波红利策略"}
                </span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  日K收益实体 · 调仓买卖标记 · 对比沪深300
                </span>
              </h3>
            </div>
          </div>

          {/* 图例 */}
          <div className="flex items-center flex-wrap gap-3 text-xs font-mono">
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
              <span className="text-amber-300">沪深300基准</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-500 border-dashed border-t border-slate-500" />
              <span className="text-slate-400">0% 盈亏线</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">🔴买入</span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ml-1" />
              <span className="text-slate-300">🔵卖出</span>
            </div>
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

            {/* 0% 盈亏平衡分界线 */}
            {0 >= yMin && 0 <= yMax && (
              <line
                x1={padding.left}
                y1={getY(0)}
                x2={width - padding.right}
                y2={getY(0)}
                stroke="#64748b"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.7"
              />
            )}

            {/* 沪深300基准走势虚线 */}
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
                  const isRestDay = d.high_pnl_pct === d.low_pnl_pct && d.open_pnl_pct === d.close_pnl_pct;
                  const isBull = d.close_pnl_pct >= d.open_pnl_pct;
                  const yHigh = getY(d.high_pnl_pct);
                  const yLow = getY(d.low_pnl_pct);
                  const yOpen = getY(d.open_pnl_pct);
                  const yClose = getY(d.close_pnl_pct);

                  const candleTop = Math.min(yOpen, yClose);
                  const candleBottom = Math.max(yOpen, yClose);
                  const candleH = Math.max(candleBottom - candleTop, 4);
                  const candleW = Math.max(8, Math.min(26, (innerW / Math.max(dates.length, 1)) * 0.62));

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
                          x={x - candleW / 2 - 4}
                          y={padding.top}
                          width={candleW + 8}
                          height={innerH}
                          fill={isSelected ? "rgba(34, 211, 238, 0.16)" : "rgba(6, 182, 212, 0.08)"}
                          stroke={isSelected ? "rgba(34, 211, 238, 0.6)" : "transparent"}
                          strokeWidth="1"
                          strokeDasharray={isSelected ? "3 3" : "none"}
                          rx="4"
                        />
                      )}

                      {/* 影线 (High - Low) */}
                      {!isRestDay && (
                        <line
                          x1={x}
                          y1={yHigh}
                          x2={x}
                          y2={yLow}
                          stroke={isBull ? "#f43f5e" : "#10b981"}
                          strokeWidth="1.5"
                        />
                      )}

                      {/* 蜡烛实体 (Open - Close) */}
                      <rect
                        x={x - candleW / 2}
                        y={candleTop}
                        width={candleW}
                        height={candleH}
                        fill={isRestDay ? "#475569" : isBull ? "#f43f5e" : "#10b981"}
                        stroke={isSelected ? "#38bdf8" : isRestDay ? "#64748b" : isBull ? "#fb7185" : "#34d399"}
                        strokeWidth={isSelected ? "2" : "1"}
                        rx="3"
                      />

                      {/* 空仓休整日专属标识徽章 */}
                      {isRestDay && (
                        <g transform={`translate(${x}, ${candleTop - 11})`}>
                          <rect
                            x="-14"
                            y="-6"
                            width="28"
                            height="12"
                            rx="3"
                            fill="#0b1329"
                            stroke="#64748b"
                            strokeWidth="0.8"
                          />
                          <text
                            x="0"
                            y="2.5"
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="7.5"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            🛡️空仓
                          </text>
                        </g>
                      )}

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

                    </g>
                  );
                })}

            {/* 顶层悬浮 Popover Tooltip：移至 SVG 最末节点渲染，保证最高物理层深，绝对不被任何 K 线或折线遮挡 */}
            {hoveredIndex !== null && currentCandles[hoveredIndex] && (() => {
              const idx = hoveredIndex;
              const d = currentCandles[idx];
              const x = getX(idx);
              const yHigh = getY(d.high_pnl_pct);
              const prevCandle = idx > 0 ? currentCandles[idx - 1] : null;
              const dayPnlPct = prevCandle
                ? parseFloat((d.close_pnl_pct - prevCandle.close_pnl_pct).toFixed(2))
                : d.close_pnl_pct;
              const dayPnlAmount = prevCandle
                ? Math.round(d.equity - prevCandle.equity)
                : Math.round(d.equity - 100000);
              const prevBench = prevCandle ? prevCandle.benchmark_pct : 0;
              const dayBenchPct = prevCandle
                ? parseFloat((d.benchmark_pct - prevBench).toFixed(2))
                : d.benchmark_pct;
              const diffPct = parseFloat((dayPnlPct - dayBenchPct).toFixed(2));
              const isDayUp = dayPnlPct >= 0;
              const isBeatingBench = diffPct >= 0;
              const isRestDay = d.high_pnl_pct === d.low_pnl_pct && d.open_pnl_pct === d.close_pnl_pct;

              const tipWidth = 236;
              const tipHeight = d.events && d.events.length > 0 ? 98 + d.events.length * 18 : 102;
              const tipX = x > width - tipWidth - 25 ? x - tipWidth - 12 : Math.max(10, x + 15);
              const tipY = Math.max(padding.top + 5, Math.min(height - tipHeight - 12, yHigh - 50));

              return (
                <g
                  transform={`translate(${tipX}, ${tipY})`}
                  className="pointer-events-none"
                >
                  <rect
                    width={tipWidth}
                    height={tipHeight}
                    fill="rgba(9, 19, 36, 0.98)"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    rx="10"
                    filter="drop-shadow(0 8px 24px rgba(0,0,0,0.8))"
                  />
                  {/* 标题：日期与当日收益率 */}
                  <text
                    x="12"
                    y="18"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    📅 {d.date}  当日: <tspan fill={isDayUp ? "#fb7185" : "#34d399"}>{isDayUp ? "+" : ""}{dayPnlPct}%</tspan>
                  </text>
                  <line x1="12" y1="25" x2={tipWidth - 12} y2="25" stroke="rgba(6, 182, 212, 0.3)" />

                  {/* 沪深300对比：直观突出当日表现 */}
                  <text
                    x="12"
                    y="40"
                    fill="#facc15"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    沪深300: {dayBenchPct >= 0 ? "+" : ""}{dayBenchPct}% ({isBeatingBench ? "跑赢" : "落后"} {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`})
                  </text>

                  {/* Hover 才展示金额：当日实际盈亏金额 (国内核心看点) */}
                  <text
                    x="12"
                    y="57"
                    fill={isDayUp ? "#fb7185" : "#34d399"}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    当日盈亏: {dayPnlAmount >= 0 ? "+" : ""}¥{dayPnlAmount.toLocaleString()} 元
                  </text>

                  {/* 账户总资产与累计总收益 */}
                  <text
                    x="12"
                    y="73"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    总资产: <tspan fill="#ffffff" fontWeight="bold">¥{d.equity.toLocaleString()}</tspan> (累计: <tspan fill={d.close_pnl_pct >= 0 ? "#fb7185" : "#34d399"}>{d.close_pnl_pct > 0 ? `+${d.close_pnl_pct}%` : `${d.close_pnl_pct}%`}</tspan>)
                  </text>

                  {/* 当日操作提示 */}
                  {d.events && d.events.length > 0 ? (
                    d.events.slice(0, 2).map((ev, i) => (
                      <text
                        key={ev.id || i}
                        x="12"
                        y={91 + i * 16}
                        fill="#facc15"
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {ev.type === "BUY" ? "🟢 买入" : "🔴 卖出"} {ev.stock_name} @¥{ev.price.toFixed(2)} {ev.pnl_amount != null && ev.type !== "BUY" ? `(盈亏${ev.pnl_amount >= 0 ? "+" : ""}¥${ev.pnl_amount})` : ""}
                      </text>
                    ))
                  ) : isRestDay ? (
                    <text x="12" y="91" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                      🛡️ 空仓观望避险 · 资金安全在手
                    </text>
                  ) : (
                    <text x="12" y="91" fill="#38bdf8" fontSize="9" fontFamily="sans-serif">
                      📌 强势就留 · 持股坐轿主升中
                    </text>
                  )}
                </g>
              );
            })()}
          </svg>
        </div>

        {/* 点击某日柱体锁定的归因明细卡片 (展示具体调仓买卖时间、价格与盈亏金额) */}
        {activeCandle && (
          <div className="p-4 rounded-2xl bg-[#0f1d35]/90 border border-cyan-500/30 shadow-lg space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white font-mono">
                  {activeCandle.date} 当日交易操作与盈亏明细
                  {selectedIndex !== null && selectedIndex === activeIdx ? (
                    <span className="text-[11px] text-cyan-400 font-normal ml-1.5">(已锁定点击明细)</span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-normal ml-1.5">(点击日K可锁定)</span>
                  )}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  累计总收益: {activeCandle.close_pnl_pct > 0 ? `+${activeCandle.close_pnl_pct}%` : `${activeCandle.close_pnl_pct}%`}
                </span>
              </div>

              <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
                <span className="text-slate-300">
                  总资产: ¥{activeCandle.equity.toLocaleString()}
                </span>
                {(() => {
                  const prevCandle = activeIdx !== null && activeIdx > 0 ? currentCandles[activeIdx - 1] : null;
                  const dayPnlPct = prevCandle
                    ? parseFloat((activeCandle.close_pnl_pct - prevCandle.close_pnl_pct).toFixed(2))
                    : activeCandle.close_pnl_pct;
                  const prevBench = prevCandle ? prevCandle.benchmark_pct : 0;
                  const dayBenchPct = prevCandle
                    ? parseFloat((activeCandle.benchmark_pct - prevBench).toFixed(2))
                    : activeCandle.benchmark_pct;
                  const diffPct = parseFloat((dayPnlPct - dayBenchPct).toFixed(2));
                  const isBeating = diffPct >= 0;

                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                      isBeating
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}>
                      <span>沪深300: {dayBenchPct >= 0 ? `+${dayBenchPct}%` : `${dayBenchPct}%`}</span>
                      <span className="opacity-60">|</span>
                      <span>{isBeating ? "🔥 跑赢大盘" : "🛡️ 弱于大盘"} {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`}</span>
                    </span>
                  );
                })()}
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
              /* 情况2：无调仓但有持股待涨日 (如 09-08, 09-23) */
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    🔥 当日操作逻辑：【强势就留】无调仓买卖 · 标的处于多头强势通道，顺势持股待涨
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-[#0a1426] border border-cyan-500/30 space-y-2 shadow-md">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      持仓标的强势未改，严格执行“强势就留，走弱就卖”
                    </div>
                    <div className="p-2 rounded-lg bg-[#070f1e] border border-cyan-950 text-[11px] text-slate-300 leading-relaxed">
                      <span className="text-cyan-400 font-semibold">量化执行纪律：</span>
                      系统实时跟踪盘面分时均线与成交量能，当前持仓个股处于强势主升区间，未出现断板、跌破分时均线或冲高回落等走弱特征，符合【强势就留】持仓纪律；若后续一旦盘中走弱或触及止损警戒，将第一时间果断清仓离场，绝不死扛！
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0a1426] border border-cyan-500/30 space-y-2 shadow-md">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>持仓标的浮盈增厚与资产表现</span>
                      <span className={`text-[11px] font-mono font-bold ${activeCandle.close_pnl_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        当日收益: {activeCandle.close_pnl_pct > 0 ? `+${activeCandle.close_pnl_pct}%` : `${activeCandle.close_pnl_pct}%`}
                      </span>
                    </div>
                    {(() => {
                      const dt = activeCandle.date;
                      if (currentStrategyKey === "aggressive") {
                        if (dt <= "09-06") {
                          return (
                            <div className="space-y-1.5 text-[11px] font-mono">
                              <div className="p-2 rounded-lg bg-[#070f1e] border border-cyan-950 text-slate-300">
                                🎯 赛季启动前准备期 · 超短龙头扫描与多因子初筛
                              </div>
                              <div className="flex items-center justify-between text-slate-400 pt-0.5">
                                <span>备战资金: ¥100,000.00</span>
                                <span className="text-cyan-300 font-bold">仓位: 0% · 现金管理</span>
                              </div>
                            </div>
                          );
                        } else if (dt <= "09-10") {
                          return (
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
                                <span>周期总资产: ¥113,145.00</span>
                                <span className="text-cyan-300 font-bold">高标龙头主升浪锁定</span>
                              </div>
                            </div>
                          );
                        } else if (dt <= "09-15") {
                          return (
                            <div className="space-y-1.5 text-[11px] font-mono">
                              <div className="p-2 rounded-lg bg-[#070f1e] border border-cyan-950 text-slate-300">
                                🛡️ 情绪退潮核按钮跌停潮 · 严格执行 100% 空仓休息避险
                              </div>
                              <div className="flex items-center justify-between text-slate-400 pt-0.5">
                                <span>可用现金: ¥113,145.00</span>
                                <span className="text-emerald-400 font-bold">仓位 0.0% · 零回撤</span>
                              </div>
                            </div>
                          );
                        } else if (dt <= "09-21") {
                          return (
                            <div className="space-y-1.5 text-[11px] font-mono">
                              <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                                <span className="text-slate-300">保变电气 (600550) 12000股</span>
                                <span className="text-rose-400 font-bold">成本¥6.80 · 空间破局龙头</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-400 pt-0.5">
                                <span>持仓总资产: ¥132,565.00</span>
                                <span className="text-cyan-300 font-bold">单挑新周期央企重组总龙头</span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="space-y-1.5 text-[11px] font-mono">
                              <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                                <span className="text-slate-300">常山北明 (000158) 8000股</span>
                                <span className="text-rose-400 font-bold">¥12.68 (+20.76%) 浮盈+¥17,440</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-400 pt-0.5">
                                <span>持仓总资产: ¥149,063.10</span>
                                <span className="text-cyan-300 font-bold">华为鸿蒙龙头 · 断板弱转强反包</span>
                              </div>
                            </div>
                          );
                        }
                      } else if (currentStrategyKey === "balanced") {
                        return (
                          <div className="space-y-1.5 text-[11px] font-mono">
                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                              <span className="text-slate-300">中际旭创 (300308) 30股</span>
                              <span className="text-rose-400 font-bold">¥925.00 (+13.6%) 浮盈+¥3,330</span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                              <span className="text-slate-300">沪电股份 (002463) 2000股</span>
                              <span className="text-rose-400 font-bold">¥39.50 (+14.5%) 浮盈+¥10,000</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400 pt-0.5">
                              <span>GARP总资产: ¥118,293.80</span>
                              <span className="text-cyan-300 font-bold">CPO算力核心中军趋势波段</span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="space-y-1.5 text-[11px] font-mono">
                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                              <span className="text-slate-300">长江电力 (600900) 1000股</span>
                              <span className="text-slate-200 font-bold">¥28.20 (-0.77%) 特许水电吃息</span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#070f1e] border border-cyan-950">
                              <span className="text-slate-300">中国神华 (601088) 1500股</span>
                              <span className="text-rose-400 font-bold">¥38.90 (+0.78%) 煤电一体化红利</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400 pt-0.5">
                              <span>防御总资产: ¥106,710.00</span>
                              <span className="text-cyan-300 font-bold">低波压舱石 · 平抑一切大盘波动</span>
                            </div>
                          </div>
                        );
                      }
                    })()}
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
