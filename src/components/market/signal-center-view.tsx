"use client";

import { useState, useEffect } from "react";
import {
  Target,
  Zap,
  Scale,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  ArrowUpRight,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sliders,
} from "lucide-react";
import { StrategySignal, StrategyType, QuantScoreDetail, DecisionTrace } from "@/lib/quant-arena/types";

interface SignalCenterViewProps {
  onAddToPortfolio?: (stock: { code: string; name: string; price: number }) => void;
  showToast?: (text: string, type?: "info" | "success" | "warning") => void;
}

export function SignalCenterView({ onAddToPortfolio, showToast }: SignalCenterViewProps) {
  const [signalsByStrat, setSignalsByStrat] = useState<Record<StrategyType, StrategySignal[]>>({
    aggressive: [],
    balanced: [],
    conservative: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<"all" | StrategyType>("all");
  const [selectedActionFilter, setSelectedActionFilter] = useState<"all" | "BUY" | "SELL" | "HOLD" | "WATCH">("all");
  const [inspectingSignal, setInspectingSignal] = useState<StrategySignal | null>(null);

  useEffect(() => {
    async function loadSignals() {
      try {
        setLoading(true);
        const res = await fetch("/api-market/arena/signals");
        if (res.ok) {
          const json = await res.json();
          if (json.signals) {
            setSignalsByStrat(json.signals);
          }
        }
      } catch (err) {
        console.error("加载信号中心异常:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSignals();
  }, []);

  // 聚合所有信号并按过滤条件筛选
  const allSignals: StrategySignal[] = [
    ...(signalsByStrat.aggressive || []),
    ...(signalsByStrat.balanced || []),
    ...(signalsByStrat.conservative || []),
  ];

  const filteredSignals = allSignals.filter((sig) => {
    if (selectedStrategyFilter !== "all" && sig.strategy !== selectedStrategyFilter) return false;
    if (selectedActionFilter !== "all" && sig.action !== selectedActionFilter) return false;
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "BUY":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)] font-bold";
      case "SELL":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold";
      case "HOLD":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold";
      default:
        return "bg-slate-700/40 text-slate-300 border-slate-600 font-medium";
    }
  };

  const getStrategyLabel = (strat: StrategyType) => {
    switch (strat) {
      case "aggressive":
        return { name: "激进主升浪", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
      case "balanced":
        return { name: "均衡GARP", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" };
      case "conservative":
        return { name: "保守高股息", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-cyan-400/80 space-y-3">
        <Sparkles className="w-7 h-7 animate-spin text-cyan-400 mx-auto" />
        <p className="text-xs font-medium font-mono">正在执行多因子评分卡与规则引擎撮合扫描...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 信号中心顶部控制器 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#091322]/90 border border-cyan-500/30 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Target className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">
              QUANT SIGNAL CENTER ｜ 策略信号中心
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            严格基于公开事实与多因子评分卡输出 · 包含决策链路追踪（Decision Trace）与 100 分量化拆解
          </p>
        </div>

        {/* 双维度过滤器 */}
        <div className="flex items-center flex-wrap gap-2">
          {/* 策略维度 */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            {(["all", "aggressive", "balanced", "conservative"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStrategyFilter(s)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-mono ${
                  selectedStrategyFilter === s
                    ? "bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s === "all" ? "全部策略" : s === "aggressive" ? "激进" : s === "balanced" ? "均衡" : "保守"}
              </button>
            ))}
          </div>

          {/* 信号动作维度 */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            {(["all", "BUY", "HOLD", "WATCH"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setSelectedActionFilter(a)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-mono ${
                  selectedActionFilter === a
                    ? "bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {a === "all" ? "全部信号" : a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 信号卡片流 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSignals.map((sig) => {
          const strat = getStrategyLabel(sig.strategy);
          return (
            <div
              key={sig.id}
              className="p-5 rounded-2xl bg-[#0c1626]/85 border border-cyan-500/25 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4 shadow-md group"
            >
              <div>
                {/* 标的名称、代码、策略与动作 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white">{sig.stock_name}</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{sig.stock_code}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${strat.color}`}>
                      {strat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-lg border font-mono ${getActionBadge(sig.action)}`}>
                      {sig.action}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-black text-white font-mono">{sig.score}</span>
                      <span className="text-[10px] text-slate-400 font-mono">/100</span>
                    </div>
                  </div>
                </div>

                {/* 交易关键数值网格 (现价、建议入场、止损、目标、建议仓位、盈亏比) */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3.5 p-3 rounded-xl bg-black/30 border border-white/5 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400">最新现价</span>
                    <div className="text-white font-bold font-mono">
                      {sig.current_price ? `¥${sig.current_price.toFixed(2)}` : "--"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">建议买入点</span>
                    <div className="text-cyan-300 font-mono">
                      {sig.suggested_entry ? `¥${sig.suggested_entry.toFixed(2)}` : "--"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">动态止损</span>
                    <div className="text-amber-400 font-bold font-mono">
                      {sig.stop_loss ? `¥${sig.stop_loss.toFixed(2)}` : "--"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">预期目标</span>
                    <div className="text-emerald-400 font-bold font-mono">
                      {sig.target_price ? `¥${sig.target_price.toFixed(2)}` : "--"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">建议仓位</span>
                    <div className="text-white font-mono">{sig.position_size_pct}%</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">盈亏比</span>
                    <div className="text-cyan-300 font-mono">{sig.risk_reward_ratio}:1</div>
                  </div>
                </div>

                {/* 信号逻辑详细说明 */}
                <p className="text-xs text-slate-300/90 mt-3 line-clamp-2 leading-relaxed">
                  <span className="text-cyan-400 font-medium">【核心依据】</span> {sig.reason}
                </p>
              </div>

              {/* 底部信息与决策溯源按钮 */}
              <div className="pt-3 border-t border-cyan-950/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-cyan-400/70" />
                  <span>数据截止: {sig.data_as_of.slice(5, 16)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onAddToPortfolio && sig.current_price) {
                        onAddToPortfolio({
                          code: sig.stock_code,
                          name: sig.stock_name,
                          price: sig.current_price,
                        });
                      }
                      showToast?.(`已将 ${sig.stock_name} 加入待选`, "info");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-500/30 text-[11px] font-sans transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    自选
                  </button>

                  <button
                    onClick={() => setInspectingSignal(sig)}
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] font-bold font-sans transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>溯源链路</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Decision Trace 决策链路与 100 分量化评分透明抽屉/弹窗 */}
      {inspectingSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#0c182b] via-[#091220] to-[#0c182b] border border-cyan-500/40 p-6 space-y-5 shadow-[0_0_50px_rgba(6,182,212,0.25)]">
            {/* 弹窗顶部 */}
            <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <Target className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {inspectingSignal.stock_name} ({inspectingSignal.stock_code})
                    <span className="text-xs font-mono text-cyan-300">
                      决策溯源链路 (Decision Trace)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    策略引擎: {getStrategyLabel(inspectingSignal.strategy).name} · 评分: {inspectingSignal.score}/100
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingSignal(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. 量化评分透明拆解 (QUANT SCORE 100分) */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                <span>1. 量化评分透明拆解 (QUANT SCORE 100分)</span>
                <span className="font-mono text-white text-sm">TOTAL: {inspectingSignal.score} / 100</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {Object.entries(inspectingSignal.score_detail)
                  .filter(([k]) => k !== "total")
                  .map(([key, item]: any) => (
                    <div key={key} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{item.label}</span>
                        <span className="text-cyan-400 font-bold">{item.score}/{item.max}</span>
                      </div>
                      <div className="text-[10px] text-white font-bold truncate">{item.value}</div>
                      <div className="text-[9px] text-slate-400 line-clamp-1" title={item.reason}>{item.reason}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 2. 决策链路全景穿透 (Decision Trace) */}
            <div className="space-y-3 pt-2 border-t border-cyan-900/40">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                2. 交易决策链路全景穿透 (Data → Factor → Signal → Risk → Execution)
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#070e18] border border-cyan-950 space-y-1">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    【为什么买？】
                  </div>
                  <p className="text-slate-400 pl-3 leading-relaxed">
                    {inspectingSignal.decision_trace.factors}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#070e18] border border-cyan-950 space-y-1">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    【为什么现在买？时间窗口与信号触发】
                  </div>
                  <p className="text-slate-400 pl-3 leading-relaxed">
                    {inspectingSignal.decision_trace.signal_eval} · 触发时点: {inspectingSignal.decision_trace.signal_time}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#070e18] border border-cyan-950 space-y-1">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    【为什么买这么多？仓位与风控配比】
                  </div>
                  <p className="text-slate-400 pl-3 leading-relaxed">
                    {inspectingSignal.decision_trace.sizing_rationale} · {inspectingSignal.decision_trace.risk_check}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#070e18] border border-cyan-950 space-y-1">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    【撮合执行方案与 T+1 纪律】
                  </div>
                  <p className="text-slate-400 pl-3 leading-relaxed">
                    {inspectingSignal.decision_trace.execution_plan}
                  </p>
                </div>
              </div>
            </div>

            {/* 弹窗底部操作按钮 */}
            <div className="pt-2 border-t border-cyan-900/50 flex items-center justify-end">
              <button
                onClick={() => setInspectingSignal(null)}
                className="px-5 py-2 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                关闭溯源详情
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
