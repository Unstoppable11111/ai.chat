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
import { MorningBriefingHero } from "@/components/market/morning-briefing-hero";
import { checkAShareTradingTime, AShareTradingStatus } from "@/lib/trading-hours";
import { PaperTradeForm } from "@/components/market/paper-trade-form";
import {
  ArenaAccount,
  StrategyType,
  MarketRegimeAssessment,
  StrategyRankingItem,
  StrategyExperiment,
} from "@/lib/quant-arena/types";

interface StockSearchItem { code:string; name:string; current_price?:number; day_change_pct?:number; market?:string }

interface HoldingDiagnosed {
  quote_available?: boolean;
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
  volume_metrics?: Record<string, unknown>;
  last_updated: string;
}

export default function MarketDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "cockpit" | "signals" | "portfolio" | "risk" | "reports" | "experiments"
  >("cockpit");
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
  const [tradingStatus, setTradingStatus] = useState<AShareTradingStatus>({ isTrading:false, phase:"PRE_OPEN", statusText:"正在校准时钟", detail:"正在读取北京时间", cstTimeStr:"--:--:--", nextSessionHint:"" });
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "info" | "success" | "warning" } | null>(null);

  // 严格核验 A 股交易时钟：每 10 秒评估一次开盘/闭市状态
  useEffect(() => {
    const initialTimer = setTimeout(() => setTradingStatus(checkAShareTradingTime()), 0);
    const timer = setInterval(() => {
      setTradingStatus(checkAShareTradingTime());
    }, 10000);
    return () => { clearTimeout(initialTimer); clearInterval(timer); };
  }, []);

  // 股票模糊联想搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSearchItem[]>([]);
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
      const res = await fetch("/api-portfolio");
      if (res.ok) {
        const json = await res.json();
        if (json.diagnose && ["QUOTED", "REALTIME"].includes(json.diagnose.data_status)) {
          setDiagnoseSummary(json.diagnose.summary);
          setHoldings(json.diagnose.diagnosed_holdings || []);
        } else if (json.raw_holdings) {
          setDiagnoseSummary(null);
          setHoldings(
            json.raw_holdings.map((h: {stock_code:string;stock_name:string;quantity:number;cost_price:number;hold_type:string}) => ({
              ...h,
              code: h.stock_code,
              name: h.stock_name,
              quote_available: false,
              current_price: 0,
              market_value: 0,
              pnl: 0,
              pnl_pct: 0,
              day_change_pct: 0,
              hold_type: h.hold_type || "core",
              stop_loss_price: 0,
              action: "行情不可用",
              advice_reason: "缺少可验证行情，暂不计算估值与风险建议",
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
      if (manual) showToast("刷新请求已结束，请查看各项数据状态", "info");
    },
    [fetchMarketData, fetchArenaData, fetchPortfolioData, showToast, tradingStatus]
  );

  useEffect(() => {
    let ignore = false;
    async function init() {
      await Promise.all([fetchMarketData(), fetchArenaData(), fetchPortfolioData()]);
      if (!ignore) setIsLoading(false);
    }
    init();

    // 严格规则：仅在开盘交易时段 (isTrading === true) 且 autoRefresh 为 true 时才启动 5 分钟轮询
    // 非开盘时间自动停止，杜绝无效刷新
    if (!autoRefresh || !tradingStatus.isTrading) return;

    const timer = setInterval(() => {
      fetchMarketData();
      fetchArenaData();
      fetchPortfolioData();
    }, 300000);

    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [fetchMarketData, fetchArenaData, fetchPortfolioData, autoRefresh, tradingStatus.isTrading]);

  // 股票模糊联想搜索防抖
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
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

  const handleSelectSearchItem = (item: StockSearchItem) => {
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
  const handleTriggerJarvisCopilot = useCallback(() => {
    window.dispatchEvent(new CustomEvent("trigger-ai-chat", { detail: { prompt: "请解释如何计算组合净值、峰值回撤，以及行情缺失时应该如何处理估值。请区分计算示例与投资建议。" } }));
    showToast("已准备问题，请检查后发送", "info");
  }, [showToast]);

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stock_code) return;
    setFormSubmitting(true);
    try {
      const res = await fetch("/api-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      const res = await fetch(`/api-portfolio?id=${id}`, {
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
                  个人持仓记录 · 手动模拟交易 · 实验工作台
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* A股交易时钟状态胶囊 */}
            <div
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                tradingStatus.isTrading
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                  : "bg-slate-800/80 text-slate-400 border-slate-700"
              }`}
              title={tradingStatus.detail}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  tradingStatus.isTrading ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              />
              <span className="font-bold">{tradingStatus.statusText}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">({tradingStatus.cstTimeStr})</span>
            </div>

            <button
              onClick={() => {
                if (!tradingStatus.isTrading) {
                  showToast(`非开盘时段自动停刷：${tradingStatus.detail}`, "info");
                  return;
                }
                const next = !autoRefresh;
                setAutoRefresh(next);
                showToast(next ? "已开启 5 分钟自动轮询" : "已暂停 5 分钟自动轮询", "info");
              }}
              disabled={!tradingStatus.isTrading}
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                !tradingStatus.isTrading
                  ? "bg-slate-900/60 text-slate-500 border-slate-800 cursor-not-allowed opacity-60"
                  : autoRefresh
                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold cursor-pointer"
                  : "bg-[#0c1626]/70 text-cyan-400/50 border-cyan-950 cursor-pointer"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {!tradingStatus.isTrading
                ? "5分轮询: 自动停刷"
                : autoRefresh
                ? "5分轮询: 开启"
                : "5分轮询: 关闭"}
            </button>

            <button
              onClick={() => loadAll(true)}
              disabled={isRefreshing}
              title="刷新行情与当前账户持仓"
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shadow-sm ${
                isRefreshing
                  ? "bg-slate-900/40 text-slate-500 border-slate-800 cursor-not-allowed opacity-50"
                  : "bg-[#0c1626] hover:bg-cyan-950/50 text-cyan-200 border-cyan-800/40 cursor-pointer"
              }`}
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

        {/* ========================================================================= */}
        {/* AI 科技成长每日投研内参 · 机构晨会级 (头部醒目黄金位) */}
        {/* ========================================================================= */}
        <MorningBriefingHero
          onOpenReportTab={() => setActiveTab("reports")}
          showToast={showToast}
        />

        {/* 多维导航选项卡 (Tabs) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#09111e]/90 border border-cyan-500/30 w-full overflow-x-auto no-scrollbar shadow-lg">
          {[
            { id: "cockpit", label: "行情与模拟账户", icon: Activity },
            { id: "signals", label: "信号状态", icon: Target },
            { id: "portfolio", label: "组合持仓穿透与诊断", icon: TrendingUp },
            { id: "risk", label: "持仓风险概览", icon: ShieldAlert },
            { id: "reports", label: "持仓快照历史", icon: FileText },
            { id: "experiments", label: "策略实验实验室 #001", icon: Beaker },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
        {/* TAB 1: 行情与模拟账户 (COCKPIT & ARENA) */}
        {/* ========================================================================= */}
        {activeTab === "cockpit" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 全景核心 4 联指标看板 */}
            {marketData || marketRegime ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 卡片 1: 综合评分 & 3D 量化雷达核 */}
                <div className="p-5 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      全景量化评分
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                      {marketRegime?.regime_label ?? marketData?.market_state ?? "多空评估中"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-white tracking-tight font-mono">
                        {marketRegime?.market_score ?? marketData?.market_score ?? 65}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">/ 100</span>
                    </div>
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        (marketRegime?.market_score ?? marketData?.market_score ?? 60) >= 60
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {(marketRegime?.market_score ?? marketData?.market_score ?? 60) >= 70
                        ? "极强主升"
                        : (marketRegime?.market_score ?? marketData?.market_score ?? 60) >= 55
                        ? "温和震荡"
                        : "弱势防守"}
                    </span>
                  </div>

                  {/* 3D WebGL 量化雷达 */}
                  <QuantumRadar3D
                    score={marketRegime?.market_score ?? marketData?.market_score ?? 65}
                    marketState={marketRegime?.regime_label ?? marketData?.market_state ?? "偏多运行"}
                  />

                  <p className="text-xs text-cyan-200/80 flex items-center gap-1.5 pt-1.5 border-t border-cyan-900/40">
                    <Flame className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
                    <span className="text-cyan-300/80 font-medium">核心主线:</span>
                    <span className="text-white font-bold truncate">
                      {marketRegime?.mainline?.name || marketData?.market_style || "CPO光模块 · 连板龙头 · 半导体中军"}
                    </span>
                  </p>
                </div>

                {/* 卡片 2: 建议总仓位 & 核心量能（两市总成交额） */}
                <div className="p-5 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                        <PieChart className="w-3.5 h-3.5 text-cyan-400" />
                        建议总仓位
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                        动态风控
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-cyan-400 tracking-tight font-mono">
                        {marketRegime?.suggested_exposure?.balanced || marketData?.suggested_position || "65%~85%"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300/70 mt-1 line-clamp-1">
                      {diagnoseSummary?.overall_action || "积极顺势，主线龙头进攻，底仓防守"}
                    </p>
                  </div>

                  {/* 核心量能量化指标 */}
                  <div className="pt-3 border-t border-cyan-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        两市成交额
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
                        {(marketData?.volume_metrics as { status_label?: string })?.status_label || "充沛活跃区间"}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white tracking-tight font-mono">
                          {marketRegime?.liquidity?.total_turnover_text || marketData?.total_turnover_text || (marketData?.total_turnover ? `${marketData.total_turnover}亿` : "实时计算中")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">沪深合计</span>
                      </div>
                      {(marketData?.volume_metrics as { is_trading_hours?: boolean })?.is_trading_hours ? (
                        <span className="text-[11px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                          盘中动态累积中
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono font-bold text-cyan-300">
                          {(marketData?.volume_metrics as { diff_ma5_pct?: number })?.diff_ma5_pct != null
                            ? `较5日均额 ${(marketData?.volume_metrics as { diff_ma5_pct: number }).diff_ma5_pct >= 0 ? "+" : ""}${(marketData?.volume_metrics as { diff_ma5_pct: number }).diff_ma5_pct}%`
                            : "收盘量能锁定"}
                        </span>
                      )}
                    </div>

                    {/* 均量基准与量能柱迷你走势 */}
                    <div className="space-y-1.5 text-[10px] text-slate-400 pt-0.5">
                      <div className="flex justify-between items-center font-mono text-[10px] text-slate-300/80">
                        <span>MA5均量: {(marketData?.volume_metrics as { volume_ma5?: number | null })?.volume_ma5 ? `${(((marketData?.volume_metrics as { volume_ma5: number }).volume_ma5) / 10000).toFixed(2)}万亿` : "动态核算中"}</span>
                        <span>交投状态: {(marketData?.volume_metrics as { status_label?: string })?.status_label || "实时同步"}</span>
                      </div>

                      {((marketData?.volume_metrics as { series?: Array<{ date: string; turnover: number }> })?.series?.length ?? 0) > 0 ? (
                        <div className="flex items-end gap-1 h-7 pt-1 w-full">
                          {((marketData?.volume_metrics as { series: Array<{ date: string; turnover: number }> }).series).map((item, idx, arr) => {
                            const isLast = idx === arr.length - 1;
                            const maxVal = 25000;
                            const heightPct = Math.max(25, Math.min(100, (item.turnover / maxVal) * 100));
                            return (
                              <div
                                key={item.date || idx}
                                className="flex-1 flex flex-col items-center gap-0.5 group relative"
                                title={`${item.date}: ${(item.turnover / 10000).toFixed(2)}万亿`}
                              >
                                <div
                                  className={`w-full rounded-xs transition-all duration-300 ${
                                    isLast ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.7)]" : "bg-cyan-950/60 group-hover:bg-cyan-800/60"
                                  }`}
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-7 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                          实时成交量能核算中...
                        </div>
                      )}

                      <div className="flex justify-between text-[9px] text-cyan-400/60 font-mono">
                        <span>实时成交量能柱</span>
                        <span>全日动态累积</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 卡片 3 & 4: 四大核心股指分时全景 + SVG Sparkline 迷你走势 */}
                <div className="p-5 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl backdrop-blur-xl md:col-span-2 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      四大核心股指实时全景
                    </span>
                    <span className="text-[10px] text-cyan-400/60 font-mono">
                      更新时间: {marketData?.snapshot_time || "--:--:--"}
                    </span>
                  </div>

                  {/* 四大核心股指矩阵 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {marketData?.indices && marketData.indices.length > 0 ? (
                      marketData.indices.slice(0, 4).map((idx) => {
                        const isUp = idx.change_pct >= 0;
                        return (
                          <div
                            key={idx.code}
                            className="p-3 rounded-2xl bg-[#091322]/80 border border-cyan-900/40 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-md"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white truncate">{idx.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{idx.code}</span>
                              </div>
                              <div className="text-base font-black text-white mt-1 font-mono">{idx.close.toFixed(2)}</div>
                              <div
                                className={`text-xs font-bold flex items-center gap-0.5 mt-0.5 ${
                                  isUp ? "text-rose-400" : "text-emerald-400"
                                }`}
                              >
                                {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                <span>{idx.change_pct > 0 ? `+${idx.change_pct}%` : `${idx.change_pct}%`}</span>
                              </div>
                            </div>

                            {/* 迷你分时走势图 Sparkline */}
                            <div className="mt-2 pt-1 border-t border-cyan-900/40">
                              <SparklineChart changePct={idx.change_pct} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-6 text-center text-xs text-slate-400 bg-[#091322]/50 rounded-2xl border border-cyan-900/30">
                        行情数据接口通信中，四大指数实时行情加载中...
                      </div>
                    )}
                  </div>

                  {/* 全市场多空博弈条 */}
                  <div className="pt-3 border-t border-cyan-900/40 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyan-200 flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-cyan-400" />
                        全市场涨跌分布
                      </span>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-rose-400 font-bold">
                          涨 {marketRegime?.breadth?.up_count || marketData?.up_count || "--"}
                        </span>
                        <span className="text-slate-400">
                          平 {marketRegime?.breadth?.flat_count || marketData?.flat_count || "--"}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          跌 {marketRegime?.breadth?.down_count || marketData?.down_count || "--"}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const up = marketRegime?.breadth?.up_count ?? marketData?.up_count ?? 0;
                      const down = marketRegime?.breadth?.down_count ?? marketData?.down_count ?? 0;
                      const flat = marketRegime?.breadth?.flat_count ?? marketData?.flat_count ?? 0;
                      const total = up + down + flat;
                      if (total === 0) {
                        return (
                          <div className="text-[10px] text-slate-500 text-center py-1 font-mono">
                            全市场多空博弈数据统计中...
                          </div>
                        );
                      }
                      const upPct = ((up / total) * 100).toFixed(1);
                      const downPct = ((down / total) * 100).toFixed(1);
                      return (
                        <div className="space-y-1">
                          <div className="w-full bg-[#08101d] rounded-full h-2 flex overflow-hidden border border-cyan-950">
                            <div
                              className="bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                              style={{ width: `${upPct}%` }}
                              title={`上涨家数占比: ${upPct}%`}
                            />
                            <div
                              className="bg-slate-700/60 transition-all duration-500"
                              style={{ width: `${((flat / total) * 100).toFixed(1)}%` }}
                            />
                            <div
                              className="bg-emerald-500 transition-all duration-500"
                              style={{ width: `${downPct}%` }}
                              title={`下跌家数占比: ${downPct}%`}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                            <span className="text-rose-400">多方优势 {upPct}%</span>
                            <span className="text-emerald-400">空方优势 {downPct}%</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-900/40 text-center text-slate-400 text-sm">
                <p className="text-cyan-400 mb-1">行情数据源同步中或接口暂未响应</p>
                <p className="text-xs text-slate-500">正在重新建立行情通信链路，全景量能与分析指标将在数据到达后实时展现。</p>
              </div>
            )}

            <SentimentRadarVisual />
            {arenaAccounts && <>
              <StrategyArenaCards accounts={arenaAccounts} rankings={strategyRankings} activeStrategy={activeStrategy} onSelectStrategy={setActiveStrategy} />
              <PnlKlineChart account={arenaAccounts[activeStrategy]} accounts={Object.values(arenaAccounts)} activeAccountId={activeStrategy} onSelectAccount={setActiveStrategy} />
            </>}
          </div>
        )}

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
            <PaperTradeForm strategy={activeStrategy} onSaved={fetchArenaData}/>
            {arenaAccounts && <section className="border-y border-cyan-900/40 py-5 text-slate-300"><h3 className="mb-3 text-base font-semibold text-white">{arenaAccounts[activeStrategy].name} · 模拟交易记录</h3><div className="max-h-64 overflow-auto text-xs">{arenaAccounts[activeStrategy].orders.slice(0,30).map(order=><p key={order.id} className="border-b border-cyan-900/20 py-2">{order.date} · {order.action==="BUY"?"买入":"卖出"} {order.stock_code} · {order.shares} 股 · 记账价 {order.price.toFixed(2)} · 费用 {order.total_cost.toFixed(2)}</p>)}{!arenaAccounts[activeStrategy].orders.length&&<p>暂无交易记录</p>}</div></section>}
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
                    按可用行情查看持仓盈亏与集中度
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
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs text-slate-200 min-w-[780px] whitespace-nowrap">
                  <thead className="bg-[#091322]/90 text-cyan-300/80 font-semibold border-b border-cyan-500/30">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl whitespace-nowrap">标的代码/名称</th>
                      <th className="py-3 px-4 whitespace-nowrap">仓位类别</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">持股数</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">成本价</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">当前现价</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">浮动盈亏</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">动态止损线</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">估值状态</th>
                      <th className="py-3 px-4 rounded-r-xl text-center whitespace-nowrap">管理</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-900/30">
                    {holdings.map((item) => {
                      const isProfit = item.pnl >= 0;
                      return (
                        <tr key={item.id || item.code} className="hover:bg-cyan-950/20 transition-colors">
                          <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span className="font-mono text-cyan-400 font-semibold">{item.code}</span>
                              <span className="text-white font-bold whitespace-nowrap">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[11px] border border-cyan-500/30 whitespace-nowrap inline-block">
                              {({core:"核心底仓",trend:"趋势持仓",attack:"短线进攻",trial:"试验持仓"} as Record<string,string>)[item.hold_type] || item.hold_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">{item.quantity}</td>
                          <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">¥ {item.cost_price.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white whitespace-nowrap">{item.quote_available === false ? "--" : `¥ ${item.current_price.toFixed(2)}`}</td>
                          <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                            <span className={`font-bold whitespace-nowrap ${isProfit ? "text-rose-400" : "text-emerald-400"}`}>
                              {item.quote_available === false ? "--" : `${isProfit ? "+" : ""}${item.pnl.toFixed(2)} (${isProfit ? "+" : ""}${item.pnl_pct.toFixed(2)}%)`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-amber-300 font-bold whitespace-nowrap">{item.stop_loss_price > 0 ? `¥ ${item.stop_loss_price.toFixed(2)}` : "--"}</td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border whitespace-nowrap ${getActionBadgeClass(item.action)}`}>
                              {item.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              aria-label={`删除${item.name}持仓`}
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
                    【{arenaAccounts[activeStrategy]?.name}】模拟持仓记录（当日新增仓位不可卖）
                  </h3>
                  <div className="text-xs font-mono text-slate-400">
                    总持股数: {arenaAccounts[activeStrategy]?.position_count} 只 ｜ 可用现金: ¥{arenaAccounts[activeStrategy]?.cash.toLocaleString()}
                  </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs text-slate-200 min-w-[880px] whitespace-nowrap">
                    <thead className="bg-[#091322]/90 text-cyan-300/80 font-semibold border-b border-cyan-500/30">
                      <tr>
                        <th className="py-3 px-4 rounded-l-xl whitespace-nowrap">标的代码/名称</th>
                        <th className="py-3 px-4 whitespace-nowrap">行业赛道</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">总持仓 / T+1可用</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">建仓成本</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">最新现价</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">市值 / 仓位占比</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">持仓盈亏</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">止损 / 目标</th>
                        <th className="py-3 px-4 rounded-r-xl text-left whitespace-nowrap">策略建仓逻辑</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/30 font-mono">
                      {arenaAccounts[activeStrategy]?.positions.map((pos) => {
                        const isUp = pos.pnl >= 0;
                        return (
                          <tr key={pos.code} className="hover:bg-cyan-950/20">
                            <td className="py-3 px-4 font-sans whitespace-nowrap">
                              <span className="font-bold text-white whitespace-nowrap">{pos.name}</span>
                              <span className="ml-1 text-cyan-400 text-[11px] font-mono whitespace-nowrap">({pos.code})</span>
                            </td>
                            <td className="py-3 px-4 font-sans whitespace-nowrap">{pos.sector}</td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <span className="text-white font-bold">{pos.shares}</span> /{" "}
                              <span className="text-emerald-400">{pos.available_shares}</span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">¥{pos.cost_price.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-white font-bold whitespace-nowrap">
                              {pos.current_price ? `¥${pos.current_price.toFixed(2)}` : "--"}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              ¥{pos.market_value.toLocaleString()} ({pos.weight_pct}%)
                            </td>
                            <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${isUp ? "text-rose-400" : "text-emerald-400"}`}>
                              {isUp ? "+" : ""}{pos.pnl} ({isUp ? "+" : ""}{pos.pnl_pct}%)
                            </td>
                            <td className="py-3 px-4 text-right text-amber-300 whitespace-nowrap">
                              ¥{pos.stop_loss_price} / ¥{pos.target_price}
                            </td>
                            <td className="py-3 px-4 font-sans text-slate-300 text-[11px] whitespace-nowrap">
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
        {activeTab === "experiments" && !experiment && <p className="py-12 text-center text-slate-300">暂无可评估的个人策略实验。</p>}
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
