"use client";

import { useState } from "react";
import {
  TrendingUp,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Target,
  Clock,
  Sparkles,
  Info,
  ShieldAlert,
  Ban,
  Sliders,
} from "lucide-react";
import { DailyPnlCandle, PaperAccount, TradeEvent } from "@/lib/recommendations-db";

interface PnlKlineChartProps {
  account?: PaperAccount;
  pnlKline?: DailyPnlCandle[];
  events?: TradeEvent[];
}

export function PnlKlineChart({ account, pnlKline = [], events = [] }: PnlKlineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 默认选最新一天
  const activeCandle =
    hoveredIndex !== null && pnlKline[hoveredIndex]
      ? pnlKline[hoveredIndex]
      : pnlKline.length > 0
      ? pnlKline[pnlKline.length - 1]
      : null;

  // SVG 画布尺寸与坐标映射
  const width = 860;
  const height = 300;
  const padding = { top: 35, right: 40, bottom: 45, left: 55 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // 计算 Y 轴极值 (百分比)，确保 0 刻度线居中合理显示
  const allHighs = pnlKline.map((d) => d.high_pnl_pct);
  const allLows = pnlKline.map((d) => d.low_pnl_pct);
  const allBench = pnlKline.map((d) => d.benchmark_pct);

  const rawMax = Math.max(...allHighs, ...allBench, 7.5);
  const rawMin = Math.min(...allLows, ...allBench, -1.5);
  const yMax = Math.ceil(rawMax + 1.5);
  const yMin = Math.floor(rawMin - 0.8);

  const getY = (val: number) => {
    return padding.top + ((yMax - val) / (yMax - yMin)) * innerH;
  };

  const getX = (idx: number) => {
    if (pnlKline.length <= 1) return padding.left + innerW / 2;
    return padding.left + (idx / (pnlKline.length - 1)) * innerW;
  };

  // 生成 Y 轴刻度线 (5 档)
  const ySteps = 5;
  const yTicks: number[] = [];
  for (let i = 0; i <= ySteps; i++) {
    const val = yMin + ((yMax - yMin) / ySteps) * i;
    yTicks.push(Number(val.toFixed(1)));
  }

  // 策略净值收盘点折线路径 (高科技电光青)
  const closeLinePath = pnlKline
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.close_pnl_pct)}`)
    .join(" ");

  // 沪深300基准对比折线路径 (琥珀金虚线)
  const benchmarkLinePath = pnlKline
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.benchmark_pct)}`)
    .join(" ");

  return (
    <div className="space-y-4">
      {/* 1. 10万元模拟盘顶层实时资产 HUD 看板 (赛博极光黑曜石科技风) */}
      {account && (
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#0c1a30]/90 via-[#0a1324]/95 to-[#0e223d]/90 border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.12)] backdrop-blur-xl">
          {/* 背景粒子与流光光晕 */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            {/* 左侧：本金与总权益 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  <Award className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-white tracking-wide">
                  量化实盘推演 · 10 万元模拟盘账户
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                  2026-09-01 启动实盘
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                  ¥ {account.total_equity.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1 text-sm font-bold font-mono text-emerald-400">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  +{account.total_pnl_pct}% (+¥{account.total_pnl.toLocaleString()})
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300/80 font-mono">
                <span>初始本金: ¥{account.initial_capital.toLocaleString()}</span>
                <span>•</span>
                <span>可用现金: ¥{account.cash.toLocaleString()}</span>
                <span>•</span>
                <span>持仓市值: ¥{account.market_value.toLocaleString()}</span>
              </div>
            </div>

            {/* 右侧核心战绩指标 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[#0e192c]/80 border border-cyan-500/20 text-center">
                <div className="text-[10px] text-slate-400">策略实盘胜率</div>
                <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">
                  {account.win_rate}%
                </div>
                <div className="text-[9px] text-cyan-300/60 mt-0.5">2战2捷锁定</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0e192c]/80 border border-cyan-500/20 text-center">
                <div className="text-[10px] text-slate-400">盈亏比 (P/L)</div>
                <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                  {account.profit_loss_ratio} : 1
                </div>
                <div className="text-[9px] text-amber-300/60 mt-0.5">盈幅远超止损</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0e192c]/80 border border-cyan-500/20 text-center">
                <div className="text-[10px] text-slate-400">今日实时收益</div>
                <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                  +{account.today_pnl_pct}%
                </div>
                <div className="text-[9px] text-emerald-300/60 mt-0.5">+¥{account.today_pnl}</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0e192c]/80 border border-cyan-500/20 text-center">
                <div className="text-[10px] text-slate-400">最大动态回撤</div>
                <div className="text-xl font-black font-mono text-rose-400 mt-0.5">
                  {account.max_drawdown_pct}%
                </div>
                <div className="text-[9px] text-rose-400/60 mt-0.5">极窄回撤控制</div>
              </div>
            </div>
          </div>

          {/* 选股与风控铁律规则栏（明确提示：不买ST、不买科创） */}
          <div className="mt-4 pt-3.5 border-t border-cyan-900/50 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">当前总仓位:</span>
                <span className="font-mono font-bold text-white">{account.position_ratio_pct}%</span>
                <div className="w-32 h-2 rounded-full bg-slate-900/80 overflow-hidden border border-cyan-900/40">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700"
                    style={{ width: `${account.position_ratio_pct}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  5分钟自动轮询监控
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  达到止盈/止损自动出局
                </span>
              </div>
            </div>

            {/* 规则胶囊勋章 */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1">
                <Ban className="w-3 h-3 text-rose-400" />
                严禁买入 *ST / ST 股 (防范退市暴雷)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                严禁买入科创板 (剔除50万门槛与宽幅投机)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                精选主板与创业板大流动性核心中军
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                2026年9月1日建仓启动 (实盘可回溯)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. 收益率日 K 线走势与买卖事件主图 (PnL Candlestick Chart) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              模拟盘累计收益率日 K 线走势 (时间 vs 盈利，从9月1日启动)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              每日柱状蜡烛线展现日内开高低收收益率波动，打标 🟢B(买入) 与 🔴S(止盈/止损) 真实买卖事件点
            </p>
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-rose-500 border border-rose-400" />
              <span className="text-slate-300">策略收益日K (红阳/绿阴)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-b-2 border-dashed border-amber-400" />
              <span className="text-amber-300">沪深300基准</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-emerald-300">买入点</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span className="text-rose-300">卖出点</span>
            </div>
          </div>
        </div>

        {/* 交互式 SVG 图表 */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[700px] select-none"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y 轴横向刻度线与标签 */}
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
                    stroke={isZero ? "#06b6d4" : "#1e293b"}
                    strokeDasharray={isZero ? "4 4" : "2 3"}
                    strokeOpacity={isZero ? 0.8 : 0.6}
                    strokeWidth={isZero ? 1.2 : 0.8}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill={isZero ? "#22d3ee" : "#64748b"}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {tick > 0 ? `+${tick}%` : `${tick}%`}
                  </text>
                </g>
              );
            })}

            {/* 沪深300基准走势折线 (琥珀金虚线) */}
            <path
              d={benchmarkLinePath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.85"
            />

            {/* 策略累计收益率折线 (电光青流光) */}
            <path
              d={closeLinePath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 逐日 K 线蜡烛柱与交互热区 */}
            {pnlKline.map((d, idx) => {
              const x = getX(idx);
              const isUp = d.close_pnl_pct >= d.open_pnl_pct;
              const candleColor = isUp ? "#f43f5e" : "#10b981";
              const candleBorder = isUp ? "#fda4af" : "#6ee7b7";

              const yHigh = getY(d.high_pnl_pct);
              const yLow = getY(d.low_pnl_pct);
              const yOpen = getY(d.open_pnl_pct);
              const yClose = getY(d.close_pnl_pct);

              const candleTop = Math.min(yOpen, yClose);
              const candleBottom = Math.max(yOpen, yClose);
              const candleH = Math.max(candleBottom - candleTop, 3);
              const candleW = 22;

              const isHovered = hoveredIndex === idx;

              return (
                <g key={d.date} className="cursor-pointer">
                  {/* 背景悬浮柱阴影 */}
                  {isHovered && (
                    <rect
                      x={x - candleW - 8}
                      y={padding.top}
                      width={candleW * 2 + 16}
                      height={innerH}
                      fill="#06b6d4"
                      fillOpacity="0.1"
                      rx="6"
                    />
                  )}

                  {/* 影线 (High to Low) */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth={1.5}
                    strokeOpacity={0.9}
                  />

                  {/* 实体蜡烛柱 (Open to Close) */}
                  <rect
                    x={x - candleW / 2}
                    y={candleTop}
                    width={candleW}
                    height={candleH}
                    fill={isUp ? "#f43f5e" : "#059669"}
                    stroke={candleBorder}
                    strokeWidth={1.2}
                    rx="2"
                    fillOpacity={0.9}
                  />

                  {/* 沪深300对应点标记 */}
                  <circle
                    cx={x}
                    cy={getY(d.benchmark_pct)}
                    r="2.5"
                    fill="#fbbf24"
                    stroke="#0f172a"
                    strokeWidth="1"
                  />

                  {/* 交易事件打标 Pin (🟢B / 🔴S) */}
                  {d.events && d.events.length > 0 && (
                    <g>
                      {d.events.map((ev, evIdx) => {
                        const isBuy = ev.type === "BUY";
                        const pinY = isBuy ? yLow + 16 + evIdx * 16 : yHigh - 16 - evIdx * 16;
                        const pinColor = isBuy ? "#10b981" : "#f43f5e";
                        const pinBg = isBuy ? "#064e3b" : "#881337";

                        return (
                          <g key={ev.id} transform={`translate(${x}, ${pinY})`}>
                            {/* 发光外圈 */}
                            <circle
                              cx="0"
                              cy="0"
                              r="8"
                              fill={pinBg}
                              stroke={pinColor}
                              strokeWidth="1.5"
                              className={isHovered ? "animate-pulse" : ""}
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

                  {/* X 轴日期文字 */}
                  <text
                    x={x}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    fill={isHovered ? "#22d3ee" : "#94a3b8"}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isHovered ? "bold" : "normal"}
                  >
                    {d.date}
                  </text>

                  {/* 鼠标全区域交互热区 */}
                  <rect
                    x={x - candleW - 6}
                    y={padding.top}
                    width={candleW * 2 + 12}
                    height={innerH + 30}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* 3. 悬浮点 / 当日事件交互详情卡 */}
        {activeCandle && (
          <div className="p-4 rounded-2xl bg-[#0f1d35]/90 border border-cyan-500/30 shadow-lg space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white font-mono">
                  {activeCandle.date} 日内量化推演表现
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
            {activeCandle.events && activeCandle.events.length > 0 ? (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  当日买卖决策执行记录 ({activeCandle.events.length} 笔)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeCandle.events.map((ev) => {
                    const isBuy = ev.type === "BUY";
                    const isWin = ev.type === "SELL_TAKE_PROFIT";
                    return (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-[#0a1426] border border-cyan-500/20 space-y-1.5"
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
                              {ev.pnl_pct >= 0 ? `+${ev.pnl_pct}%` : `${ev.pnl_pct}%`} (
                              {ev.pnl_amount && ev.pnl_amount >= 0 ? `+¥${ev.pnl_amount}` : `¥${ev.pnl_amount}`}
                              )
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug">{ev.reason}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 flex items-center gap-1.5 py-1">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                当日持仓标的稳步持有与动态跟踪，未触发止盈或止损阈值。
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
