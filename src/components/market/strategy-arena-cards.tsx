"use client";

import {
  Zap,
  Scale,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  AlertTriangle,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ArenaAccount, StrategyType, StrategyRankingItem } from "@/lib/quant-arena/types";

interface StrategyArenaCardsProps {
  accounts: Record<StrategyType, ArenaAccount>;
  rankings?: StrategyRankingItem[];
  activeStrategy: StrategyType;
  onSelectStrategy: (strat: StrategyType) => void;
}

export function StrategyArenaCards({
  accounts,
  rankings = [],
  activeStrategy,
  onSelectStrategy,
}: StrategyArenaCardsProps) {
  const cards: Array<{
    id: StrategyType;
    title: string;
    sub: string;
    icon: typeof Zap;
    themeColor: string;
    borderColor: string;
    activeBorder: string;
    glowColor: string;
  }> = [
    {
      id: "aggressive",
      title: "AGGRESSIVE",
      sub: "激进实验账户 · 手动记录",
      icon: Zap,
      themeColor: "text-amber-400",
      borderColor: "border-amber-500/30",
      activeBorder: "border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)]",
      glowColor: "from-amber-500/10 to-transparent",
    },
    {
      id: "balanced",
      title: "BALANCED",
      sub: "均衡实验账户 · 手动记录",
      icon: Scale,
      themeColor: "text-cyan-400",
      borderColor: "border-cyan-500/30",
      activeBorder: "border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)]",
      glowColor: "from-cyan-500/10 to-transparent",
    },
    {
      id: "conservative",
      title: "CONSERVATIVE",
      sub: "保守实验账户 · 手动记录",
      icon: ShieldCheck,
      themeColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      activeBorder: "border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.25)]",
      glowColor: "from-emerald-500/10 to-transparent",
    },
  ];

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  return (
    <div className="space-y-4">
      {/* 顶部标题区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Award className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-wider text-white font-mono uppercase">
              STRATEGY ARENA
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
              3 × 100K 虚拟实验室
            </span>
          </div>
          <p className="text-xs text-cyan-200/70 mt-0.5">
            三个独立模拟账户 · 初始资金各10万元 · 参考价手动录入，费用采用实验预设
          </p>
        </div>

        {/* 策略综合排名徽章 */}
        {rankings.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] font-mono bg-[#070e1a]/90 px-3 py-1.5 rounded-xl border border-cyan-500/30">
            <span className="text-slate-400">综合排名:</span>
            {rankings.map((r) => (
              <span
                key={r.strategy}
                className={`font-bold flex items-center gap-1 ${
                  r.rank === 1
                    ? "text-amber-400"
                    : r.rank === 2
                    ? "text-cyan-300"
                    : "text-slate-400"
                }`}
              >
                <span>#{r.rank}</span>
                <span className="uppercase text-[10px]">{r.strategy.slice(0, 3)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 三大账户横向卡片矩阵 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => {
          const acc = accounts[card.id];
          const isSelected = activeStrategy === card.id;
          const Icon = card.icon;

          if (!acc) return null;

          const isTotalUp = acc.total_return_pct >= 0;
          const isTodayUp = acc.today_pnl >= 0;

          return (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectStrategy(card.id); } }}
              onClick={() => onSelectStrategy(card.id)}
              className={`p-5 rounded-2xl bg-gradient-to-b ${
                card.glowColor
              } bg-[#091322]/90 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 ${
                isSelected ? card.activeBorder : `${card.borderColor} hover:border-cyan-500/50`
              }`}
            >
              {/* 顶部标签与策略版本 */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg bg-black/40 border border-white/10 ${card.themeColor}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs font-black text-white font-mono tracking-wide">{card.title}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[170px]">{card.sub}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-slate-300 border border-slate-700/50">
                      {acc.version}
                    </span>
                    {acc.is_protection_mode ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse font-bold">
                        PROTECTION
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {acc.risk_status}
                      </span>
                    )}
                  </div>
                </div>

                {/* 净资产与累计盈亏 */}
                <div className="mt-4 flex items-baseline justify-between border-b border-cyan-950/60 pb-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Net Asset Value</div>
                    <div className="text-2xl font-black text-white font-mono tracking-tight">
                      ¥ {formatMoney(acc.total_equity)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-black font-mono flex items-center justify-end gap-0.5 ${
                        isTotalUp ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isTotalUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span>{isTotalUp ? `+${acc.total_return_pct}%` : `${acc.total_return_pct}%`} Total</span>
                    </div>
                    <div className={`text-[10px] font-mono ${isTodayUp ? "text-rose-400/80" : "text-emerald-400/80"}`}>
                      {isTodayUp ? "+" : ""}
                      {formatMoney(acc.today_pnl)} ({isTodayUp ? "+" : ""}
                      {acc.today_pnl_pct}%) Today
                    </div>
                  </div>
                </div>
              </div>

              {/* 核心量化指标网格 */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                  <div className="text-[10px] text-slate-400">Max DD</div>
                  <div className="text-amber-300 font-bold font-mono">{acc.max_drawdown_pct}%</div>
                </div>
                <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                  <div className="text-[10px] text-slate-400">Sharpe</div>
                  <div className="text-cyan-300 font-bold font-mono">--</div>
                </div>
                <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                  <div className="text-[10px] text-slate-400">Calmar</div>
                  <div className="text-slate-200 font-bold font-mono">--</div>
                </div>
                <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                  <div className="text-[10px] text-slate-400">胜率 / 盈亏比</div>
                  <div className="text-slate-200 font-mono">
                    -- / --
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                  <div className="text-[10px] text-slate-400">当前仓位</div>
                  <div className="text-white font-bold font-mono">{acc.current_exposure_pct}%</div>
                </div>
                <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                  <div className="text-[10px] text-slate-400">持仓 / 现金</div>
                  <div className="text-slate-300 font-mono">
                    {acc.position_count}只 / ¥{Math.round(acc.cash / 1000)}k
                  </div>
                </div>
              </div>

              {/* 底部交互提示 */}
              <div className="pt-2 border-t border-cyan-950/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">
                  初始: ¥100k · 已记录 {acc.orders.length} 笔
                </span>
                <span className="text-cyan-400 flex items-center gap-0.5 font-medium group">
                  {isSelected ? "当前监控" : "切换视角"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
