/**
 * 金股推荐面板组件
 * 整合进信号中心（Tab2），展示：
 * - 顶部：三策略历史推荐成功率统计概览
 * - 中部：历史推荐记录列表（含状态、涨幅、胜负）
 * - 底部：当前持仓中推荐（实时价格）
 */
"use client";

import { useState, useEffect } from "react";
import {
  Star, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle,
  Hourglass, BarChart3, Plus, ChevronDown, ChevronUp,
} from "lucide-react";
import type {
  GoldStockRecord,
  GoldStockStats,
  GoldStockStrategy,
} from "@/lib/gold-stock-db";

interface GoldStockPanelProps {
  showToast?: (text: string, type?: "info" | "success" | "warning") => void;
}

const STRATEGY_LABELS: Record<GoldStockStrategy, { name: string; color: string; border: string }> = {
  aggressive:   { name: "激进超短",   color: "text-amber-400",   border: "border-amber-500/40" },
  balanced:     { name: "均衡GARP",   color: "text-cyan-400",    border: "border-cyan-500/40" },
  conservative: { name: "保守高股息", color: "text-emerald-400", border: "border-emerald-500/40" },
};

const STATUS_LABELS: Record<GoldStockRecord["status"], { label: string; icon: typeof CheckCircle; color: string }> = {
  holding: { label: "持有中", icon: Clock,        color: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30" },
  win:     { label: "止盈✅", icon: CheckCircle,  color: "text-rose-400 bg-rose-500/15 border-rose-500/30" },
  stopped: { label: "止损❌", icon: XCircle,      color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
  expired: { label: "到期结算", icon: Hourglass,  color: "text-slate-400 bg-slate-700/30 border-slate-600" },
};

export function GoldStockPanel({ showToast }: GoldStockPanelProps) {
  const [records, setRecords] = useState<GoldStockRecord[]>([]);
  const [stats, setStats] = useState<GoldStockStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStrategy, setFilterStrategy] = useState<"all" | GoldStockStrategy>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | GoldStockRecord["status"]>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (filterStrategy !== "all") params.set("strategy", filterStrategy);
        if (filterStatus !== "all") params.set("status", filterStatus);
        const res = await fetch(`/api-market/recommendations?${params}`);
        if (!res.ok) throw new Error("加载失败");
        const json = await res.json();
        if (active) {
          setRecords(json.records ?? []);
          setStats(json.stats ?? []);
        }
      } catch {
        if (active) {
          showToast?.("金股推荐数据加载失败", "warning");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void fetchData();
    return () => {
      active = false;
    };
  }, [filterStrategy, filterStatus, showToast]);

  const fmt = (n: number | null | undefined) => {
    if (n == null) return "--";
    return (n >= 0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`);
  };
  const fmtPrice = (n: number | null | undefined) => n != null ? `¥${n.toFixed(2)}` : "--";

  return (
    <div className="space-y-5">
      {/* 成功率统计概览 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["aggressive", "balanced", "conservative"] as GoldStockStrategy[]).map((strat) => {
          const stat = stats.find(s => s.strategy === strat);
          const label = STRATEGY_LABELS[strat];
          return (
            <div
              key={strat}
              className={`p-4 rounded-2xl bg-[#091322]/90 border ${label.border} space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold font-mono ${label.color}`}>{label.name}</span>
                <BarChart3 className={`w-3.5 h-3.5 ${label.color}`} />
              </div>
              {stat && stat.total > 0 ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white font-mono">{stat.win_rate_pct}%</span>
                    <span className="text-xs text-slate-400 font-mono">历史胜率</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                    <div className="text-center">
                      <div className="text-slate-400">总推荐</div>
                      <div className="text-white font-bold">{stat.total}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400">盈利</div>
                      <div className="text-rose-400 font-bold">{stat.win_count}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400">盈亏比</div>
                      <div className="text-cyan-300 font-bold">
                        {stat.profit_factor > 0 ? `${stat.profit_factor}` : "--"}:1
                      </div>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-white/5 flex justify-between text-[10px] font-mono text-slate-400">
                    <span>平均盈利 <span className="text-rose-400">+{stat.avg_win_return_pct}%</span></span>
                    <span>平均亏损 <span className="text-emerald-400">-{stat.avg_loss_return_pct}%</span></span>
                  </div>
                </>
              ) : (
                <div className="py-3 text-center text-[11px] text-slate-500 font-mono">
                  暂无推荐历史数据
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 过滤器 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#091322]/90 border border-cyan-500/30">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">
            GOLD STOCK RECORDS · 金股推荐历史
          </h3>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {/* 策略过滤 */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            {(["all", "aggressive", "balanced", "conservative"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStrategy(s)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-mono ${
                  filterStrategy === s
                    ? "bg-amber-500/25 text-amber-200 font-bold border border-amber-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s === "all" ? "全部" : s === "aggressive" ? "激进" : s === "balanced" ? "均衡" : "保守"}
              </button>
            ))}
          </div>
          {/* 状态过滤 */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            {(["all", "holding", "win", "stopped"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-mono ${
                  filterStatus === st
                    ? "bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {st === "all" ? "全部状态" : st === "holding" ? "持有中" : st === "win" ? "已止盈" : "已止损"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 推荐记录列表 */}
      {loading ? (
        <div className="py-12 text-center text-cyan-400/80 text-xs font-mono">正在加载金股推荐数据...</div>
      ) : records.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <Star className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400 font-mono">暂无金股推荐记录</p>
          <p className="text-xs text-slate-500">在信号中心发现高评分信号后，可手动录入金股推荐</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((rec) => {
            const label = STRATEGY_LABELS[rec.strategy];
            const statusLabel = STATUS_LABELS[rec.status];
            const StatusIcon = statusLabel.icon;
            const returnVal = rec.actual_return_pct ?? (rec.current_price
              ? parseFloat((((rec.current_price - rec.entry_price) / rec.entry_price) * 100).toFixed(2))
              : null);
            const isExpanded = expandedId === rec.id;
            const isUp = returnVal != null && returnVal >= 0;

            return (
              <div
                key={rec.id}
                className="rounded-2xl bg-[#0c1626]/85 border border-cyan-500/20 overflow-hidden"
              >
                {/* 主行 */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === "Enter") setExpandedId(isExpanded ? null : rec.id); }}
                  aria-expanded={isExpanded}
                >
                  {/* 策略标签 */}
                  <span className={`flex-shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${label.border} ${label.color} bg-black/40`}>
                    {label.name}
                  </span>

                  {/* 股票名称 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{rec.stock_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{rec.stock_code}</span>
                      {rec.sector && (
                        <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                          {rec.sector}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      推荐日: {rec.recommend_date} · 买入价 ¥{rec.entry_price.toFixed(2)} · 评分 {rec.score}/100
                    </div>
                  </div>

                  {/* 状态 + 收益 */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusLabel.color} flex items-center gap-1`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusLabel.label}
                    </span>
                    {returnVal != null && (
                      <span className={`text-sm font-black font-mono flex items-center gap-0.5 ${isUp ? "text-rose-400" : "text-emerald-400"}`}>
                        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {fmt(returnVal)}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </div>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                    {/* 价格网格 */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                        <div className="text-[10px] text-slate-400">当前价</div>
                        <div className="text-white font-bold">{fmtPrice(rec.current_price)}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                        <div className="text-[10px] text-slate-400">止盈目标</div>
                        <div className="text-rose-400 font-bold">{fmtPrice(rec.target_price)}
                          <span className="text-[10px] text-slate-400 ml-1">(+{rec.win_threshold_pct}%)</span>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                        <div className="text-[10px] text-slate-400">止损价</div>
                        <div className="text-emerald-400 font-bold">{fmtPrice(rec.stop_loss_price)}
                          <span className="text-[10px] text-slate-400 ml-1">({rec.stop_loss_pct}%)</span>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                        <div className="text-[10px] text-slate-400">推荐有效期</div>
                        <div className="text-slate-200 font-bold">{rec.target_days}天</div>
                      </div>
                    </div>
                    {/* 推荐理由 */}
                    {rec.reason && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <span className="text-amber-400 font-medium">【推荐理由】</span> {rec.reason}
                      </p>
                    )}
                    {/* 退出信息 */}
                    {rec.exit_date && (
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                        <span>退出日: {rec.exit_date}</span>
                        <span>退出价: {fmtPrice(rec.exit_price)}</span>
                        <span>实际收益: <span className={rec.actual_return_pct != null && rec.actual_return_pct >= 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{fmt(rec.actual_return_pct)}</span></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 新增推荐提示 */}
      <div className="flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-700 text-xs text-slate-500 font-mono gap-1.5">
        <Plus className="w-3.5 h-3.5" />
        <span>金股推荐由量化信号引擎自动评分，高分信号可手动录入 POST /api-market/recommendations</span>
      </div>
    </div>
  );
}
