"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Flame,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { Reveal } from "@/components/shared/reveal";

const emptySubscribe = () => () => {};

interface StrategyItem {
  id: string;
  name: string;
  badge: string;
  total_return_pct: number;
  today_pnl_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  win_rate_pct: number;
  position_count: number;
  current_exposure_pct: number;
  top_stock: string;
  top_stock_code: string;
  reason: string;
}

interface MarketPulse {
  state: string;
  style: string;
  suggested_position: string;
  turnover_label: string;
  turnover_yi: number;
  up_count: number;
  down_count: number;
  limit_up_count: number;
  limit_down_count: number;
  mainlines: string[];
}

export function QuantArenaPreview() {
  const [pulse, setPulse] = useState<MarketPulse | null>(null);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<string>("aggressive");
  const { user, openAuthModal } = useAuth();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    let ignore = false;
    fetch("/api-market/public-summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.success) {
          if (data.market_pulse) setPulse(data.market_pulse);
          if (data.strategies) setStrategies(data.strategies);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const currentStrategy = strategies.find((s) => s.id === activeStrategy);

  return (
    <section className="studio-section bg-[#04060b]">
      <div className="container-shell">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="tech-tag mb-2.5 border-emerald-500/35 bg-emerald-950/40 text-emerald-300">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>SEC_02 // QUANTITATIVE ARENA TERMINAL</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              实盘环境推演与三大基准策略
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
              基于多源交叉行情校验与 5 分钟微观推演，全景追踪激进、均衡、防御三大模型净值曲线与调仓轨迹。
            </p>
          </div>

          <Link
            href="/market"
            className="shimmer-beam inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-semibold hover:bg-emerald-500 hover:text-slate-950 transition-all group"
          >
            <span>进入完整量化实验室</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Reveal>

        {/* Exposed Bloomberg-Style Market Ticker Matrix */}
        <Reveal delay={0.05} className="arch-frame rounded-xl overflow-hidden mb-6">
          <div className="hud-header">
            <span className="text-emerald-400">MARKET PULSE // LIVE TELEMETRY</span>
            <span>A-SHARE DESK</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
            <div className="col-span-2 md:col-span-3 p-4 sm:p-5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                MARKET REGIME
              </span>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-lg font-bold text-white">{pulse?.state || "主升攻坚"}</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-400 mt-1 block">
                TARGET POS: {pulse?.suggested_position || "65%~85%"}
              </span>
            </div>

            <div className="md:col-span-2 p-4 sm:p-5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                TURNOVER
              </span>
              <span className="text-lg font-bold text-white font-mono tabular-nums">
                {pulse?.turnover_label || "--"}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {pulse?.state || "两市实时成交"}
              </span>
            </div>

            <div className="md:col-span-3 p-4 sm:p-5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                BREADTH (ADV / DEC)
              </span>
              <div className="text-lg font-bold font-mono tabular-nums">
                <span className="text-rose-400">{pulse?.up_count != null ? pulse.up_count : "--"}</span>
                <span className="text-slate-600 mx-1.5">/</span>
                <span className="text-emerald-400">{pulse?.down_count != null ? pulse.down_count : "--"}</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                {pulse?.limit_up_count != null ? `涨停 ${pulse.limit_up_count} 家` : "情绪监测中"}
              </span>
            </div>

            <div className="col-span-2 md:col-span-4 p-4 sm:p-5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 block mb-2">
                MAINLINE SECTORS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(pulse?.mainlines || ["热点轮动监测中"]).map((m) => (
                  <span
                    key={m}
                    className="px-2.5 py-0.5 rounded border border-white/10 bg-white/[0.04] text-slate-200 text-xs font-medium"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Three Strategy Terminal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {strategies.map((strategy, idx) => {
            const isSelected = strategy.id === activeStrategy;
            const isAggressive = strategy.id === "aggressive";
            const isBalanced = strategy.id === "balanced";

            return (
              <Reveal key={strategy.id} delay={idx * 0.06}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveStrategy(strategy.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveStrategy(strategy.id);
                    }
                  }}
                  className={cn(
                    "arch-frame h-full rounded-xl overflow-hidden flex flex-col justify-between cursor-pointer",
                    isSelected
                      ? "border-cyan-400/60 shadow-[0_0_32px_rgba(0,240,255,0.16)]"
                      : "hover:border-white/25"
                  )}
                >
                  <div className="hud-header">
                    <span className={isSelected ? "text-cyan-300 font-bold" : "text-slate-400"}>
                      {`STRAT_0${idx + 1} // ${strategy.badge}`}
                    </span>
                    {isSelected ? (
                      <span className="text-cyan-400 font-bold">[ SELECTED ]</span>
                    ) : (
                      <span>STANDBY</span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg border flex items-center justify-center",
                            isAggressive
                              ? "bg-rose-500/15 border-rose-500/35 text-rose-400"
                              : isBalanced
                                ? "bg-cyan-500/15 border-cyan-500/35 text-cyan-400"
                                : "bg-emerald-500/15 border-emerald-500/35 text-emerald-400"
                          )}
                        >
                          {isAggressive ? (
                            <Flame className="w-4 h-4" />
                          ) : isBalanced ? (
                            <Zap className="w-4 h-4" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white leading-tight">
                            {strategy.name}
                          </h3>
                          <span className="font-mono text-[10px] text-slate-400 uppercase">
                            ALPHA ENGINE
                          </span>
                        </div>
                      </div>

                      {/* Primary Readout Well */}
                      <div className="rounded-lg border border-white/10 bg-[#04060b] p-3.5 flex items-baseline justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-slate-500 block mb-1">
                            CUMULATIVE RETURN
                          </span>
                          <span
                            className={cn(
                              "text-2xl font-extrabold font-mono tabular-nums tracking-tight",
                              strategy.total_return_pct >= 0 ? "text-rose-400" : "text-emerald-400"
                            )}
                          >
                            {strategy.total_return_pct >= 0 ? "+" : ""}
                            {strategy.total_return_pct.toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[10px] text-slate-500 block mb-1">SHARPE</span>
                          <span className="text-base font-bold font-mono text-white tabular-nums">
                            {strategy.sharpe_ratio.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* 3-Cell Telemetry Strip */}
                      <div className="grid grid-cols-3 border border-white/[0.08] rounded-lg divide-x divide-white/[0.08] mt-3 bg-[#060a14]">
                        <div className="p-2.5">
                          <span className="font-mono text-[9px] text-slate-500 block">WIN RATE</span>
                          <span className="font-mono text-xs font-bold text-white">
                            {strategy.win_rate_pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="p-2.5">
                          <span className="font-mono text-[9px] text-slate-500 block">MAX DD</span>
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {strategy.max_drawdown_pct.toFixed(2)}%
                          </span>
                        </div>
                        <div className="p-2.5">
                          <span className="font-mono text-[9px] text-slate-500 block">EXPOSURE</span>
                          <span className="font-mono text-xs font-bold text-white">
                            {strategy.current_exposure_pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] text-slate-400">TOP HOLDING:</span>
                        <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded">
                          {strategy.top_stock} ({strategy.top_stock_code})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {strategy.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Active Strategy Command Footer */}
        {currentStrategy && (
          <Reveal delay={0.12} className="mt-5 arch-frame rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-950/50 text-cyan-300">
                  ACTIVE THESIS
                </span>
                <span className="text-sm font-bold text-white">
                  {currentStrategy.name} · 调仓逻辑综述
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {currentStrategy.reason}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {mounted && user ? (
                <Link
                  href="/market"
                  className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 transition-all flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>管理策略仓位</span>
                </Link>
              ) : mounted ? (
                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="px-4 py-2 rounded-lg border border-white/15 bg-white/[0.05] text-white text-xs font-medium hover:border-cyan-400/50 hover:text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>登录同步资产</span>
                </button>
              ) : null}

              <Link
                href="/market"
                className="px-3.5 py-2 rounded-lg border border-white/12 bg-white/[0.03] text-slate-200 text-xs font-medium hover:text-white transition-colors flex items-center gap-1"
              >
                <span>研报详情</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
