/**
 * 每日交易日志面板组件
 * 展示当前选中策略账户的最新一日买卖记录 + 当日账户/板块/大盘收益对比
 */
"use client";

import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import type { ArenaAccount } from "@/lib/quant-arena/types";
import type { DailyPnlCandle, TradeEvent } from "@/lib/recommendations-db";

interface DailyTradeLogProps {
  account: ArenaAccount;
  benchmarkPct?: number; // 当日沪深300涨跌幅（来自arena API）
}

export function DailyTradeLog({ account, benchmarkPct }: DailyTradeLogProps) {
  const candles = account.candles ?? [];
  const latestCandle: DailyPnlCandle | undefined = candles[candles.length - 1];
  const todayDate = latestCandle?.date ?? "--";
  const todayReturn = latestCandle ? latestCandle.close_pnl_pct : 0;
  const prevReturn = candles.length >= 2 ? candles[candles.length - 2].close_pnl_pct : 0;
  // 当日账户涨跌幅 = close - prev_close（相对变化）
  const dailyAcctChangePct = candles.length >= 2
    ? parseFloat((todayReturn - prevReturn).toFixed(2))
    : account.today_pnl_pct;

  const benchPct = benchmarkPct ?? latestCandle?.benchmark_pct ?? 0;
  const alphaPct = parseFloat((dailyAcctChangePct - benchPct).toFixed(2));

  // 当日买卖事件
  const todayEvents: TradeEvent[] = latestCandle?.events ?? [];
  const buyEvents = todayEvents.filter(e => e.type === "BUY");
  const sellEvents = todayEvents.filter(e => e.type.includes("SELL"));

  const fmt = (n: number) => (n >= 0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`);
  const fmtMoney = (n: number) => new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2 }).format(n);

  const isAcctUp = dailyAcctChangePct >= 0;
  const isBenchUp = benchPct >= 0;
  const isAlphaUp = alphaPct >= 0;

  return (
    <div className="rounded-2xl bg-[#091322]/90 border border-cyan-500/20 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-900/40">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            DAILY LOG · 当日交易日志
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/10">
            {todayDate}
          </span>
        </div>
        {/* 三路收益对比 */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
          <span className={`flex items-center gap-0.5 font-bold ${isAcctUp ? "text-rose-400" : "text-emerald-400"}`}>
            {isAcctUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            账户 {fmt(dailyAcctChangePct)}
          </span>
          <span className="text-slate-600">|</span>
          <span className={`${isBenchUp ? "text-rose-300/70" : "text-emerald-300/70"}`}>
            沪深300 {fmt(benchPct)}
          </span>
          <span className="text-slate-600">|</span>
          <span className={`${isAlphaUp ? "text-cyan-400" : "text-amber-400"}`}>
            Alpha {fmt(alphaPct)}
          </span>
        </div>
      </div>

      {/* 移动端三路收益 */}
      <div className="sm:hidden flex items-center justify-around px-4 py-2 border-b border-cyan-900/30 text-[11px] font-mono">
        <span className={`font-bold ${isAcctUp ? "text-rose-400" : "text-emerald-400"}`}>
          账户 {fmt(dailyAcctChangePct)}
        </span>
        <span className={isBenchUp ? "text-rose-300/70" : "text-emerald-300/70"}>
          300 {fmt(benchPct)}
        </span>
        <span className={isAlphaUp ? "text-cyan-400" : "text-amber-400"}>
          α {fmt(alphaPct)}
        </span>
      </div>

      {/* 当日净值摘要 */}
      <div className="grid grid-cols-3 gap-0 divide-x divide-cyan-900/30 px-0 border-b border-cyan-900/30">
        <div className="px-4 py-2 text-center">
          <div className="text-[10px] text-slate-400 font-mono">当日盈亏（元）</div>
          <div className={`text-sm font-black font-mono ${account.today_pnl >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {account.today_pnl >= 0 ? "+" : ""}{fmtMoney(account.today_pnl)}
          </div>
        </div>
        <div className="px-4 py-2 text-center">
          <div className="text-[10px] text-slate-400 font-mono">当前净值</div>
          <div className="text-sm font-black text-white font-mono">¥{fmtMoney(account.total_equity)}</div>
        </div>
        <div className="px-4 py-2 text-center">
          <div className="text-[10px] text-slate-400 font-mono">累计收益</div>
          <div className={`text-sm font-black font-mono ${account.total_return_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {fmt(account.total_return_pct)}
          </div>
        </div>
      </div>

      {/* 当日操作记录 */}
      <div className="p-3">
        {todayEvents.length === 0 ? (
          <div className="py-3 text-center text-[11px] text-slate-500 font-mono">
            {account.positions.length === 0 ? "🛡️ 今日空仓休息，无交易操作" : "今日无买卖记录，继续持仓观察"}
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* 买入记录 */}
            {buyEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <span className="flex-shrink-0 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40">
                  买入
                </span>
                <TrendingUp className="w-3 h-3 text-rose-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white">{ev.stock_name}</span>
                  <span className="text-[10px] text-slate-400 ml-1 font-mono">{ev.stock_code}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300 flex-shrink-0">
                  <span>¥{ev.price.toFixed(2)}</span>
                  <span className="text-slate-500">×</span>
                  <span>{ev.shares}股</span>
                  <span className="text-rose-300 font-bold">¥{fmtMoney(ev.amount)}</span>
                </div>
              </div>
            ))}

            {/* 卖出记录 */}
            {sellEvents.map((ev) => {
              const pnlPct = ev.pnl_pct ?? 0;
              const isWin = pnlPct >= 0;
              return (
                <div key={ev.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="flex-shrink-0 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                    卖出
                  </span>
                  <TrendingDown className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white">{ev.stock_name}</span>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">{ev.stock_code}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono flex-shrink-0">
                    <span className="text-slate-300">¥{ev.price.toFixed(2)}</span>
                    <span className="text-slate-500">×</span>
                    <span className="text-slate-300">{ev.shares}股</span>
                    {ev.pnl_amount !== undefined && (
                      <span className={`font-bold ${isWin ? "text-rose-400" : "text-emerald-400"}`}>
                        {isWin ? "+" : ""}{fmtMoney(ev.pnl_amount ?? 0)}
                        <span className="text-[10px] ml-0.5 opacity-80">({isWin ? "+" : ""}{pnlPct.toFixed(2)}%)</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部持仓摘要 */}
      {account.positions.length > 0 && (
        <div className="px-3 pb-3">
          <div className="rounded-xl bg-black/30 border border-white/5 divide-y divide-white/5">
            {account.positions.map((pos) => {
              const posUp = pos.pnl_pct >= 0;
              return (
                <div key={pos.code} className="flex items-center justify-between px-3 py-1.5 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{pos.name}</span>
                    <span className="text-slate-500">{pos.code}</span>
                    <span className="text-slate-400 text-[10px]">×{pos.shares}股</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300">¥{(pos.current_price ?? pos.cost_price).toFixed(2)}</span>
                    <span className={`font-bold ${posUp ? "text-rose-400" : "text-emerald-400"}`}>
                      {posUp ? "+" : ""}{pos.pnl_pct.toFixed(2)}%
                    </span>
                    <span className={`text-[10px] ${posUp ? "text-rose-400/70" : "text-emerald-400/70"}`}>
                      ({posUp ? "+" : ""}{fmtMoney(pos.pnl)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
