"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { 
  Activity, 
  ArrowRight, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Layers,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { Reveal } from "@/components/shared/reveal";
import { SpotlightCard } from "@/components/ui/spotlight-card";

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
      .catch(() => {
        // 容错使用默认
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="container-shell py-12 md:py-16">
      {/* 头部标题区 */}
      <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold mb-3 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>A股量化投研中心 · 公共策略竞技场</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            实盘环境推演与三大基准策略
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            基于真实行情的多源交叉校验与 5 分钟微观推演，全景展示三大风格策略的净值曲线与调仓逻辑。
          </p>
        </div>

        <Link
          href="/market"
          className="shimmer-beam inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs md:text-sm font-medium hover:bg-slate-800 hover:border-cyan-400/50 hover:shadow-[0_0_16px_rgba(0,240,255,0.2)] hover:-translate-y-0.5 transition-all group shadow-sm"
        >
          <span>进入完整量化实验室</span>
          <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </Reveal>

      {/* 市场环境脉搏条 */}
      <Reveal delay={0.05} className="glass-panel rounded-2xl border border-white/10 bg-gradient-to-r from-[#0c1426] via-[#0f172a] to-[#0c1426] p-4 md:p-5 mb-6 shadow-[0_16px_36px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
          <div className="col-span-2 md:col-span-1 border-b md:border-b-0 md:border-r border-white/10 pb-3 md:pb-0">
            <span className="text-xs text-slate-400 font-medium block mb-1">大盘环境周期</span>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-base font-bold text-white">
                {pulse?.state || "主升攻坚"}
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium mt-0.5 block">
              建议仓位 {pulse?.suggested_position || "65%~85%"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">两市成交总额</span>
            <span className="text-base font-bold text-white">
              {pulse?.turnover_label || "--"}
            </span>
            <span className="text-[11px] text-slate-400 block">{pulse?.state || "实时大盘动态"}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-0.5">多空比 (上涨/下跌)</span>
            <div className="text-base font-bold text-white">
              <span className="text-rose-400 font-bold">{pulse?.up_count != null ? pulse.up_count : "--"}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-emerald-400 font-bold">{pulse?.down_count != null ? pulse.down_count : "--"}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              {pulse?.limit_up_count != null ? `涨停 ${pulse.limit_up_count} 家` : "情绪监测中"}
            </span>
          </div>

          <div className="col-span-2 md:col-span-2 flex flex-col justify-center">
            <span className="text-xs text-slate-400 block mb-1">当前核心主线聚焦</span>
            <div className="flex flex-wrap gap-1.5">
              {(pulse?.mainlines || ["热点轮动监测中"]).map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-0.5 rounded-md bg-white/5 text-slate-200 text-xs font-medium border border-white/10"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* 三大策略卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {strategies.map((strategy, idx) => {
          const isSelected = strategy.id === activeStrategy;
          const isAggressive = strategy.id === "aggressive";
          const isBalanced = strategy.id === "balanced";

          return (
            <Reveal key={strategy.id} delay={idx * 0.08}>
              <SpotlightCard
                onClick={() => setActiveStrategy(strategy.id)}
                className={cn(
                  "h-full rounded-2xl border p-5 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between hover:-translate-y-1 backdrop-blur-md",
                  isSelected
                    ? "border-cyan-400/60 bg-[#0f172a] shadow-[0_0_28px_rgba(0,240,255,0.2)] ring-1 ring-cyan-400/30"
                    : "border-white/10 bg-[#0d162b]/80 hover:border-white/20 hover:bg-[#0f172a] hover:shadow-lg"
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="quant-strategy-top-bar"
                    className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-400 shadow-[0_0_8px_#22d3ee]"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  />
                )}
                {/* 顶部标签 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isAggressive ? (
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                          <Flame className="w-4 h-4" />
                        </div>
                      ) : isBalanced ? (
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                          <Zap className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">
                          {strategy.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {strategy.badge}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <motion.span
                        layoutId="quant-strategy-pill"
                        className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] text-cyan-300 font-medium shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                      >
                        当前选中
                      </motion.span>
                    )}
                  </div>

                  {/* 核心收益数据 */}
                  <div className="my-4 py-3 px-3.5 rounded-xl bg-[#090e1b] border border-white/10 flex items-baseline justify-between shadow-inner">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-0.5">累计真实收益率</span>
                      <span
                        className={cn(
                          "text-2xl font-extrabold tracking-tight",
                          strategy.total_return_pct >= 0 ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        )}
                      >
                        {strategy.total_return_pct >= 0 ? "+" : ""}
                        {strategy.total_return_pct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block mb-0.5">夏普比率</span>
                      <span className="text-base font-bold text-white">
                        {strategy.sharpe_ratio.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 关键指标概览 */}
                  <div className="grid grid-cols-3 gap-2 text-xs py-2 border-t border-b border-white/10 mb-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">胜率</span>
                      <span className="font-semibold text-white">
                        {strategy.win_rate_pct.toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">最大回撤</span>
                      <span className="font-semibold text-emerald-400">
                        {strategy.max_drawdown_pct.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">当前仓位</span>
                      <span className="font-semibold text-white">
                        {strategy.current_exposure_pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* 当前重仓龙头 */}
                  <div className="text-xs flex items-center justify-between text-slate-300 py-1">
                    <span>当前持仓聚焦：</span>
                    <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                      {strategy.top_stock} ({strategy.top_stock_code})
                    </span>
                  </div>
                </div>

                {/* 底部策略理念 */}
                <div className="pt-3 border-t border-white/10 mt-2">
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {strategy.reason}
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>
          );
        })}
      </div>

      {/* 底部策略详情展开区 */}
      {strategies.find((s) => s.id === activeStrategy) && (
        <Reveal delay={0.2} className="mt-5 glass-panel rounded-2xl border border-white/10 bg-[#0c1426]/90 p-5 shadow-[0_20px_48px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">
                  {strategies.find((s) => s.id === activeStrategy)?.name} · 调仓动向说明
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-400/40 text-cyan-300">
                  {strategies.find((s) => s.id === activeStrategy)?.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {strategies.find((s) => s.id === activeStrategy)?.reason}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {mounted && user ? (
                <Link
                  href="/market"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 shadow-[0_0_16px_rgba(0,240,255,0.3)] transition-all flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>管理我的策略仓位</span>
                </Link>
              ) : mounted ? (
                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-medium hover:bg-white/20 hover:border-cyan-400/40 hover:text-cyan-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>登录同步实盘资产</span>
                </button>
              ) : null}

              <Link
                href="/market"
                className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>研报详情</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      )}
    </section>
  );
}
