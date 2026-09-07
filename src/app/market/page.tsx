"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
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
  Flame,
  Layers,
  PieChart,
  Plus,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { QuantumRadar3D } from "@/components/market/quantum-radar-3d";

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
    change?: number;
    change_pct: number;
    amount?: number;
    up_count?: number;
    down_count?: number;
    flat_count?: number;
  }>;
  total_turnover?: number;
  total_turnover_text?: string;
  up_count?: number;
  down_count?: number;
  flat_count?: number;
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
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "info" | "success" | "warning" } | null>(null);

  // 轻量级交互提示 Toast
  const showToast = useCallback((text: string, type: "info" | "success" | "warning" = "info") => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  }, []);

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
      const res = await fetch("/api-market/latest");
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
      const res = await fetch("/api-portfolio?userId=default_user");
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

  const loadAll = useCallback(async (manual = false) => {
    setIsRefreshing(true);
    if (manual) {
      showToast("正在拉取实时全市场分时与量能数据...", "info");
    }
    await Promise.all([fetchMarketData(), fetchPortfolioData()]);
    setIsLoading(false);
    setIsRefreshing(false);
    if (manual) {
      showToast("大盘数据与持仓诊断已同步更新！", "success");
    }
  }, [fetchMarketData, fetchPortfolioData, showToast]);

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

  // 唤起右下角 AI 助手直接进行全景量化推演
  const handleTriggerAiChat = useCallback(() => {
    const indicesText = (marketData?.indices || [])
      .map(idx => `${idx.name} (${idx.close.toFixed(2)}, ${idx.change_pct >= 0 ? "+" : ""}${idx.change_pct}%)`)
      .join("；");

    const holdingsText = holdings.length > 0
      ? holdings.map(h => `- ${h.name}(${h.code}): 持股${h.quantity}股, 成本¥${h.cost_price.toFixed(2)}, 现价¥${h.current_price.toFixed(2)}, 盈亏${h.pnl_pct.toFixed(2)}%, 建议操作:${h.action}, 动态止损线:¥${h.stop_loss_price.toFixed(2)} (${h.advice_reason || "系统监控中"})`).join("\n")
      : "暂未录入个股持仓（请先在持仓看板中录入标的）";

    const prompt = `请作为资深A股量化交易与风控大师，基于刚刚同步的盘面事实与我的持仓做一次深度量化推演：

【实时大盘事实】
- 市场综合评分: ${marketData?.market_score ?? 50} / 100 (${marketData?.market_state ?? "震荡"})
- 主导风格: ${marketData?.market_style ?? "科技成长"}
- 建议总仓位: ${marketData?.suggested_position ?? "30%~50%"}
- 四大核心股指: ${indicesText || "同步中"}
- 两市总成交量能: ${marketData?.total_turnover_text ?? "约1.95万亿"}
- 全市场涨跌家数比: 上涨 ${marketData?.up_count ?? 0} 家 / 下跌 ${marketData?.down_count ?? 0} 家 / 平盘 ${marketData?.flat_count ?? 0} 家

【我的私有持仓组合】
${holdingsText}

请直接为我输出：
1. 盘面多空格局与量能支撑评估（是否存在诱多/诱空或量价背离风险）
2. 针对我的每一笔持仓给出具体的买卖/止盈/止损应对策略及关键价位。
3. 接下来交易日的仓位管理与防守反击策略。`;

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("trigger-ai-chat", { detail: { prompt } }));
      showToast("已自动唤起右下角 AI 助手，正在全景推演交易策略...", "success");
    }
  }, [marketData, holdings, showToast]);

  // 添加持仓提交
  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stock_code) return;
    setFormSubmitting(true);
    try {
      const res = await fetch("/api-portfolio", {
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
        showToast("成功添加持仓标的！已自动发起盈亏与止损诊断推演", "success");
        await fetchPortfolioData();
      }
    } catch (err) {
      console.error("添加持仓失败:", err);
      showToast("添加持仓失败，请重试", "warning");
    } finally {
      setFormSubmitting(false);
    }
  };

  // 删除持仓
  const handleDeleteHolding = async (id?: number) => {
    if (!id) return;
    if (!confirm("确定要删除这笔持仓吗？")) return;
    try {
      const res = await fetch(`/api-portfolio?id=${id}&userId=default_user`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("已成功移除持仓记录", "info");
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative">
      {/* 全局交互反馈浮动 Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/95 border border-cyan-500/40 text-xs text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMsg.text}</span>
        </div>
      )}

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
              onClick={() => {
                const next = !autoRefresh;
                setAutoRefresh(next);
                showToast(next ? "已开启 5 分钟自动轮询，交易时段将自动同步全市场推演" : "已暂停 5 分钟自动轮询，您可随时手动刷新", "info");
              }}
              className={`text-xs font-medium px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                autoRefresh
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                  : "bg-slate-800/50 text-slate-400 border-slate-700/50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {autoRefresh ? "5分钟自动刷新已开启" : "自动刷新已暂停"}
            </button>

            <button
              onClick={() => loadAll(true)}
              disabled={isRefreshing}
              className="text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
              立即刷新
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              添加持仓
            </button>

            <button
              onClick={handleTriggerAiChat}
              className="text-xs font-medium px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer group"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              AI 助手推演
            </button>
          </div>
        </div>

        {/* 盘中大盘态势与决策卡 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 卡片 1: 市场评分卡 & 3D 量化全息能量核 */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                市场综合评分
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
                置信度: {marketData?.confidence || "high"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-white tracking-tight">
                  {marketData ? marketData.market_score : "--"}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
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

            {/* Three.js 3D 量化全息能量球 */}
            <QuantumRadar3D
              score={marketData?.market_score ?? 50}
              marketState={marketData?.market_state ?? "震荡蓄势"}
            />

            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
              <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-400">主导风格:</span>
              <span className="text-slate-200 font-medium truncate">
                {marketData?.market_style || "科技趋势"}
              </span>
            </p>
          </div>

          {/* 卡片 2: 建议总仓位 & 核心量能（两市总成交额） */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-cyan-400" />
                  建议总仓位
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  动态风控
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-cyan-400 tracking-tight">
                  {marketData?.suggested_position || "30%~50%"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {diagnoseSummary?.overall_action || "控制仓位，防守反击"}
              </p>
            </div>

            {/* 核心量能量化指标 */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  两市成交量能
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                  {(marketData?.total_turnover || 0) >= 15000
                    ? "巨量活跃"
                    : (marketData?.total_turnover || 0) >= 10000
                    ? "温和放量"
                    : "缩量整理"}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400 tracking-tight">
                  {marketData?.total_turnover_text || "1.95万亿"}
                </span>
                <span className="text-[10px] text-slate-500">沪深合计</span>
              </div>

              {/* 量能强度能量柱 */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-rose-500 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(15, ((marketData?.total_turnover || 15000) / 25000) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>存量线(1万亿)</span>
                <span>活跃线(1.5万亿)</span>
                <span>超强量能</span>
              </div>
            </div>
          </div>

          {/* 卡片 3 & 4: 四大核心股指分时看板 + 全市场多空博弈 (col-span-2) */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 md:col-span-2 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                四大核心股指分时全景
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                更新: {marketData?.snapshot_time || "--:--:--"}
              </span>
            </div>

            {/* 四大核心股指矩阵：上证指数、深证成指、创业板指、科创50 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(marketData?.indices || []).slice(0, 4).map((idx) => {
                const isUp = idx.change_pct >= 0;
                return (
                  <div
                    key={idx.code}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 truncate">
                        {idx.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{idx.code}</span>
                    </div>
                    <div className="text-base font-black text-white mt-1 font-mono">
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
                      <span>{idx.change_pct > 0 ? `+${idx.change_pct}%` : `${idx.change_pct}%`}</span>
                    </div>
                    {idx.amount ? (
                      <div className="text-[10px] text-slate-500 mt-1 truncate">
                        额: {Math.round(idx.amount / 1e8)}亿
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {(!marketData || !marketData.indices || marketData.indices.length === 0) && (
                <div className="col-span-4 text-center py-6 text-xs text-slate-500">
                  正在同步四大核心股指分时...
                </div>
              )}
            </div>

            {/* 全市场多空博弈条 */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-cyan-400" />
                  全市场涨跌分布
                </span>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-rose-400 font-semibold">
                    涨: {marketData?.up_count ?? 3073}
                  </span>
                  <span className="text-slate-400">
                    平: {marketData?.flat_count ?? 195}
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    跌: {marketData?.down_count ?? 2016}
                  </span>
                </div>
              </div>

              {/* 多空力量双色比例条 */}
              {(() => {
                const up = marketData?.up_count ?? 3073;
                const down = marketData?.down_count ?? 2016;
                const flat = marketData?.flat_count ?? 195;
                const total = up + down + flat || 1;
                const upPct = ((up / total) * 100).toFixed(1);
                const downPct = ((down / total) * 100).toFixed(1);
                return (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-800 rounded-full h-2 flex overflow-hidden">
                      <div
                        className="bg-rose-500 transition-all duration-500"
                        style={{ width: `${upPct}%` }}
                        title={`上涨家数占比: ${upPct}%`}
                      />
                      <div
                        className="bg-slate-600 transition-all duration-500"
                        style={{ width: `${((flat / total) * 100).toFixed(1)}%` }}
                      />
                      <div
                        className="bg-emerald-500 transition-all duration-500"
                        style={{ width: `${downPct}%` }}
                        title={`下跌家数占比: ${downPct}%`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span className="text-rose-400">多头上涨 {upPct}%</span>
                      <span className="text-emerald-400">空头下跌 {downPct}%</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span className="text-[11px]">全A量化决策引擎：正常推演</span>
                <button
                  onClick={() => setShowCardText(!showCardText)}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {showCardText ? "折叠终端决策卡" : "查看完整决策卡"}
                  {showCardText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
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
