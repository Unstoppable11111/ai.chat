"use client";

import { useEffect, useState } from "react";
import {
  Award,
  TrendingUp,
  Target,
  Plus,
  Clock,
  Sparkles,
  BarChart2,
  Percent,
  ShieldCheck,
  Ban,
} from "lucide-react";
import {
  StockRecommendation,
  WinRateStats,
  PaperAccount,
  DailyPnlCandle,
  TradeEvent,
  AccountStyle,
} from "@/lib/recommendations-db";
import { PnlKlineChart } from "@/components/market/pnl-kline-chart";

interface StockSignalsViewProps {
  onAddToPortfolio?: (stock: { code: string; name: string; price: number }) => void;
  showToast?: (text: string, type?: "info" | "success" | "warning") => void;
}

export function StockSignalsView({ onAddToPortfolio, showToast }: StockSignalsViewProps) {
  const [activeAccountStyle, setActiveAccountStyle] = useState<AccountStyle>("aggressive");
  const [accounts, setAccounts] = useState<PaperAccount[]>([]);
  const [todayPicks, setTodayPicks] = useState<StockRecommendation[]>([]);
  const [history, setHistory] = useState<StockRecommendation[]>([]);
  const [stats, setStats] = useState<WinRateStats | null>(null);
  const [paperAccount, setPaperAccount] = useState<PaperAccount | undefined>();
  const [pnlKline, setPnlKline] = useState<DailyPnlCandle[]>([]);
  const [tradeEvents, setTradeEvents] = useState<TradeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCode, setAddingCode] = useState<string | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    fetch(`/api-market/signals?account=${activeAccountStyle}`, {signal:abort.signal})
      .then(async response => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
      .then(json => {
        if (abort.signal.aborted || !json.success) return;
        setTodayPicks(json.today_picks || []);
        setHistory(json.history || []);
        setStats(json.stats || null);
        setPaperAccount(json.paper_account);
        setAccounts(json.accounts || []);
        setPnlKline(json.pnl_kline || []);
        setTradeEvents(json.trade_events || []);
      }).catch(() => {}).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [activeAccountStyle]);

  const handleSelectAccount = (style: AccountStyle) => {
    setActiveAccountStyle(style);
    setLoading(true);
  };

  const handleQuickAdd = async (pick: StockRecommendation) => {
    setAddingCode(pick.stock_code);
    try {
      if (onAddToPortfolio) {
        onAddToPortfolio({
          code: pick.stock_code,
          name: pick.stock_name,
          price: pick.entry_price,
        });
      } else {
        const res = await fetch("/api-portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "default_user",
            stock_code: pick.stock_code,
            stock_name: pick.stock_name,
            quantity: 1000,
            cost_price: pick.entry_price,
            hold_type: pick.category.includes("中军") ? "core" : "attack",
            notes: `量化精选推荐入选，理由: ${pick.reason}`,
          }),
        });
        if (res.ok) {
          showToast?.(`已将 ${pick.stock_name} 自动同步至我的私有持仓！`, "success");
        }
      }
    } catch {
      showToast?.("添加持仓失败，请稍后再试", "warning");
    } finally {
      setAddingCode(null);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-cyan-400/80 space-y-3">
        <Sparkles className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
        <p className="text-sm font-medium">正在计算多因子量化评分、模拟盘资产与日K盈亏走势...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. 模拟盘资产 HUD 与收益率日 K 线走势图 (三大风格账户体系，从昨天 2026-09-07 建仓启动) */}
      <PnlKlineChart
        account={paperAccount}
        accounts={accounts}
        activeAccountId={activeAccountStyle}
        onSelectAccount={handleSelectAccount}
        pnlKline={pnlKline}
        events={tradeEvents}
      />

      {/* 2. 量化模型策略胜率与战绩面板 */}
      <div className="p-6 rounded-3xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              量化多因子选股策略战绩与历史胜率
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              严格执行“不买ST、不买科创板”选股纪律，跟踪入选后 T+1 至 T+5 真实走势与目标达标率
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              动态回测核验 · 自动止盈止损
            </span>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#0f1d35]/70 border border-cyan-500/20">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
                策略综合胜率
              </div>
              <div className="text-3xl font-black text-cyan-400 font-mono mt-1">
                {stats.win_rate}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                已结项胜率 (目标止盈 / 总结项)
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1d35]/70 border border-cyan-500/20">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                综合盈亏比
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                {stats.profit_loss_ratio} : 1
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                平均盈利幅 / 平均止损幅
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1d35]/70 border border-cyan-500/20">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                平均持仓收益率
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                +{stats.avg_return_pct}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                单笔推荐最高收益: +{stats.max_return_pct}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1d35]/70 border border-cyan-500/20">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                样本跟踪规模
              </div>
              <div className="text-3xl font-black text-white font-mono mt-1">
                {stats.total_signals} <span className="text-sm font-normal text-slate-400">只</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {stats.win_count} 胜出 ｜ {stats.loss_count} 止损 ｜ {stats.holding_count} 观察中
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. 今日量化精选个股池 */}
      <div className="p-6 rounded-3xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              今日量化精选个股池
              <span className="text-xs font-normal text-slate-400">
                ({todayPicks.length} 只主板/创业板标的入选)
              </span>
            </h3>
            <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              无ST · 无科创板
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            更新: 今日盘前 09:15 · 5分钟联动
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {todayPicks.map((pick) => (
            <div
              key={pick.stock_code}
              className="p-5 rounded-2xl bg-[#0f1d35]/70 border border-cyan-500/20 hover:border-cyan-400/50 transition-all flex flex-col justify-between space-y-3.5 group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{pick.stock_name}</span>
                    <span className="text-xs font-mono text-cyan-400 font-semibold">{pick.stock_code}</span>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {pick.category}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">入选参考价</span>
                    <div className="text-xl font-black text-white font-mono">¥ {pick.entry_price.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">量化评分</span>
                    <div className="text-xl font-black text-cyan-400 font-mono">{pick.score}</div>
                  </div>
                </div>

                {/* 目标与止损防守 */}
                <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-[#091220] border border-cyan-950 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px]">预期第一目标:</span>
                    <div className="text-rose-400 font-bold">¥ {pick.target_price.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">动态防守线:</span>
                    <div className="text-amber-400 font-bold">¥ {pick.stop_loss_price.toFixed(2)}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed line-clamp-2">
                  {pick.reason}
                </p>
              </div>

              <button
                onClick={() => handleQuickAdd(pick)}
                disabled={addingCode === pick.stock_code}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <Plus className="w-3.5 h-3.5" />
                {addingCode === pick.stock_code ? "正在同步..." : "一键加入我的持仓"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 历史推荐记录与实盘胜率核验表 */}
      <div className="p-6 rounded-3xl bg-[#0c1626]/80 border border-cyan-500/20 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            历史推荐表现与真实收益核验
          </h3>
          <span className="text-xs text-slate-400">全流程可回溯验证</span>
        </div>

        {/* 桌面端表格 */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs text-slate-200 min-w-[800px] whitespace-nowrap">
            <thead className="bg-[#0e1a2f]/80 text-slate-400 font-semibold border-b border-cyan-900/40">
              <tr>
                <th className="py-3 px-4 rounded-l-xl whitespace-nowrap">推荐日期</th>
                <th className="py-3 px-4 whitespace-nowrap">标的代码/名称</th>
                <th className="py-3 px-4 whitespace-nowrap">策略分类</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">入选价</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">最新现价</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">T+1 收益</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">T+3 收益</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">T+5 最高涨幅</th>
                <th className="py-3 px-4 rounded-r-xl text-center whitespace-nowrap">状态定性</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950/60">
              {history.map((rec) => (
                <tr key={rec.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">{rec.recommend_date}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="font-mono text-cyan-400 font-semibold">{rec.stock_code}</span>
                      <span className="text-white font-bold whitespace-nowrap">{rec.stock_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{rec.category}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300 whitespace-nowrap">¥ {rec.entry_price.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white whitespace-nowrap">¥ {rec.current_price.toFixed(2)}</td>
                  <td className={`py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap ${rec.t1_return >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {rec.t1_return > 0 ? `+${rec.t1_return}%` : `${rec.t1_return}%`}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap ${rec.t3_return >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {rec.t3_return > 0 ? `+${rec.t3_return}%` : `${rec.t3_return}%`}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-rose-400 whitespace-nowrap">
                    +{rec.t5_max_return}%
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border whitespace-nowrap ${
                        rec.status === "win"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : rec.status === "stopped"
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                          : "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                      }`}
                    >
                      {rec.status === "win" ? "🎯 目标止盈" : rec.status === "stopped" ? "🛑 止损防守" : "⏳ 观察中"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 移动端卡片自适应列表 */}
        <div className="md:hidden space-y-3">
          {history.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-[#0f1d35]/70 border border-cyan-500/20 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">{rec.stock_name}</span>
                  <span className="text-xs font-mono text-cyan-400">{rec.stock_code}</span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-lg border font-bold ${
                    rec.status === "win"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : rec.status === "stopped"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                      : "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                  }`}
                >
                  {rec.status === "win" ? "🎯 目标止盈" : rec.status === "stopped" ? "🛑 止损防守" : "⏳ 观察中"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                <div>
                  <span className="text-slate-400 text-[10px]">入选价</span>
                  <div className="text-slate-200">¥ {rec.entry_price.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">现价</span>
                  <div className="text-white font-bold">¥ {rec.current_price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px]">T+5最高</span>
                  <div className="text-rose-400 font-black">+{rec.t5_max_return}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
