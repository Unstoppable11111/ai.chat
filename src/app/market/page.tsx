"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  PieChart,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sliders,
  Trash2,
  TrendingUp,
} from "lucide-react";

interface HoldingDiagnosed {
  id?: number;
  code: string;
  name: string;
  quantity: number;
  cost_price: number;
  current_price: number;
  market_value: number;
  pnl: number;
  pnl_pct: number;
  day_change_pct: number;
  hold_type: string;
  stop_loss_price: number;
  action: string;
  advice_reason: string;
  risk_level: string;
  notes?: string;
}

interface PortfolioSummary {
  total_market_value: number;
  total_cost: number;
  total_pnl: number;
  total_pnl_pct: number;
  holdings_count: number;
  market_state: string;
  overall_action: string;
  diagnose_time: string;
}

interface MarketSnapshot {
  market_date: string;
  snapshot_time: string;
  market_score: number;
  market_state: string;
  market_style: string;
  suggested_position: string;
  confidence: string;
  indices: Array<{
    code: string;
    name: string;
    close: number;
    change_pct: number;
    amount?: number;
  }>;
  decision_card_text?: string;
  last_updated: string;
}

export default function MarketDashboardPage() {
  const [marketData, setMarketData] = useState<MarketSnapshot | null>(null);
  const [diagnoseSummary, setDiagnoseSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<HoldingDiagnosed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCardText, setShowCardText] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 表单状态
  const [formData, setFormData] = useState({
    stock_code: "",
    stock_name: "",
    quantity: "1000",
    cost_price: "",
    hold_type: "core",
    notes: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // 拉取市场最新 5 分钟快照
  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch("/api/market/latest");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMarketData(json);
        }
      }
    } catch (err) {
      console.error("加载大盘数据失败:", err);
    }
  }, []);

  // 拉取私人持仓与诊断推演
  const fetchPortfolioData = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio?userId=default_user");
      if (res.ok) {
        const json = await res.json();
        if (json.diagnose) {
          setDiagnoseSummary(json.diagnose.summary);
          setHoldings(json.diagnose.diagnosed_holdings || []);
        } else if (json.raw_holdings) {
          // 降级使用 raw_holdings
          setHoldings(
            json.raw_holdings.map((h: { stock_code: string; stock_name: string; cost_price: number; quantity: number; hold_type?: string }) => ({
              ...h,
              code: h.stock_code,
              name: h.stock_name,
              current_price: h.cost_price,
              market_value: h.quantity * h.cost_price,
              pnl: 0,
              pnl_pct: 0,
              day_change_pct: 0,
              hold_type: h.hold_type || "core",
              stop_loss_price: h.cost_price * 0.92,
              action: "数据同步中",
              advice_reason: "等待量化服务连接计算...",
              risk_level: "未知",
            }))
          );
        }
      }
    } catch (err) {
      console.error("加载持仓数据失败:", err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchMarketData(), fetchPortfolioData()]);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [fetchMarketData, fetchPortfolioData]);

  // 初次加载与 5 分钟自动轮询
  useEffect(() => {
    let ignore = false;
    async function initFetch() {
      await Promise.all([fetchMarketData(), fetchPortfolioData()]);
      if (!ignore) {
        setIsLoading(false);
      }
    }
    initFetch();

    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchMarketData();
      fetchPortfolioData();
    }, 300000); // 300秒 = 5分钟

    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [fetchMarketData, fetchPortfolioData, autoRefresh]);

  // 添加持仓提交
  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stock_code) return;
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "default_user",
          stock_code: formData.stock_code,
          stock_name: formData.stock_name,
          quantity: parseInt(formData.quantity, 10) || 100,
          cost_price: parseFloat(formData.cost_price) || 0,
          hold_type: formData.hold_type,
          notes: formData.notes,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          stock_code: "",
          stock_name: "",
          quantity: "1000",
          cost_price: "",
          hold_type: "core",
          notes: "",
        });
        await fetchPortfolioData();
      }
    } catch (err) {
      console.error("添加持仓失败:", err);
    } finally {
      setFormSubmitting(false);
    }
  };

  // 删除持仓
  const handleDeleteHolding = async (id?: number) => {
    if (!id) return;
    if (!confirm("确定要删除这笔持仓吗？")) return;
    try {
      const res = await fetch(`/api/portfolio?id=${id}&userId=default_user`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchPortfolioData();
      }
    } catch (err) {
      console.error("删除持仓失败:", err);
    }
  };

  // 格式化金额显示
  const formatMoney = (num: number) => {
    return new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // 操作建议的徽章颜色
  const getActionBadgeClass = (action: string) => {
    if (action.includes("止损")) return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    if (action.includes("减仓")) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (action.includes("止盈")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (action.includes("持有")) return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 顶部标题与控制器 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Activity className="h-5 w-5 animate-pulse" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  A股量化交易决策工作台
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    V3.0 实时版
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  工作日交易时段每 5 分钟自动推演大盘态势 ｜ 结合私有持仓做个性化止盈止损风控
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs font-medium px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                autoRefresh
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  : "bg-slate-800/50 text-slate-400 border-slate-700/50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {autoRefresh ? "5分钟自动刷新已开启" : "自动刷新已暂停"}
            </button>

            <button
              onClick={loadAll}
              disabled={isRefreshing}
              className="text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              立即刷新
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              添加持仓
            </button>

            <Link
              href="/chat?prompt=请结合当前大盘推演与我的最新持仓，提供一份详细的盘中交易风控建议。"
              className="text-xs font-medium px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              AI 助手推演
            </Link>
          </div>
        </div>

        {/* 盘中大盘态势与决策卡 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 市场评分卡 */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">市场综合评分</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                置信度: {marketData?.confidence || "high"}
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-3">
              <span className="text-4xl font-black text-white tracking-tight">
                {marketData ? marketData.market_score : "--"}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
              <span
                className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  (marketData?.market_score || 50) >= 60
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : (marketData?.market_score || 50) >= 40
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                }`}
              >
                {marketData?.market_state || "分析中"}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              主导风格: <span className="text-slate-200">{marketData?.market_style || "科技趋势"}</span>
            </p>
          </div>

          {/* 仓位建议卡 */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">建议总仓位</span>
              <span className="text-cyan-400">
                <PieChart className="w-4 h-4" />
              </span>
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-cyan-400 tracking-tight">
                {marketData?.suggested_position || "30%~50%"}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {diagnoseSummary?.overall_action || "根据大盘与个股联动执行风控"}
            </p>
          </div>

          {/* 指数行情快速看板 */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 md:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">三大核心股指分时</span>
              <span className="text-[10px] text-slate-500">
                更新: {marketData?.snapshot_time || "--:--:--"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 my-2">
              {(marketData?.indices || []).map((idx) => {
                const isUp = idx.change_pct >= 0;
                return (
                  <div
                    key={idx.code}
                    className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800"
                  >
                    <div className="text-xs font-medium text-slate-300 truncate">{idx.name}</div>
                    <div className="text-sm font-bold text-white mt-1">
                      {idx.close.toFixed(2)}
                    </div>
                    <div
                      className={`text-xs font-semibold flex items-center gap-0.5 mt-0.5 ${
                        isUp ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isUp ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {idx.change_pct > 0 ? `+${idx.change_pct}%` : `${idx.change_pct}%`}
                    </div>
                  </div>
                );
              })}
              {(!marketData || !marketData.indices || marketData.indices.length === 0) && (
                <div className="col-span-3 text-center py-4 text-xs text-slate-500">
                  等待盘中指数行情就绪...
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>全A决策推演状态：正常</span>
              <button
                onClick={() => setShowCardText(!showCardText)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                {showCardText ? "折叠终端决策卡" : "查看完整决策卡"}
                {showCardText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 展开的 ASCII 决策卡视窗 */}
        {showCardText && marketData?.decision_card_text && (
          <div className="p-5 rounded-2xl bg-black/90 border border-cyan-500/30 font-mono text-xs text-cyan-300 overflow-x-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/20 text-slate-400">
              <span className="flex items-center gap-2 text-cyan-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                后台 5 分钟盘中推演决策底稿
              </span>
              <span>数据时间: {marketData.last_updated}</span>
            </div>
            <pre className="leading-relaxed whitespace-pre font-mono">
              {marketData.decision_card_text}
            </pre>
          </div>
        )}

        {/* 用户私人持仓总览卡片 */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                我的私有持仓组合
                <span className="text-xs font-normal text-slate-400">
                  (已收录 {holdings.length} 只标的)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                结合量化系统实时行情进行盈亏追踪，每一笔持仓均附带动态止损线与风控决策指令
              </p>
            </div>

            {diagnoseSummary && (
              <div className="flex items-center gap-4 bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700/60">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">总持仓市值</div>
                  <div className="text-sm font-bold text-white">
                    ¥ {formatMoney(diagnoseSummary.total_market_value)}
                  </div>
                </div>
                <div className="h-6 w-[1px] bg-slate-700" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">累计浮动盈亏</div>
                  <div
                    className={`text-sm font-bold ${
                      diagnoseSummary.total_pnl >= 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {diagnoseSummary.total_pnl >= 0 ? "+" : ""}
                    {formatMoney(diagnoseSummary.total_pnl)} ({diagnoseSummary.total_pnl_pct.toFixed(2)}%)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 持仓列表表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">标的代码/名称</th>
                  <th className="py-3 px-4">仓位类别</th>
                  <th className="py-3 px-4 text-right">持股数</th>
                  <th className="py-3 px-4 text-right">成本价</th>
                  <th className="py-3 px-4 text-right">当前现价</th>
                  <th className="py-3 px-4 text-right">浮动盈亏</th>
                  <th className="py-3 px-4 text-right">动态止损线</th>
                  <th className="py-3 px-4 text-center">系统操作建议</th>
                  <th className="py-3 px-4 rounded-r-xl text-center">管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {holdings.map((item) => {
                  const isProfit = item.pnl >= 0;
                  return (
                    <tr
                      key={item.id || item.code}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-semibold">{item.code}</span>
                          <span className="text-white font-bold">{item.name}</span>
                          {item.day_change_pct !== 0 && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                item.day_change_pct > 0
                                  ? "bg-rose-500/10 text-rose-400"
                                  : "bg-emerald-500/10 text-emerald-400"
                              }`}
                            >
                              {item.day_change_pct > 0 ? "+" : ""}
                              {item.day_change_pct}%
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                            {item.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] border border-slate-700/50">
                          {item.hold_type === "core"
                            ? "核心底仓"
                            : item.hold_type === "attack"
                            ? "短线进攻"
                            : item.hold_type === "trend"
                            ? "趋势持股"
                            : "试错仓位"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                        {item.quantity}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                        ¥ {item.cost_price.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ¥ {item.current_price.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <span
                          className={`font-bold ${
                            isProfit ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {isProfit ? "+" : ""}
                          {item.pnl.toFixed(2)}
                        </span>
                        <div
                          className={`text-[10px] ${
                            isProfit ? "text-rose-400/80" : "text-emerald-400/80"
                          }`}
                        >
                          {isProfit ? "+" : ""}
                          {item.pnl_pct.toFixed(2)}%
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-amber-400/90 font-medium">
                        ¥ {item.stop_loss_price.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getActionBadgeClass(
                              item.action
                            )}`}
                          >
                            {item.action}
                          </span>
                          {item.advice_reason && (
                            <span className="text-[10px] text-slate-400 max-w-[180px] truncate" title={item.advice_reason}>
                              {item.advice_reason}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteHolding(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="删除此持仓"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {holdings.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-500 space-y-3">
                      <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
                      <p>当前持仓列表为空</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="text-xs px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                      >
                        立即添加第一只持仓标的
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 手动添加持仓弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                手动录入持仓标的
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHolding} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">股票代码 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 600584"
                  maxLength={6}
                  value={formData.stock_code}
                  onChange={(e) => setFormData({ ...formData, stock_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">股票名称 (可选，留空自动拉取)</label>
                <input
                  type="text"
                  placeholder="例如: 长电科技"
                  value={formData.stock_name}
                  onChange={(e) => setFormData({ ...formData, stock_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">持股数量 (股) *</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">买入成本价 (元) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="72.50"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">仓位类别</label>
                <select
                  value={formData.hold_type}
                  onChange={(e) => setFormData({ ...formData, hold_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="core">核心底仓（主线核心中军）</option>
                  <option value="trend">趋势持股（中线波段持仓）</option>
                  <option value="attack">短线进攻（高赔率突破）</option>
                  <option value="trial">试错观察（轻仓侦察）</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">交易笔记 / 逻辑归因</label>
                <input
                  type="text"
                  placeholder="例如: 半导体龙头，回踩20日均线低吸"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {formSubmitting ? "保存中..." : "保存持仓并推演"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
