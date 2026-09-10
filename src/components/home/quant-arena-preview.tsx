"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Activity, 
  ArrowRight, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Layers,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold mb-3">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>A股量化投研中心 · 公共策略竞技场</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            实盘环境推演与三大基准策略
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            基于真实行情的多源交叉校验与 5 分钟微观推演，全景展示三大风格策略的净值曲线与调仓逻辑。
          </p>
        </div>

        <Link
          href="/market"
          className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-xl bg-slate-900 text-white text-xs md:text-sm font-medium hover:bg-slate-800 transition-colors group shadow-sm"
        >
          <span>进入完整量化实验室</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* 市场环境脉搏条 */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-4 md:p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
          <div className="col-span-2 md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200/60 pb-3 md:pb-0">
            <span className="text-xs text-slate-500 font-medium block mb-1">大盘环境周期</span>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-base font-bold text-slate-900">
                {pulse?.state || "主升攻坚"}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
              建议仓位 {pulse?.suggested_position || "65%~85%"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block mb-0.5">两市成交总额</span>
            <span className="text-base font-bold text-slate-900">
              {pulse?.turnover_label || "1.92万亿"}
            </span>
            <span className="text-[11px] text-slate-500 block">放量主升通道</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block mb-0.5">多空比 (上涨/下跌)</span>
            <div className="text-base font-bold text-slate-900">
              <span className="text-emerald-600">{pulse?.up_count || 3305}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-rose-600">{pulse?.down_count || 1877}</span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              涨停 {pulse?.limit_up_count || 73} 家
            </span>
          </div>

          <div className="col-span-2 md:col-span-2 flex flex-col justify-center">
            <span className="text-xs text-slate-500 block mb-1">当前核心主线聚焦</span>
            <div className="flex flex-wrap gap-1.5">
              {(pulse?.mainlines || ["CPO光模块", "连板龙头", "半导体中军"]).map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/50"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 三大策略卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {strategies.map((strategy) => {
          const isSelected = strategy.id === activeStrategy;
          const isAggressive = strategy.id === "aggressive";
          const isBalanced = strategy.id === "balanced";

          return (
            <div
              key={strategy.id}
              onClick={() => setActiveStrategy(strategy.id)}
              className={cn(
                "rounded-2xl border p-5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between",
                isSelected
                  ? "border-slate-900 bg-white shadow-md ring-1 ring-slate-900"
                  : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white"
              )}
            >
              {/* 顶部标签 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isAggressive ? (
                      <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/50 flex items-center justify-center text-rose-600">
                        <Flame className="w-4 h-4" />
                      </div>
                    ) : isBalanced ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/50 flex items-center justify-center text-blue-600">
                        <Zap className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/50 flex items-center justify-center text-emerald-600">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {strategy.name}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {strategy.badge}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-[10px] text-white font-medium">
                      当前选中
                    </span>
                  )}
                </div>

                {/* 核心收益数据 */}
                <div className="my-4 py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">累计真实收益率</span>
                    <span
                      className={cn(
                        "text-2xl font-extrabold tracking-tight",
                        strategy.total_return_pct >= 0 ? "text-rose-600" : "text-emerald-600"
                      )}
                    >
                      {strategy.total_return_pct >= 0 ? "+" : ""}
                      {strategy.total_return_pct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block mb-0.5">夏普比率</span>
                    <span className="text-base font-bold text-slate-800">
                      {strategy.sharpe_ratio.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 关键指标概览 */}
                <div className="grid grid-cols-3 gap-2 text-xs py-2 border-t border-b border-slate-100 mb-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">胜率</span>
                    <span className="font-semibold text-slate-800">
                      {strategy.win_rate_pct.toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">最大回撤</span>
                    <span className="font-semibold text-emerald-600">
                      {strategy.max_drawdown_pct.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">当前仓位</span>
                    <span className="font-semibold text-slate-800">
                      {strategy.current_exposure_pct.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* 当前重仓龙头 */}
                <div className="text-xs flex items-center justify-between text-slate-600 py-1">
                  <span>当前持仓聚焦：</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {strategy.top_stock} ({strategy.top_stock_code})
                  </span>
                </div>
              </div>

              {/* 底部策略理念 */}
              <div className="pt-3 border-t border-slate-100 mt-2">
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {strategy.reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部联动提示条 */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-900 text-white text-xs md:text-sm gap-3">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            登录专属账户后，可解锁查看三大策略<strong>完整分时与每日 K 线交易事件穿透</strong>，并同步进行<strong>私有真实持仓诊断</strong>。
          </span>
        </div>
        <Link
          href="/market"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors shrink-0"
        >
          <span>登录工作台</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
