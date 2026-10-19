"use client";

import { Award, Beaker, Calendar } from "lucide-react";
import { StrategyExperiment, ArenaAccount, StrategyType } from "@/lib/quant-arena/types";

interface StrategyExperimentsViewProps {
  experiment: StrategyExperiment;
  accounts: Record<StrategyType, ArenaAccount>;
}

export function StrategyExperimentsView({ experiment, accounts }: StrategyExperimentsViewProps) {
  const getStrategyName = (type: StrategyType) => {
    switch (type) {
      case "aggressive":
        return "激进超短龙头策略 (AGGRESSIVE)";
      case "balanced":
        return "均衡价值成长策略 (BALANCED)";
      case "conservative":
        return "保守高股息低波策略 (CONSERVATIVE)";
    }
  };

  // 动态从账户数据中找出各维度最优策略
  const types: StrategyType[] = ["aggressive", "balanced", "conservative"];

  const bestReturn = types.reduce((best, t) =>
    accounts[t].total_return_pct > accounts[best].total_return_pct ? t : best, types[0]);
  const lowestDD = types.reduce((best, t) =>
    Math.abs(accounts[t].max_drawdown_pct) < Math.abs(accounts[best].max_drawdown_pct) ? t : best, types[0]);
  const bestToday = types.reduce((best, t) =>
    accounts[t].today_pnl_pct > accounts[best].today_pnl_pct ? t : best, types[0]);
  const bestWinRate = types.reduce((best, t) =>
    accounts[t].win_rate_pct > accounts[best].win_rate_pct ? t : best, types[0]);

  // 按总收益率动态排名（冠军/亚军/季军）
  const ranked = [...types].sort((a, b) => accounts[b].total_return_pct - accounts[a].total_return_pct);
  const [winner, runnerUp, third] = ranked;

  const fmt = (n: number) => (n >= 0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`);

  return (
    <div className="space-y-6">
      {/* 实验卡片 */}
      <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-900/50 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Beaker className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white font-mono uppercase">
                  EXPERIMENT LAB ｜ 三策略平行实验 #001
                </h3>
                <span className="text-xs text-cyan-300 font-mono">{experiment.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              实验状态：运行中 · 完全可复现
            </span>
          </div>
        </div>

        {/* 实验参数元数据网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400">实验周期</span>
            <div className="text-white font-bold">{experiment.period}</div>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400">初始资金 / 账户</span>
            <div className="text-cyan-300 font-bold">¥ {experiment.initial_capital_per_account.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400">统一交易成本模型</span>
            <div className="text-slate-200">佣万2.5 · 卖印千0.5 · 滑点万2</div>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400">股票池规则纪律</span>
            <div className="text-amber-300">非ST / 非科创板 / 严格T+1</div>
          </div>
        </div>

        {/* 动态三强排名 */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#08101e] to-cyan-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase font-mono">
              <Award className="w-4 h-4" />
              当前阶段领先者 (CURRENT WINNER)
            </span>
            <span className="text-xs font-mono text-slate-400">综合多因子量化评估</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-black/40 border border-amber-500/40 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold">🥇 冠军 WINNER</span>
              <div className="text-white font-bold text-sm">{getStrategyName(winner)}</div>
              <div className="text-amber-300 text-[11px]">
                累计收益 {fmt(accounts[winner].total_return_pct)} · 当日 {fmt(accounts[winner].today_pnl_pct)} · 胜率 {accounts[winner].win_rate_pct}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/30 space-y-1">
              <span className="text-[10px] text-cyan-300 font-bold">🥈 亚军 RUNNER UP</span>
              <div className="text-white font-bold text-sm">{getStrategyName(runnerUp)}</div>
              <div className="text-cyan-300 text-[11px]">
                累计收益 {fmt(accounts[runnerUp].total_return_pct)} · 最大回撤 {accounts[runnerUp].max_drawdown_pct}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold">🥉 季军 THIRD</span>
              <div className="text-white font-bold text-sm">{getStrategyName(third)}</div>
              <div className="text-slate-300 text-[11px]">
                累计收益 {fmt(accounts[third].total_return_pct)} · 回撤 {accounts[third].max_drawdown_pct}% (极稳)
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300/90 leading-relaxed pt-1">
            <span className="text-amber-300 font-medium">【阶段裁决总结】</span> {experiment.evaluation_summary}
          </p>
        </div>
      </div>

      {/* 月度策略复盘 */}
      <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Calendar className="w-4 h-4 text-cyan-400" />
            MONTHLY STRATEGY REVIEW ｜ 月度策略实战复盘研判
          </h4>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            STRATEGY OF THE MONTH: {winner === "aggressive" ? "激进策略" : winner === "balanced" ? "均衡策略" : "保守策略"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-slate-400">哪个策略总收益最高？</span>
            <div className="text-amber-400 font-bold">
              {bestReturn === "aggressive" ? "激进" : bestReturn === "balanced" ? "均衡" : "保守"}策略 ({fmt(accounts[bestReturn].total_return_pct)})
            </div>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-slate-400">哪个策略回撤最低？</span>
            <div className="text-emerald-400 font-bold">
              {lowestDD === "aggressive" ? "激进" : lowestDD === "balanced" ? "均衡" : "保守"}策略 ({accounts[lowestDD].max_drawdown_pct}%)
            </div>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-slate-400">哪个策略今日表现最强？</span>
            <div className="text-cyan-300 font-bold">
              {bestToday === "aggressive" ? "激进" : bestToday === "balanced" ? "均衡" : "保守"}策略 ({fmt(accounts[bestToday].today_pnl_pct)})
            </div>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-slate-400">哪个策略胜率最高？</span>
            <div className="text-white font-bold">
              {bestWinRate === "aggressive" ? "激进" : bestWinRate === "balanced" ? "均衡" : "保守"}策略 ({accounts[bestWinRate].win_rate_pct}%)
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#070e18] border border-cyan-950 text-xs text-slate-400 space-y-1">
          <div className="text-slate-300 font-bold">【量化实验室严正免责声明】</div>
          <p>
            本月度实验所有回测、Paper Trading 与量化多因子评分结果均基于特定历史行情周期与公开客观数据撮合产生，
            <span className="text-amber-300 font-semibold">历史业绩与本月实验结果绝不代表未来任何收益保证</span>。市场风险自负。
          </p>
        </div>
      </div>
    </div>
  );
}

