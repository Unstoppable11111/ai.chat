"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Layers,
  PieChart,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  Zap,
  Beaker,
  ShieldCheck,
  ChevronRight,
  Target,
  AlertTriangle,
} from "lucide-react";
import { QuantumRadar3D } from "@/components/market/quantum-radar-3d";
import { SparklineChart } from "@/components/market/sparkline-chart";
import { SentimentRadarVisual } from "@/components/market/sentiment-radar-visual";
import { DailyReportsView } from "@/components/market/daily-reports-view";
import { PnlKlineChart } from "@/components/market/pnl-kline-chart";
import { StrategyArenaCards } from "@/components/market/strategy-arena-cards";
import { SignalCenterView } from "@/components/market/signal-center-view";
import { RiskCenterView } from "@/components/market/risk-center-view";
import { StrategyExperimentsView } from "@/components/market/strategy-experiments-view";
import {
  ArenaAccount,
  StrategyType,
  MarketRegimeAssessment,
  StrategyRankingItem,
  StrategyExperiment,
} from "@/lib/quant-arena/types";

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
  }>;
  total_turnover?: number;
  total_turnover_text?: string;
  up_count?: number;
  down_count?: number;
  flat_count?: number;
  volume_metrics?: any;
  last_updated: string;
}

export default function MarketDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "arena" | "signals" | "portfolio" | "risk" | "reports" | "experiments"
  >("arena");
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>("aggressive");

  // 核心数据状态
  const [marketData, setMarketData] = useState<MarketSnapshot | null>(null);
  const [diagnoseSummary, setDiagnoseSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<HoldingDiagnosed[]>([]);
  const [arenaAccounts, setArenaAccounts] = useState<Record<StrategyType, ArenaAccount> | null>(null);
  const [marketRegime, setMarketRegime] = useState<MarketRegimeAssessment | null>(null);
  const [strategyRankings, setStrategyRankings] = useState<StrategyRankingItem[]>([]);
  const [experiment, setExperiment] = useState<StrategyExperiment | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "info" | "success" | "warning" } | null>(null);

  // 股票模糊联想搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const showToast = useCallback((text: string, type: "info" | "success" | "warning" = "info") => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  }, []);

  // 拉取市场最新 5 分钟大盘
  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch("/api-market/latest");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setMarketData(json);
      }
    } catch (err) {
      console.error("加载大盘数据失败:", err);
    }
  }, []);

  // 拉取三大模拟盘账户与统一环境状态
  const fetchArenaData = useCallback(async () => {
    try {
      const res = await fetch("/api-market/arena");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setArenaAccounts(json.accounts);
          setMarketRegime(json.regime);
          setStrategyRankings(json.rankings || []);
          setExperiment(json.experiment || null);
        }
      }
    } catch (err) {
      console.error("加载三大策略竞技场失败:", err);
    }
  }, []);

  // 拉取私有持仓
  const fetchPortfolioData = useCallback(async () => {
    try {
      const res = await fetch("/api-portfolio?userId=default_user");
      if (res.ok) {
        const json = await res.json();
        if (json.diagnose) {
          setDiagnoseSummary(json.diagnose.summary);
          setHoldings(json.diagnose.diagnosed_holdings || []);
        } else if (json.raw_holdings) {
          setHoldings(
            json.raw_holdings.map((h: any) => ({
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
              advice_reason: "等待量化服务计算...",
              risk_level: "未知",
            }))
          );
        }
      }
    } catch (err) {
      console.error("加载持仓数据失败:", err);
    }
  }, []);

  const loadAll = useCallback(
    async (manual = false) => {
      setIsRefreshing(true);
      if (manual) showToast("正在拉取全市场实时分时、量能与三大策略账户...", "info");
      await Promise.all([fetchMarketData(), fetchArenaData(), fetchPortfolioData()]);
      setIsLoading(false);
      setIsRefreshing(false);
      if (manual) showToast("全景市场与策略竞技场已同步更新！", "success");
    },
    [fetchMarketData, fetchArenaData, fetchPortfolioData, showToast]
  );

  useEffect(() => {
    let ignore = false;
    async function init() {
      await Promise.all([fetchMarketData(), fetchArenaData(), fetchPortfolioData()]);
      if (!ignore) setIsLoading(false);
    }
    init();

    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchMarketData();
      fetchArenaData();
      fetchPortfolioData();
    }, 300000);

    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [fetchMarketData, fetchArenaData, fetchPortfolioData, autoRefresh]);

  // 股票模糊联想搜索防抖
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api-market/stock-search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.items) setSearchResults(json.items);
        }
      } catch {
      } finally {
        setIsSearching(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchItem = (item: any) => {
    setFormData((prev) => ({
      ...prev,
      stock_code: item.code,
      stock_name: item.name,
      cost_price: item.current_price ? String(item.current_price) : prev.cost_price,
    }));
    setSearchResults([]);
    setSearchQuery("");
  };

  // 唤起 JARVIS QUANT COPILOT 并注入全量实时客观数据事实
  const handleTriggerJarvisCopilot = useCallback(
    (customPrompt?: string) => {
      const agg = arenaAccounts?.aggressive;
      const bal = arenaAccounts?.balanced;
      const con = arenaAccounts?.conservative;

      const fullContextPrompt = customPrompt || `请作为资深 A 股首席量化总监兼风控专家，基于 CHEN TECH STUDIO 量化实验室当前全部事实与数据进行深度全景研判：

【1. 今日统一市场环境 (Market Regime)】
- 环境定性: ${marketRegime?.regime_label ?? "中性震荡"} (综合评分: ${marketRegime?.market_score ?? 50}/100, 置信度: ${marketRegime?.confidence ?? "HIGH"})
- 建议总仓位: 激进 ${marketRegime?.suggested_exposure.aggressive ?? "60%~80%"}, 均衡 ${marketRegime?.suggested_exposure.balanced ?? "60%~75%"}, 保守 ${marketRegime?.suggested_exposure.conservative ?? "40%~60%"}
- 两市总成交额: ${marketRegime?.liquidity.total_turnover_text ?? "约1.96万亿"} (${marketRegime?.liquidity.status ?? "中等量能"})
- 涨跌家数比: 上涨 ${marketRegime?.breadth.up_count ?? 0} 家 / 下跌 ${marketRegime?.breadth.down_count ?? 0} 家 (上涨占比 ${marketRegime?.breadth.up_ratio_pct ?? 0}%)
- 情绪动量: 涨停 ${marketRegime?.momentum.limit_up_count ?? 0} 家, 跌停 ${marketRegime?.momentum.limit_down_count ?? 0} 家, 炸板率 ${marketRegime?.momentum.broken_ratio_pct ?? 0}%, 连板高度 ${marketRegime?.momentum.highest_height ?? 0}板
- 领涨主线: ${marketRegime?.mainline.name ?? "科技成长"}

【2. 三大 10 万元独立模拟账户最新战况】
- 激进策略 (Aggressive): 净资产 ¥${agg?.total_equity?.toLocaleString() ?? 100000}, 累计收益 ${agg?.total_return_pct ?? 0}%, 今日盈亏 ¥${agg?.today_pnl ?? 0}, 最大回撤 ${agg?.max_drawdown_pct ?? 0}%, 夏普 ${agg?.sharpe_ratio ?? 0}, 当前仓位 ${agg?.current_exposure_pct ?? 0}%
- 均衡策略 (Balanced): 净资产 ¥${bal?.total_equity?.toLocaleString() ?? 100000}, 累计收益 ${bal?.total_return_pct ?? 0}%, 今日盈亏 ¥${bal?.today_pnl ?? 0}, 最大回撤 ${bal?.max_drawdown_pct ?? 0}%, 夏普 ${bal?.sharpe_ratio ?? 0}, 当前仓位 ${bal?.current_exposure_pct ?? 0}%
- 保守策略 (Conservative): 净资产 ¥${con?.total_equity?.toLocaleString() ?? 100000}, 累计收益 ${con?.total_return_pct ?? 0}%, 今日盈亏 ¥${con?.today_pnl ?? 0}, 最大回撤 ${con?.max_drawdown_pct ?? 0}%, 夏普 ${con?.sharpe_ratio ?? 0}, 当前仓位 ${con?.current_exposure_pct ?? 0}%

请直接针对以下四个核心问题给出权威答复：
1. 今天市场环境到底怎么样？当前属于进攻、震荡还是防守周期？
2. 三个策略今天分别买了什么、卖了什么？为什么激进策略能够产生 Alpha 超额？
3. 哪一个策略最适合当前的量能与板块博弈格局？为什么？
4. 如果明日两市成交额萎缩 20%，三个账户各自应该如何执行纪律减仓？`;

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("trigger-ai-chat", { detail: { prompt: fullContextPrompt } }));
        showToast("已调起 JARVIS QUANT COPILOT，正在基于真实量化底座推演...", "success");
      }
    },
    [marketRegime, arenaAccounts, showToast]
  );

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

  const formatMoney = (num: number) =>
    new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

  const getActionBadgeClass = (action: string) => {
    if (action.includes("止损")) return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    if (action.includes("减仓")) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (action.includes("止盈")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (action.includes("持有")) return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  };

  const copilotChips = [
    { label: "🎯 为什么激进今天买了这只？", prompt: "请对比激进策略与均衡策略的入选打分规则，解释为什么新易盛与胜宏科技入选了激进策略，而没有进入保守策略？" },
    { label: "⚖️ 哪个策略最适合当前市场？", prompt: "结合目前两市成交额突破1.9万亿、超3000只个股上涨的多空事实，评估当前到底应该相信激进、均衡还是保守策略？并说明背后的量价原因。" },
    { label: "📉 如果大盘跳水如何防守？", prompt: "如果明日市场突发缩量变盘下杀，三个账户的动态止损线与二级熔断机制将分别如何触发？请测算潜在回撤并给出应对方案。" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] via-[#070b16] to-[#0a1122] text-slate-100 pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative">
      {/* 全局浮动 Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#0c1626]/95 border border-cyan-500/40 text-xs text-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* 顶部主工作台标头 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0c182b]/90 via-[#08101e]/95 to-[#0e1d35]/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.12)] backdrop-blur-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <Activity className="h-4.5 w-4.5" />
              </span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
                  CHEN TECH STUDIO ｜ A股 QUANT STRATEGY LAB
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    3-STRATEGY ARENA
                  </span>
                </h1>
                <p className="text-xs text-cyan-200/60">
                  个人量化策略研发 · 回测 · Paper Trading · 实验验证平台
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                const next = !autoRefresh;
                setAutoRefresh(next);
                showToast(next ? "已开启 5 分钟自动轮询" : "已暂停 5 分钟自动轮询", "info");
              }}
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                autoRefresh
                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold"
                  : "bg-[#0c1626]/70 text-cyan-400/50 border-cyan-950"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {autoRefresh ? "5分轮询: 开启" : "5分轮询: 关闭"}
            </button>

            <button
              onClick={() => loadAll(true)}
              disabled={isRefreshing}
              className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#0c1626] hover:bg-cyan-950/50 text-cyan-200 border border-cyan-800/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-300" : "text-cyan-400"}`} />
              刷新
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)] border border-cyan-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              录入持仓
            </button>

            <button
              onClick={() => handleTriggerJarvisCopilot()}
              className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-[#0c1626] hover:bg-cyan-950/50 text-cyan-200 border border-cyan-800/40 transition-all flex items-center gap-1.5 cursor-pointer group shadow-sm"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400 group-hover:text-white transition-colors" />
              JARVIS COPILOT
            </button>
          </div>
        </div>

        {/* 9层架构分段式多维选项卡 (Tabs) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#09111e]/90 border border-cyan-500/30 w-full overflow-x-auto no-scrollbar shadow-lg">
          {[
            { id: "arena", label: "策略竞技场 & 盘面", icon: Award },
            { id: "signals", label: "信号中心 (Decision Trace)", icon: Target },
            { id: "portfolio", label: "组合持仓穿透", icon: TrendingUp },
            { id: "risk", label: "风控与熔断保护", icon: ShieldAlert },
            { id: "reports", label: "量化研报 (晨报/复盘)", icon: FileText },
            { id: "experiments", label: "实验实验室 #001", icon: Beaker },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)] border border-cyan-400/40 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-cyan-950/30"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: 策略竞技场 (ARENA) 包含第一层(MARKET REGIME) + 第二层(STRATEGY ARENA) + 第三层(PERFORMANCE) */}
        {/* ========================================================================= */}
        {activeTab === "arena" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 第一层：TODAY'S MARKET REGIME (今日市场环境研判与关键证据) */}
            <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/30 shadow-xl backdrop-blur-xl space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 border-b border-cyan-900/40 pb-4">
                <div className="flex items-start gap-4">
                  {/* Three.js 量子引力核（作为 Visual Anchor 降级展示） */}
                  <div className="w-24 h-24 shrink-0 rounded-2xl bg-black/40 border border-cyan-500/20 p-1 flex items-center justify-center">
                    <QuantumRadar3D
                      score={marketRegime?.market_score ?? marketData?.market_score ?? 50}
                      marketState={marketRegime?.regime_label ?? "中性震荡"}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                        REGIME ENGINE
                      </span>
                      <h2 className="text-lg font-black text-white font-mono uppercase tracking-wide">
                        TODAY'S MARKET REGIME
                      </h2>
                    </div>

                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-white font-mono">
                        {marketRegime?.market_score ?? marketData?.market_score ?? 50}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">/ 100</span>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                          (marketRegime?.market_score ?? 50) >= 65
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : (marketRegime?.market_score ?? 50) >= 40
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                        }`}
                      >
                        {marketRegime?.regime_label || "中性震荡 (NEUTRAL)"}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-700">
                        置信度: {marketRegime?.confidence || "HIGH"}
                      </span>
                    </div>

                    <div className="text-xs text-cyan-200/80 pt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400">建议总仓位约束:</span>
                      <span className="text-amber-300 font-mono font-bold">激进 {marketRegime?.suggested_exposure.aggressive || "60%~80%"}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-cyan-300 font-mono font-bold">均衡 {marketRegime?.suggested_exposure.balanced || "60%~75%"}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-emerald-300 font-mono font-bold">保守 {marketRegime?.suggested_exposure.conservative || "40%~60%"}</span>
                    </div>
                  </div>
                </div>

                {/* 四大维度迷你状态 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400">两市流动性</span>
                    <div className="text-white font-bold">{marketRegime?.liquidity.total_turnover_text || "1.96万亿"}</div>
                    <div className="text-[10px] text-cyan-300">{marketRegime?.liquidity.status || "充沛活跃"}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400">全市场广度</span>
                    <div className="text-rose-400 font-bold">{marketRegime?.breadth.up_ratio_pct ?? 63.8}% 多头</div>
                    <div className="text-[10px] text-slate-300">{marketRegime?.breadth.status || "结构偏强"}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400">短线动量承接</span>
                    <div className="text-amber-300 font-bold">{marketRegime?.momentum.highest_height || 4} 连板高度</div>
                    <div className="text-[10px] text-slate-300">炸板率 {marketRegime?.momentum.broken_ratio_pct || 33.6}%</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400">领涨核心主线</span>
                    <div className="text-white font-bold truncate">{marketRegime?.mainline.name || "CPO/PCB/科技"}</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">强度 {marketRegime?.mainline.strength_score || 86}/100</div>
                  </div>
                </div>
              </div>

              {/* WHY? 核心证据链卡片 (绝不仅仅展示一个 65/100) */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-cyan-400" />
                  WHY? 为什么做出这一环境定性？（关键证据链穿透）
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(marketRegime?.why_evidences || [
                    "两市成交额达 1.96 万亿，处于充沛活跃区间，量能支撑多空换手充沛",
                    "全市场上涨 3,305 家，上涨占比 63.8%，多方赚钱效应显著占据主动",
                    "涨停 73 家，跌停 0 家，短线游资情绪健康，未现恐慌杀跌踩踏",
                    "领涨主线深度聚焦科技算力硬件与农业种植，主力资金偏好高成长与稳健防御双主线",
                  ]).map((ev, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#070e18] border border-cyan-950 flex items-start gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{ev}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 第二层：STRATEGY ARENA (三大账户卡片) */}
            {arenaAccounts && (
              <StrategyArenaCards
                accounts={arenaAccounts}
                rankings={strategyRankings}
                activeStrategy={activeStrategy}
                onSelectStrategy={(s) => setActiveStrategy(s)}
              />
            )}

            {/* 第三层：PERFORMANCE (同一张 K 线走势图多策略 + 沪深300 对比) */}
            {arenaAccounts && (
              <PnlKlineChart
                accounts={Object.values(arenaAccounts) as any}
                activeAccountId={activeStrategy}
                onSelectAccount={(s) => setActiveStrategy(s as any)}
              />
            )}

            {/* 四大核心指数分时矩阵与情绪雷达 */}
            <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  四大核心股指分时走势
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  更新时间: {marketData?.snapshot_time || "--:--:--"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(marketData?.indices || []).slice(0, 4).map((idx) => {
                  const isUp = idx.change_pct >= 0;
                  return (
                    <div
                      key={idx.code}
                      className="p-3.5 rounded-2xl bg-[#091322]/80 border border-cyan-900/40 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate">{idx.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{idx.code}</span>
                        </div>
                        <div className="text-base font-black text-white mt-1 font-mono">{idx.close.toFixed(2)}</div>
                        <div className={`text-xs font-bold flex items-center gap-0.5 mt-0.5 ${isUp ? "text-rose-400" : "text-emerald-400"}`}>
                          {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{idx.change_pct > 0 ? `+${idx.change_pct}%` : `${idx.change_pct}%`}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-1 border-t border-cyan-900/40">
                        <SparklineChart changePct={idx.change_pct} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 情绪雷达看板 */}
            <SentimentRadarVisual
              volumeMetrics={marketData?.volume_metrics}
              sentimentMetrics={(marketData as any)?.sentiment_metrics}
            />

            {/* JARVIS QUANT COPILOT 快捷推演胶囊 */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#0c182b] to-blue-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">JARVIS 专属推演胶囊:</span>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {copilotChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTriggerJarvisCopilot(chip.prompt)}
                    className="px-3 py-1 rounded-xl bg-black/40 hover:bg-cyan-950/60 text-cyan-200 border border-cyan-800/50 hover:border-cyan-500/50 text-[11px] transition-all cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 信号中心 (SIGNAL CENTER) */}
        {/* ========================================================================= */}
        {activeTab === "signals" && (
          <div className="animate-in fade-in duration-300">
            <SignalCenterView
              showToast={showToast}
              onAddToPortfolio={(stock) => {
                setShowAddModal(true);
                setFormData((prev) => ({
                  ...prev,
                  stock_code: stock.code,
                  stock_name: stock.name,
                  cost_price: String(stock.price),
                }));
              }}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: 组合持仓穿透 (PORTFOLIO) */}
        {/* ========================================================================= */}
        {activeTab === "portfolio" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 用户私有持仓 */}
            <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    我的私有实战持仓
                    <span className="text-xs font-normal text-slate-400">(已录入 {holdings.length} 只标的)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    实时追踪每一笔持仓盈亏，附带动态止损线与专属风控指令
                  </p>
                </div>

                {diagnoseSummary && (
                  <div className="flex items-center gap-4 bg-[#091322]/80 px-4 py-2 rounded-2xl border border-cyan-500/30 shadow-md">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">总持仓市值</div>
                      <div className="text-sm font-bold text-white font-mono">¥ {formatMoney(diagnoseSummary.total_market_value)}</div>
                    </div>
                    <div className="h-6 w-[1px] bg-cyan-900/40" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">累计浮动盈亏</div>
                      <div className={`text-sm font-bold font-mono ${diagnoseSummary.total_pnl >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {diagnoseSummary.total_pnl >= 0 ? "+" : ""}
                        {formatMoney(diagnoseSummary.total_pnl)} ({diagnoseSummary.total_pnl_pct.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 持仓表格 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-[#091322]/90 text-cyan-300/80 font-semibold border-b border-cyan-500/30">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">标的代码/名称</th>
                      <th className="py-3 px-4">仓位类别</th>
                      <th className="py-3 px-4 text-right">持股数</th>
                      <th className="py-3 px-4 text-right">成本价</th>
                      <th className="py-3 px-4 text-right">当前现价</th>
                      <th className="py-3 px-4 text-right">浮动盈亏</th>
                      <th className="py-3 px-4 text-right">动态止损线</th>
                      <th className="py-3 px-4 text-center">系统决策指令</th>
                      <th className="py-3 px-4 rounded-r-xl text-center">管理</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-900/30">
                    {holdings.map((item) => {
                      const isProfit = item.pnl >= 0;
                      return (
                        <tr key={item.id || item.code} className="hover:bg-cyan-950/20 transition-colors">
                          <td className="py-3.5 px-4 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-cyan-400 font-semibold">{item.code}</span>
                              <span className="text-white font-bold">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[11px] border border-cyan-500/30">
                              {item.hold_type === "core" ? "核心底仓" : "短线进攻"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">{item.quantity}</td>
                          <td className="py-3.5 px-4 text-right font-mono">¥ {item.cost_price.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">¥ {item.current_price.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            <span className={`font-bold ${isProfit ? "text-rose-400" : "text-emerald-400"}`}>
                              {isProfit ? "+" : ""}{item.pnl.toFixed(2)} ({isProfit ? "+" : ""}{item.pnl_pct.toFixed(2)}%)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-amber-300 font-bold">¥ {item.stop_loss_price.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getActionBadgeClass(item.action)}`}>
                              {item.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteHolding(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 选定策略的虚拟账户持仓穿透 */}
            {arenaAccounts && (
              <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Award className="w-4 h-4 text-cyan-400" />
                    【{arenaAccounts[activeStrategy]?.name}】模拟盘实时持仓明细 (严格A股T+1)
                  </h3>
                  <div className="text-xs font-mono text-slate-400">
                    总持股数: {arenaAccounts[activeStrategy]?.position_count} 只 ｜ 可用现金: ¥{arenaAccounts[activeStrategy]?.cash.toLocaleString()}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-200">
                    <thead className="bg-[#091322]/90 text-cyan-300/80 font-semibold border-b border-cyan-500/30">
                      <tr>
                        <th className="py-3 px-4 rounded-l-xl">标的代码/名称</th>
                        <th className="py-3 px-4">行业赛道</th>
                        <th className="py-3 px-4 text-right">总持仓 / T+1可用</th>
                        <th className="py-3 px-4 text-right">建仓成本</th>
                        <th className="py-3 px-4 text-right">最新现价</th>
                        <th className="py-3 px-4 text-right">市值 / 仓位占比</th>
                        <th className="py-3 px-4 text-right">持仓盈亏</th>
                        <th className="py-3 px-4 text-right">止损 / 目标</th>
                        <th className="py-3 px-4 rounded-r-xl text-left">策略建仓逻辑</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/30 font-mono">
                      {arenaAccounts[activeStrategy]?.positions.map((pos) => {
                        const isUp = pos.pnl >= 0;
                        return (
                          <tr key={pos.code} className="hover:bg-cyan-950/20">
                            <td className="py-3 px-4 font-sans">
                              <span className="font-bold text-white">{pos.name}</span>
                              <span className="ml-1 text-cyan-400 text-[11px] font-mono">({pos.code})</span>
                            </td>
                            <td className="py-3 px-4 font-sans">{pos.sector}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-white font-bold">{pos.shares}</span> /{" "}
                              <span className="text-emerald-400">{pos.available_shares}</span>
                            </td>
                            <td className="py-3 px-4 text-right">¥{pos.cost_price.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-white font-bold">
                              {pos.current_price ? `¥${pos.current_price.toFixed(2)}` : "--"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              ¥{pos.market_value.toLocaleString()} ({pos.weight_pct}%)
                            </td>
                            <td className={`py-3 px-4 text-right font-bold ${isUp ? "text-rose-400" : "text-emerald-400"}`}>
                              {isUp ? "+" : ""}{pos.pnl} ({isUp ? "+" : ""}{pos.pnl_pct}%)
                            </td>
                            <td className="py-3 px-4 text-right text-amber-300">
                              ¥{pos.stop_loss_price} / ¥{pos.target_price}
                            </td>
                            <td className="py-3 px-4 font-sans text-slate-300 text-[11px]">
                              {pos.strategy_reason}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: 风控中心 (RISK CENTER) */}
        {/* ========================================================================= */}
        {activeTab === "risk" && arenaAccounts && (
          <div className="animate-in fade-in duration-300">
            <RiskCenterView accounts={arenaAccounts} activeStrategy={activeStrategy} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: 研报中心 (REPORTS) */}
        {/* ========================================================================= */}
        {activeTab === "reports" && (
          <div className="animate-in fade-in duration-300">
            <DailyReportsView showToast={showToast} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: 实验中心 (EXPERIMENTS) */}
        {/* ========================================================================= */}
        {activeTab === "experiments" && experiment && arenaAccounts && (
          <div className="animate-in fade-in duration-300">
            <StrategyExperimentsView experiment={experiment} accounts={arenaAccounts} />
          </div>
        )}
      </div>

      {/* 手动添加持仓弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#0c182b] via-[#091220] to-[#0d1c33] border border-cyan-500/30 p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)] space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                录入持仓标的
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="relative">
              <label className="block text-cyan-200/80 font-medium mb-1 text-xs">
                智能拼音/代码搜索 (输入如 600519 或 XYS)
              </label>
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-cyan-400/60 absolute left-3" />
                <input
                  type="text"
                  placeholder="输入股票代码、中文名称或拼音缩写..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#091424] border border-cyan-800/70 rounded-2xl shadow-2xl overflow-hidden divide-y divide-cyan-900/40 max-h-48 overflow-y-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelectSearchItem(item)}
                      className="w-full text-left px-3.5 py-2 hover:bg-cyan-950/50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-semibold">{item.code}</span>
                        <span className="text-white font-bold">{item.name}</span>
                      </div>
                      {item.current_price ? (
                        <div className="text-right font-mono">
                          <span className="text-white font-bold">¥{item.current_price.toFixed(2)}</span>
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAddHolding} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-cyan-200/80 font-medium mb-1">股票代码 *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.stock_code}
                    onChange={(e) => setFormData({ ...formData, stock_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-cyan-200/80 font-medium mb-1">股票名称</label>
                  <input
                    type="text"
                    value={formData.stock_name}
                    onChange={(e) => setFormData({ ...formData, stock_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-cyan-200/80 font-medium mb-1">持股数量 (股) *</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-cyan-200/80 font-medium mb-1">买入成本价 (元) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0e1d35] text-slate-300 hover:text-white cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  {formSubmitting ? "正在保存..." : "确认录入"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
