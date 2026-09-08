"use client";

import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  PieChart,
  Activity,
  Layers,
  Percent,
  Lock,
} from "lucide-react";
import { ArenaAccount, StrategyType } from "@/lib/quant-arena/types";

interface RiskCenterViewProps {
  accounts: Record<StrategyType, ArenaAccount>;
  activeStrategy: StrategyType;
}

export function RiskCenterView({ accounts, activeStrategy }: RiskCenterViewProps) {
  const acc = accounts[activeStrategy];
  if (!acc) return null;

  const m = acc.risk_metrics;
  const attr = acc.attribution;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SAFE":
        return {
          label: "SAFE 正常监控",
          bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          icon: ShieldCheck,
        };
      case "WATCH":
        return {
          label: "WATCH 重点观察",
          bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          icon: Activity,
        };
      case "WARNING":
        return {
          label: "WARNING 触发一级减仓",
          bg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
          icon: AlertTriangle,
        };
      case "CRITICAL":
        return {
          label: "CRITICAL 触发二级深降",
          bg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
          icon: ShieldAlert,
        };
      case "PROTECTION_MODE":
        return {
          label: "PROTECTION MODE 熔断保护模式",
          bg: "bg-rose-600/30 text-rose-300 border-rose-500 animate-pulse",
          icon: Lock,
        };
      default:
        return {
          label: "NORMAL",
          bg: "bg-slate-700/30 text-slate-300 border-slate-600",
          icon: ShieldCheck,
        };
    }
  };

  const statusInfo = getStatusBadge(acc.risk_status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* 熔断保护与风控状态总览 */}
      <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-white font-mono uppercase">
                PORTFOLIO RISK & CIRCUIT BREAKER ｜ 风控与熔断中心
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              实时监测回撤门槛、VaR 在险价值与多重行业集中度暴露，自动激活三级降仓与熔断模式
            </p>
          </div>

          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono text-xs font-bold ${statusInfo.bg}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* 策略熔断阶梯规则说明卡 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className={`p-3.5 rounded-2xl border text-xs font-mono space-y-1 ${
            Math.abs(acc.max_drawdown_pct) >= 10 ? "bg-amber-500/10 border-amber-500/40" : "bg-black/30 border-white/5"
          }`}>
            <div className="text-slate-400">一级风控：回撤 &gt; 10%</div>
            <div className="text-white font-bold">强制总仓位降档 20%</div>
            <p className="text-[10px] text-slate-400">压降高贝塔标的，腾出可用现金对冲</p>
          </div>

          <div className={`p-3.5 rounded-2xl border text-xs font-mono space-y-1 ${
            Math.abs(acc.max_drawdown_pct) >= 15 ? "bg-rose-500/15 border-rose-500/40" : "bg-black/30 border-white/5"
          }`}>
            <div className="text-slate-400">二级风控：回撤 &gt; 15%</div>
            <div className="text-white font-bold">强制总仓位降档 40%</div>
            <p className="text-[10px] text-slate-400">清仓浮亏标的，仅保留极高胜率品种</p>
          </div>

          <div className={`p-3.5 rounded-2xl border text-xs font-mono space-y-1 ${
            acc.is_protection_mode ? "bg-rose-600/20 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" : "bg-black/30 border-white/5"
          }`}>
            <div className="text-slate-400">终极熔断：回撤 &gt; 20%</div>
            <div className="text-rose-400 font-bold">进入 PROTECTION MODE</div>
            <p className="text-[10px] text-slate-400">全系统锁定新增买入，转入绝对防守</p>
          </div>
        </div>
      </div>

      {/* 风险指标与归因分析两列矩阵 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧：深度风险计量矩阵 */}
        <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Activity className="w-4 h-4 text-cyan-400" />
            深度组合风险指标穿透
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-400">历史最大回撤 (MDD)</span>
              <div className="text-amber-300 font-black text-base">{acc.max_drawdown_pct}%</div>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-400">年化波动率</span>
              <div className="text-white font-black text-base">{m.volatility_pct}%</div>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-400">组合相对 Beta</span>
              <div className="text-cyan-300 font-black text-base">{m.beta}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-400">95% 在险价值 (VaR)</span>
              <div className="text-rose-400 font-black text-base">{m.var_95_pct}%</div>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-400">条件在险价值 (CVaR)</span>
              <div className="text-rose-400 font-black text-base">{m.cvar_95_pct}%</div>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-400">单票最大持仓权重</span>
              <div className="text-white font-black text-base">{m.max_single_position_pct}%</div>
            </div>
          </div>

          <div className="pt-2 text-xs space-y-2 font-mono border-t border-cyan-950">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">第一重仓行业:</span>
              <span className="text-cyan-300 font-bold">{m.top_industry} ({m.top_industry_pct}%)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">前三大持仓集中度:</span>
              <span className="text-white font-bold">{m.concentration_top3_pct}%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">现金储备占比:</span>
              <span className="text-emerald-400 font-bold">{(100 - acc.current_exposure_pct).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* 右侧：Brinson 收益归因分析 (Attribution) */}
        <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
              <PieChart className="w-4 h-4 text-cyan-400" />
              组合收益来源穿透归因 (Attribution)
            </h4>
            <span className="text-xs font-mono text-cyan-300 font-bold">
              累计超额 Alpha: +{attr.alpha_pct}%
            </span>
          </div>

          <p className="text-xs text-slate-400">
            科学回答“为什么这个账户能赚钱？”· 拆解选股、行业配置、择时与仓位贡献
          </p>

          <div className="space-y-3 pt-1 text-xs font-mono">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">选股超额贡献 (Stock Selection)</span>
                <span className="text-rose-400 font-bold">+{attr.stock_selection_pct}%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: "70%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">行业赛道暴露贡献 (Industry Allocation)</span>
                <span className="text-cyan-300 font-bold">+{attr.industry_allocation_pct}%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: "45%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">择时买卖节点贡献 (Timing)</span>
                <span className="text-emerald-400 font-bold">+{attr.timing_pct}%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "30%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">仓位权重配比贡献 (Position Sizing)</span>
                <span className="text-slate-200 font-bold">+{attr.position_sizing_pct}%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: "20%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">市场大盘贝塔驱动 (Market Beta)</span>
                <span className={attr.market_beta_pct >= 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {attr.market_beta_pct >= 0 ? "+" : ""}{attr.market_beta_pct}%
                </span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "15%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
