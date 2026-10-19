/**
 * 每个账户历史每日收益与公开账本明细表
 * 满足用户核心诉求：
 * - 每天收益率公开透明、逐日可查
 * - 当日盈亏金额明确展示
 * - 调仓记录与状态一目了然（买入、走弱卖出、强势留仓、空仓防守）
 */
"use client";

import { useState } from "react";
import { Table, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from "lucide-react";
import type { ArenaAccount } from "@/lib/quant-arena/types";

interface AccountDailyLedgerTableProps {
  account: ArenaAccount;
}

export function AccountDailyLedgerTable({ account }: AccountDailyLedgerTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rawCandles = account.candles ?? [];
  const candles = [...rawCandles].reverse(); // 最新日期排在最前

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  if (!candles.length) return null;

  // 默认显示前 7 天，展开后展示全部
  const displayRows = isExpanded ? candles : candles.slice(0, 7);

  return (
    <div className="rounded-2xl bg-[#091322]/90 border border-cyan-500/25 overflow-hidden shadow-lg space-y-0">
      {/* 头部标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/40 bg-black/20">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            {account.name} · 每日收益公开账本 (DAILY LEDGER)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            (共记录 {candles.length} 个交易日 · 每日收益金额透明核算)
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? "收起明细" : `展开全部 (${candles.length}天)`}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 表格主体 */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs font-mono text-slate-200 min-w-[700px]">
          <thead className="bg-[#0c1626] text-slate-400 text-[11px] border-b border-cyan-900/40">
            <tr>
              <th className="py-2.5 px-4 whitespace-nowrap">交易日期</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">当日收益率</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">当日盈亏(元)</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">账户总资产(元)</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">累计总收益</th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">沪深300同期</th>
              <th className="py-2.5 px-4 text-left whitespace-nowrap">当日操作与状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-950/50">
            {displayRows.map((c, index) => {
              // 计算当日相对前一日的收益率与盈亏金额
              const originalIndex = candles.length - 1 - index;
              const prevCandle = originalIndex > 0 ? rawCandles[originalIndex - 1] : null;

              const dayPnlPct = prevCandle
                ? parseFloat((c.close_pnl_pct - prevCandle.close_pnl_pct).toFixed(2))
                : c.close_pnl_pct;
              const dayPnlAmount = prevCandle
                ? Math.round(c.equity - prevCandle.equity)
                : Math.round(c.equity - 100000);

              const isDayUp = dayPnlPct >= 0;
              const isTotalUp = c.close_pnl_pct >= 0;
              const isBenchUp = (c.benchmark_pct ?? 0) >= 0;

              return (
                <tr key={c.date} className="hover:bg-cyan-950/25 transition-colors">
                  {/* 日期 */}
                  <td className="py-2.5 px-4 font-bold text-white whitespace-nowrap">
                    {c.date}
                  </td>

                  {/* 当日收益率 */}
                  <td className={`py-2.5 px-4 text-right font-bold whitespace-nowrap ${isDayUp ? "text-rose-400" : "text-emerald-400"}`}>
                    <div className="flex items-center justify-end gap-0.5">
                      {isDayUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{isDayUp ? `+${dayPnlPct.toFixed(2)}%` : `${dayPnlPct.toFixed(2)}%`}</span>
                    </div>
                  </td>

                  {/* 当日盈亏金额 */}
                  <td className={`py-2.5 px-4 text-right font-bold whitespace-nowrap ${dayPnlAmount >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {dayPnlAmount >= 0 ? `+¥${fmtMoney(dayPnlAmount)}` : `-¥${fmtMoney(Math.abs(dayPnlAmount))}`}
                  </td>

                  {/* 账户总资产 */}
                  <td className="py-2.5 px-4 text-right font-bold text-white whitespace-nowrap">
                    ¥{fmtMoney(c.equity)}
                  </td>

                  {/* 累计总收益 */}
                  <td className={`py-2.5 px-4 text-right font-medium whitespace-nowrap ${isTotalUp ? "text-rose-400" : "text-emerald-400"}`}>
                    {isTotalUp ? `+${c.close_pnl_pct.toFixed(2)}%` : `${c.close_pnl_pct.toFixed(2)}%`}
                  </td>

                  {/* 沪深300同期 */}
                  <td className={`py-2.5 px-4 text-right whitespace-nowrap ${isBenchUp ? "text-rose-300/80" : "text-emerald-300/80"}`}>
                    {c.benchmark_pct != null
                      ? (c.benchmark_pct >= 0 ? `+${c.benchmark_pct.toFixed(2)}%` : `${c.benchmark_pct.toFixed(2)}%`)
                      : "--"}
                  </td>

                  {/* 当日操作与状态 (紧扣强势就留，走弱就卖) */}
                  <td className="py-2.5 px-4 text-left whitespace-nowrap font-sans text-xs">
                    {c.events && c.events.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.events.map((ev, i) => (
                          <span
                            key={ev.id || i}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ev.type === "BUY"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            }`}
                            title={ev.reason}
                          >
                            {ev.type === "BUY" ? "🟢买入" : "🔴卖出"} {ev.stock_name} @¥{ev.price.toFixed(2)}
                            {ev.pnl_amount != null && ev.type !== "BUY" ? ` (盈亏${ev.pnl_amount >= 0 ? "+" : ""}¥${ev.pnl_amount})` : ""}
                          </span>
                        ))}
                      </div>
                    ) : c.close_pnl_pct !== 0 && c.equity > 100000 ? (
                      <span className="text-[11px] text-cyan-300/90 font-mono">
                        🔥 强势就留 · 持股坐轿主升中
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">
                        🛡️ 100%空仓观望避险
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
