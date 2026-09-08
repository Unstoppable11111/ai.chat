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
  ChevronRight,
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

  // 默认显示选中的交易日或悬浮日，最后一天作为默认
  const activeIdx =
    selectedIndex !== null
      ? selectedIndex
      : hoveredIndex !== null
      ? hoveredIndex
      : pnlKline.length > 0
      ? pnlKline.length - 1
      : null;

  const activeCandle = activeIdx !== null && pnlKline[activeIdx] ? pnlKline[activeIdx] : null;

  // SVG 画布尺寸与坐标映射
  const width = 860;
  const height = 280;
  const padding = { top: 35, right: 40, bottom: 45, left: 55 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // 计算 Y 轴极值 (百分比)，确保刻度线居中合理显示
  const allHighs = pnlKline.map((d) => d.high_pnl_pct);
  const allLows = pnlKline.map((d) => d.low_pnl_pct);
  const allBench = pnlKline.map((d) => d.benchmark_pct);

  const rawMax = Math.max(...allHighs, ...allBench, 5.5);
  const rawMin = Math.min(...allLows, ...allBench, -1.0);
  const yMax = Math.ceil(rawMax + 1.2);
  const yMin = Math.floor(rawMin - 0.6);

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
      {/* 0. 三大风格模拟盘账户选择器 (各10万本金，昨天 2026-09-07 启动) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#091322]/90 border border-cyan-500/30 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2 px-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Sliders className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-bold text-white">模拟盘策略账户 (各10万):</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "aggressive" as AccountStyle, name: "🚀 短线激进型", desc: "高弹性主升浪" },
            { id: "balanced" as AccountStyle, name: "⚖️ 均衡配置型", desc: "主线中军+成长" },
            { id: "conservative" as AccountStyle, name: "🛡️ 稳健持仓型", desc: "低位农业+高股息" },
          ].map((tab) => {
            const isActive = (account?.account_id || activeAccountId) === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedIndex(null);
                  onSelectAccount?.(tab.id);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/50 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-cyan-950/40 border border-transparent"
                }`}
              >
                <span>{tab.name}</span>
                <span className="text-[10px] opacity-70">({tab.desc})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. 模拟盘顶层实时资产 HUD 看板 (突出展示今日盈亏与总盈亏对比) */}
      {account && (
        <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#0c1a30]/90 via-[#0a1324]/95 to-[#0e223d]/90 border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.12)] backdrop-blur-xl">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            {/* 左侧：总权益与核心盈亏对比 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  <Award className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-white tracking-wide">
                  {account.account_name} · 10 万元模拟实盘推演
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                  2026-09-07 启动 (昨天开始)
                </span>
              </div>

              {/* 总权益主数值 */}
              <div>
                <span className="text-[11px] text-slate-400">当前总权益 (本金+浮盈)</span>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                  ¥ {account.total_equity.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* 核心盈亏对比：总盈亏 vs 当天盈亏 */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-2.5 px-3.5 rounded-xl bg-[#071324] border border-cyan-500/30">
                  <div className="text-[10px] text-slate-400">累计总盈亏</div>
                  <div
                    className={`text-lg font-black font-mono mt-0.5 ${
                      account.total_pnl >= 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {account.total_pnl >= 0 ? "+" : ""}
                    {account.total_pnl_pct}% ({account.total_pnl >= 0 ? "+" : ""}¥
                    {account.total_pnl.toLocaleString()})
                  </div>
                </div>

                <div className="p-2.5 px-3.5 rounded-xl bg-[#071324] border border-cyan-500/30">
                  <div className="text-[10px] text-slate-400">今日实时盈亏</div>
                  <div
                    className={`text-lg font-black font-mono mt-0.5 ${
                      account.today_pnl >= 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {account.today_pnl >= 0 ? "+" : ""}
                    {account.today_pnl_pct}% ({account.today_pnl >= 0 ? "+" : ""}¥
                    {account.today_pnl.toLocaleString()})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300/80 font-mono pt-1">
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
                <div className="text-[9px] text-cyan-300/60 mt-0.5">多源校验核准</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0e192c]/80 border border-cyan-500/20 text-center">
                <div className="text-[10px] text-slate-400">盈亏比 (P/L)</div>
                <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                  {account.profit_loss_ratio} : 1
                </div>
                <div className="text-[9px] text-amber-300/60 mt-0.5">盈幅优于止损</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0e192c]/80 border border-cyan-500/20 text-center">
                <div className="text-[10px] text-slate-400">当前总仓位</div>
                <div className="text-xl font-black font-mono text-white mt-0.5">
                  {account.position_ratio_pct}%
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">纪律化仓控</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#0e192c]/80 border border-cyan-500/20 text-center">
                <div className="text-[10px] text-slate-400">最大动态回撤</div>
                <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                  {account.max_drawdown_pct}%
                </div>
                <div className="text-[9px] text-emerald-300/60 mt-0.5">窄幅回撤控制</div>
              </div>
            </div>
          </div>

          {/* 选股与风控铁律规则栏 */}
          <div className="mt-4 pt-3.5 border-t border-cyan-900/50 flex flex-wrap items-center gap-2 pt-1 text-xs">
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
              精选主板与创业板大流动性核心标的
            </span>
          </div>
        </div>
      )}

      {/* 2. 当前账户模拟持仓明细 */}
      {account?.holdings && account.holdings.length > 0 && (
        <div className="p-5 rounded-3xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-cyan-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              【{account.account_name}】当前模拟持仓明细 (真实行情核验)
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              持股数: {account.holdings.length} 只标的
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200 font-mono">
              <thead className="bg-[#091322]/90 text-cyan-300/80 font-semibold border-b border-cyan-500/30">
                <tr>
                  <th className="py-2.5 px-3.5 rounded-l-xl">标的代码/名称</th>
                  <th className="py-2.5 px-3.5 text-right">持股数</th>
                  <th className="py-2.5 px-3.5 text-right">建仓成本</th>
                  <th className="py-2.5 px-3.5 text-right">最新现价</th>
                  <th className="py-2.5 px-3.5 text-right">浮动盈亏</th>
                  <th className="py-2.5 px-3.5 text-right">止损 / 止盈</th>
                  <th className="py-2.5 px-3.5 text-center">系统指令</th>
                  <th className="py-2.5 px-3.5 rounded-r-xl">逻辑归因</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-900/30">
                {account.holdings.map((h) => {
                  const isProfit = h.pnl >= 0;
                  return (
                    <tr key={h.code} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3 px-3.5 font-sans font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">{h.code}</span>
                          <span className="text-white font-bold">{h.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-300">{h.shares} 股</td>
                      <td className="py-3 px-3.5 text-right text-slate-300">¥{h.cost_price.toFixed(2)}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-white">¥{h.current_price.toFixed(2)}</td>
                      <td className="py-3 px-3.5 text-right">
                        <span className={`font-bold ${isProfit ? "text-rose-400" : "text-emerald-400"}`}>
                          {isProfit ? "+" : ""}¥{h.pnl} ({isProfit ? "+" : ""}{h.pnl_pct}%)
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right text-[11px]">
                        <span className="text-amber-400">¥{h.stop_loss_price.toFixed(2)}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-rose-400">¥{h.target_price.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                          {h.action}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-[11px] text-slate-400 truncate max-w-xs font-sans">
                        {h.advice_reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. 收益率日 K 线走势与买卖事件主图 (PnL Candlestick Chart) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              【{account?.account_name || "模拟盘"}】收益率日 K 蜡烛走势 (从昨天 09-07 启动)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              鼠标悬浮柱体即时查看当日操作；点击柱体锁定并在底部查看操作原因
            </p>
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-rose-500 border border-rose-400" />
              <span className="text-slate-300">收益日K (红阳/绿阴)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-b-2 border-dashed border-amber-400" />
              <span className="text-amber-300">沪深300基准</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-emerald-300">买入点</span>
            </div>
          </div>
        </div>

        {/* 交互式 SVG 图表 */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[700px] select-none"
          >
            {/* 网格水平刻度线 */}
            {yTicks.map((val) => {
              const y = getY(val);
              const isZero = val === 0;
              return (
                <g key={`ytick-${val}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke={isZero ? "rgba(6, 182, 212, 0.45)" : "rgba(30, 41, 59, 0.55)"}
                    strokeWidth={isZero ? "1.5" : "1"}
                    strokeDasharray={isZero ? "4 4" : "none"}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill={isZero ? "#22d3ee" : "#64748b"}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {val > 0 ? `+${val}%` : `${val}%`}
                  </text>
                </g>
              );
            })}

            {/* 沪深300基准线 */}
            {pnlKline.length > 1 && (
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
            {pnlKline.length > 1 && (
              <path
                d={closeLinePath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                className="drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]"
              />
            )}

            {/* 绘制每日收益率日 K 蜡烛图与事件徽章 */}
            {pnlKline.map((d, idx) => {
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
                    stroke={isSelected ? "#38bdf8" : isHovered ? "#ffffff" : isBull ? "#fb7185" : "#34d399"}
                    strokeWidth={isSelected ? "2" : isHovered ? "1.5" : "1"}
                    rx="3"
                    className="transition-colors duration-150"
                  />

                  {/* 交易事件打标徽章 */}
                  {d.events && d.events.length > 0 && (
                    <g transform={`translate(${x}, ${yHigh - 16})`}>
                      {d.events.map((ev, eIdx) => {
                        const isBuy = ev.type === "BUY";
                        const offsetX = (eIdx - (d.events.length - 1) / 2) * 18;
                        return (
                          <g key={ev.id} transform={`translate(${offsetX}, 0)`}>
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

                  {/* X 轴日期文字 */}
                  <text
                    x={x}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    fill={isSelected ? "#38bdf8" : isHovered ? "#22d3ee" : "#94a3b8"}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isHovered || isSelected ? "bold" : "normal"}
                  >
                    {d.date} {isSelected ? "★" : ""}
                  </text>

                  {/* 鼠标全区域交互热区 */}
                  <rect
                    x={x - candleW - 6}
                    y={padding.top}
                    width={candleW * 2 + 12}
                    height={innerH + 30}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* 鼠标悬浮时即时浮动 Tooltip：展示当天的操作 */}
                  {isHovered && (
                    <g
                      transform={`translate(${
                        x > width - 190 ? x - 175 : x + 15
                      }, ${Math.max(padding.top + 5, yHigh - 35)})`}
                      className="pointer-events-none"
                    >
                      <rect
                        width="165"
                        height={d.events && d.events.length > 0 ? 32 + d.events.length * 20 : 38}
                        fill="rgba(9, 19, 36, 0.95)"
                        stroke="#22d3ee"
                        strokeWidth="1.2"
                        rx="8"
                        className="drop-shadow-2xl"
                      />
                      <text x="10" y="18" fill="#22d3ee" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        {d.date} 当日买卖操作:
                      </text>
                      {d.events && d.events.length > 0 ? (
                        d.events.map((ev, i) => (
                          <text
                            key={ev.id}
                            x="10"
                            y={35 + i * 18}
                            fill="#ffffff"
                            fontSize="9.5"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            {ev.type === "BUY" ? "🟢买入" : "🔴卖出"} {ev.stock_name} {ev.shares}股 @¥{ev.price.toFixed(2)}
                          </text>
                        ))
                      ) : (
                        <text x="10" y="32" fill="#94a3b8" fontSize="9.5" fontFamily="sans-serif">
                          当日无调仓买卖记录
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* 4. 点击某日柱体锁定的归因明细卡片（展示操作原因，无操作时不渲染冗余套话） */}
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

            {/* 当天触发的买卖事件（展示具体操作原因；若无操作则干净利落不渲染无意义套话） */}
            {activeCandle.events && activeCandle.events.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    当日买卖决策与核心操作原因 ({activeCandle.events.length} 笔)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeCandle.events.map((ev) => {
                    const isBuy = ev.type === "BUY";
                    const isWin = ev.type === "SELL_TAKE_PROFIT";
                    return (
                      <div
                        key={ev.id}
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
