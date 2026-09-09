"use client";
import type { ArenaAccount,StrategyType } from "@/lib/quant-arena/types";
export function RiskCenterView({accounts,activeStrategy}:{accounts:Record<StrategyType,ArenaAccount>;activeStrategy:StrategyType}) {
  const account=accounts[activeStrategy];if(!account)return null;
  const largest=Math.max(0,...account.positions.map(item=>item.weight_pct));
  return <section className="space-y-6 border-y border-cyan-900/40 py-6 text-slate-300">
    <h2 className="text-lg font-semibold text-white">{account.name} · 记录风险指标</h2>
    <p className="text-sm">按手动参考价记录计算，当前未提供实时风险评级、VaR 或自动熔断。</p>
    <dl className="grid gap-6 sm:grid-cols-3"><div><dt className="text-xs">历史峰值回撤</dt><dd className="mt-2 text-2xl font-mono text-white">{account.max_drawdown_pct.toFixed(2)}%</dd></div><div><dt className="text-xs">持仓占记录净值</dt><dd className="mt-2 text-2xl font-mono text-white">{account.current_exposure_pct.toFixed(2)}%</dd></div><div><dt className="text-xs">最大单项权重</dt><dd className="mt-2 text-2xl font-mono text-white">{largest.toFixed(2)}%</dd></div></dl>
    {!account.orders.length&&<p role="status" className="text-sm">账户尚无交易记录，暂不评估策略表现。</p>}
  </section>;
}
