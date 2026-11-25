"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Calendar,
  Clock,
  DatabaseBackup,
  Edit3,
  Flame,
  Layers,
  PieChart,
  Plus,
  Radar,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { SparklineChart } from "@/components/market/sparkline-chart";
import { MorningBriefingHero } from "@/components/market/morning-briefing-hero";
import { MarketSentimentMetricsBar } from "@/components/market/market-sentiment-metrics-bar";
import { HoldingEditModal, type HoldingEditableRecord } from "@/components/market/holding-edit-modal";
import { RollingPoolPanel } from "@/components/market/rolling-pool-panel";
import { DailyBoardView } from "@/components/market/daily-board-view";
import { WorkspaceLogout } from "@/components/market/workspace-access";
import { checkAShareTradingTime, type AShareTradingStatus } from "@/lib/trading-hours";
import type { MarketSentimentMetrics } from "@/lib/quotes-service";
import type {
  MarketTrafficLightState,
  SwingSignalItem,
  StockTechnicals,
} from "@/lib/quant-arena/swing-rules";

const QuantumRadar3D = dynamic(
  () => import("@/components/market/quantum-radar-3d").then((m) => m.QuantumRadar3D),
  { ssr: false, loading: () => <div className="h-[300px] w-full animate-pulse rounded-2xl bg-slate-900" /> }
);

interface HoldingDiagnosed extends HoldingEditableRecord {
  id: number;
  code: string;
  name: string;
  board?: string;
  current_price: number;
  market_value: number;
  pnl: number;
  pnl_pct: number;
  day_change_pct: number;
  amplitude_pct?: number;
  pullback_from_high_pct?: number;
  rebound_from_low_pct?: number;
  vol_ratio?: number;
  turnover_pct?: number;
  sector_change_pct?: number;
  stop_loss_price: number;
  technicals?: StockTechnicals | null;
  signals?: SwingSignalItem[];
  highest_severity?: string;
  llm_escalate?: boolean;
  action: string;
  advice_reason: string;
  risk_level: string;
  quote_available?: boolean;
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
  traffic_light?: MarketTrafficLightState;
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
  sentiment_metrics?: MarketSentimentMetrics | null;
  last_updated: string;
}

type MainTab = "cockpit" | "portfolio" | "pool" | "daily";

export default function MarketDashboardPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("cockpit");
  const [marketData, setMarketData] = useState<MarketSnapshot | null>(null);
  const [diagnoseSummary, setDiagnoseSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<HoldingDiagnosed[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [tradingStatus, setTradingStatus] = useState<AShareTradingStatus>({
    isTrading: false,
    phase: "PRE_OPEN",
    statusText: "正在校准时钟",
    detail: "正在读取北京时间",
    cstTimeStr: "--:--:--",
    nextSessionHint: "",
  });
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "info" | "success" | "warning" } | null>(null);

  // 编辑/新增持仓弹窗状态
  const [holdingModalOpen, setHoldingModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<HoldingEditableRecord | null>(null);
  const [dailyRefreshSignal, setDailyRefreshSignal] = useState(0);
  const [aiBusyCode, setAiBusyCode] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const showToast = useCallback((text: string, type: "info" | "success" | "warning" = "info") => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 3400);
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => setTradingStatus(checkAShareTradingTime()), 0);
    const timer = setInterval(() => {
      setTradingStatus(checkAShareTradingTime());
    }, 10000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch("/api-market/latest", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setMarketData(json);
      }
    } catch (err) {
      console.error("加载大盘数据失败:", err);
    }
  }, []);

  const fetchPortfolioData = useCallback(async () => {
    try {
      const res = await fetch("/api-portfolio", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.diagnose) {
          setDiagnoseSummary(json.diagnose.summary || null);
          setHoldings(json.diagnose.diagnosed_holdings || []);
        }
      }
    } catch (err) {
      console.error("加载持仓诊断失败:", err);
    }
  }, []);

  const loadAll = useCallback(
    async (manual = false) => {
      setIsRefreshing(true);
      if (manual) showToast("正在刷新全市场实时盘口、情绪红绿灯与持仓风控...", "info");
      await Promise.all([fetchMarketData(), fetchPortfolioData()]);
      setIsLoading(false);
      setIsRefreshing(false);
      if (manual) showToast("实时行情与风控诊断已同步", "success");
    },
    [fetchMarketData, fetchPortfolioData, showToast]
  );

  useEffect(() => {
    let ignore = false;
    async function init() {
      await Promise.all([fetchMarketData(), fetchPortfolioData()]);
      if (!ignore) setIsLoading(false);
    }
    void init();

    if (!autoRefresh || !tradingStatus.isTrading) return;
    const timer = setInterval(() => {
      void fetchMarketData();
      void fetchPortfolioData();
    }, 300000);

    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [fetchMarketData, fetchPortfolioData, autoRefresh, tradingStatus.isTrading]);

  const handleDeleteHolding = async (id?: number) => {
    if (!id) return;
    if (!confirm("确定要删除这笔实盘持仓吗？")) return;
    try {
      const res = await fetch(`/api-portfolio?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("已移除持仓记录", "info");
        await fetchPortfolioData();
      }
    } catch {
      showToast("移除持仓失败", "warning");
    }
  };

  const handleSeedSelect = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api-market/rolling-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_select" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || "初始账本导入成功", "success");
        await fetchPortfolioData();
      } else {
        showToast(json.error || "导入失败", "warning");
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleTriggerAiAnalyze = async (stockCode?: string, stockName?: string) => {
    const busyKey = stockCode || "ALL";
    setAiBusyCode(busyKey);
    showToast(`正在唤醒 AI 分析 ${stockName || "全盘与持仓"}...`, "info");
    try {
      const res = await fetch("/api-market/daily-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          stock_code: stockCode,
          stock_name: stockName,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast("AI 深度研判已生成，已归档至每日看板「04 异常与AI研判」", "success");
        setDailyRefreshSignal((n) => n + 1);
        setActiveTab("daily");
      } else {
        showToast(json.error || "AI 研判失败", "warning");
      }
    } finally {
      setAiBusyCode(null);
    }
  };

  const formatMoney = (num: number) =>
    new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

  const trafficLight = marketData?.traffic_light;
  const escalatedCount = holdings.filter((h) => h.llm_escalate).length;
  const actionCount = holdings.filter((h) => h.highest_severity === "ACTION").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] via-[#070b16] to-[#0a1122] text-slate-100 pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative">
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#0c1626]/95 border border-cyan-500/40 text-xs text-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md">
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
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2 font-mono">
                  CHEN TECH STUDIO ｜ A股波段纪律与5日轮动工作台
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    主板+创业板
                  </span>
                </h1>
                <p className="text-xs text-cyan-200/70">
                  盘前全天计划 · 盘中5分钟规则监控 · 5日轮动观察池 · 异常自动唤醒AI研判
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                tradingStatus.isTrading
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
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
                showToast(next ? "已开启盘中 5 分钟自动轮询" : "已暂停前端自动轮询（后台定时任务照常运行）", "info");
              }}
              disabled={!tradingStatus.isTrading}
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                !tradingStatus.isTrading
                  ? "bg-slate-900/60 text-slate-500 border-slate-800 cursor-not-allowed opacity-60"
                  : autoRefresh
                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40 font-bold cursor-pointer"
                  : "bg-[#0c1626]/70 text-cyan-400/50 border-cyan-950 cursor-pointer"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {!tradingStatus.isTrading ? "5分轮询: 自动停刷" : autoRefresh ? "5分轮询: 开启" : "5分轮询: 关闭"}
            </button>

            <button
              onClick={() => void loadAll(true)}
              disabled={isRefreshing || isLoading}
              className="px-3 py-1.5 rounded-xl border bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? "animate-spin" : ""}`} />
              刷新
            </button>

            <button
              onClick={() => {
                setEditingHolding(null);
                setHoldingModalOpen(true);
              }}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              录入持仓
            </button>

            <button
              onClick={() => void handleTriggerAiAnalyze()}
              disabled={aiBusyCode !== null}
              className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-300" />
              {aiBusyCode === "ALL" ? "AI研判中..." : "AI 立即看盘"}
            </button>

            <WorkspaceLogout />
          </div>
        </div>

        {/* 投研晨报快捷入口 */}
        <MorningBriefingHero onOpenReportTab={() => setActiveTab("daily")} showToast={showToast} />

        {/* 主导航 Tabs (4个纯粹实战工作区) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#09111e]/90 border border-cyan-500/30 w-full overflow-x-auto no-scrollbar shadow-lg">
          {[
            { id: "cockpit", label: "实盘看盘总览", icon: Activity },
            { id: "portfolio", label: `实盘持仓与风控 (${holdings.length})`, icon: TrendingUp },
            { id: "pool", label: "5日轮动观察池", icon: Radar },
            { id: "daily", label: "每日四合一看板", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MainTab)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive ? "text-white font-bold" : "text-slate-400 hover:text-white hover:bg-cyan-950/30"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="market-main-tab-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 shadow-[0_0_18px_rgba(6,182,212,0.35)] border border-cyan-400/40"
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  />
                )}
                <Icon className="relative z-10 w-3.5 h-3.5" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: 实盘看盘总览 (COCKPIT) */}
        {/* ========================================================================= */}
        {activeTab === "cockpit" && (
          <div className="space-y-6">
            {/* 持仓风控摘要条 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-3xl bg-[#0c1626]/90 border border-cyan-500/30 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-bold text-white">实盘持仓波段纪律监控</h2>
                    {actionCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                        {actionCount} 只触发行动线
                      </span>
                    )}
                    {escalatedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                        {escalatedCount} 只盘中异动
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("portfolio")}
                      className="text-xs text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
                    >
                      进入持仓详情 →
                    </button>
                  </div>
                </div>

                {holdings.length === 0 ? (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-xs text-slate-400">当前账户暂未录入实盘持仓，可一键导入兴森科技与3只观察股或手动录入。</p>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSeedSelect()}
                        disabled={seeding}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <DatabaseBackup className="w-3.5 h-3.5" />
                        <span>{seeding ? "导入中..." : "导入兴森科技+3只初始观察股"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHolding(null);
                          setHoldingModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        + 手动录入持仓
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {holdings.map((h) => (
                      <div
                        key={h.id}
                        className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                          h.highest_severity === "ACTION"
                            ? "bg-rose-950/30 border-rose-500/40"
                            : h.llm_escalate
                            ? "bg-amber-950/25 border-amber-500/40"
                            : "bg-slate-950/70 border-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white text-sm">{h.name}</span>
                            <span className="ml-1.5 font-mono text-slate-400">{h.code}</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                              {h.position_mode === "deep_drawdown_recovery" ? "深套修复" : "标准波段"}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="font-bold text-white">¥{h.current_price.toFixed(2)}</span>
                            <span
                              className={`ml-1.5 ${
                                h.day_change_pct >= 0 ? "text-rose-400" : "text-emerald-400"
                              }`}
                            >
                              {h.day_change_pct >= 0 ? "+" : ""}
                              {h.day_change_pct.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>
                            浮盈{" "}
                            <strong className={h.pnl >= 0 ? "text-rose-400" : "text-emerald-400"}>
                              {h.pnl >= 0 ? "+" : ""}
                              {h.pnl_pct.toFixed(2)}%
                            </strong>
                          </span>
                          <span>
                            振幅 {h.amplitude_pct ?? 0}% · 高点回撤 -{h.pullback_from_high_pct ?? 0}%
                          </span>
                        </div>
                        <div className="text-[11px] text-cyan-200/90 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                          {h.advice_reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 右侧：快捷操作与资产总览 */}
              <div className="rounded-3xl bg-[#0c1626]/90 border border-cyan-500/30 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-slate-400">账户持仓总市值</div>
                  <div className="text-2xl font-black text-white font-mono">
                    ¥ {formatMoney(diagnoseSummary?.total_market_value || 0)}
                  </div>
                  <div
                    className={`text-xs font-mono font-bold ${
                      (diagnoseSummary?.total_pnl || 0) >= 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    累计浮盈 {(diagnoseSummary?.total_pnl || 0) >= 0 ? "+" : ""}
                    {formatMoney(diagnoseSummary?.total_pnl || 0)} ({(diagnoseSummary?.total_pnl_pct || 0).toFixed(2)}%)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("pool")}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left cursor-pointer"
                  >
                    <div className="font-bold text-cyan-300 flex items-center gap-1">
                      <Radar className="w-3.5 h-3.5" />
                      5日观察池
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">查看买点A/B触发状态</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("daily")}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left cursor-pointer"
                  >
                    <div className="font-bold text-emerald-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      每日看板
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">01盘前 / 02播报 / 03选股 / 04AI</div>
                  </button>
                </div>
              </div>
            </div>

            {/* 全市场短线量化盘口与红绿灯总闸门 */}
            <MarketSentimentMetricsBar initialMetrics={marketData?.sentiment_metrics} />

            {/* 全景核心 4 联指标看板 */}
            {marketData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      情绪温度与红绿灯
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                      {marketData.market_state}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-white font-mono">
                      {trafficLight?.score ?? marketData.market_score}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ 100</span>
                  </div>
                  <QuantumRadar3D
                    score={trafficLight?.score ?? marketData.market_score}
                    marketState={trafficLight?.label ?? marketData.market_state}
                  />
                  <p className="text-xs text-cyan-200/80 flex items-center gap-1.5 pt-1.5 border-t border-cyan-900/40">
                    <Flame className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-white font-bold truncate">{marketData.market_style}</span>
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-cyan-400" />
                      建议总仓位
                    </span>
                    <div className="mt-2 text-3xl font-black text-cyan-400 font-mono">
                      {marketData.suggested_position}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {trafficLight?.summary || diagnoseSummary?.overall_action}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-cyan-900/40 space-y-1.5">
                    <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-cyan-400" />
                      两市成交额
                    </span>
                    <div className="text-2xl font-bold text-white font-mono">
                      {marketData.total_turnover_text || "--"}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {(marketData.volume_metrics as { status_detail?: string })?.status_detail || "实时统计中"}
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl backdrop-blur-xl md:col-span-2 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      四大核心股指实时全景
                    </span>
                    <span className="text-[10px] text-cyan-400/60 font-mono">
                      更新时间: {marketData.snapshot_time}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {marketData.indices.slice(0, 4).map((idx) => {
                      const isUp = idx.change_pct >= 0;
                      return (
                        <div
                          key={idx.code}
                          className="p-3 rounded-2xl bg-[#091322]/80 border border-cyan-900/40 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate">{idx.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{idx.code}</span>
                            </div>
                            <div className="text-base font-black text-white mt-1 font-mono">
                              {idx.close.toFixed(2)}
                            </div>
                            <div
                              className={`text-xs font-bold flex items-center gap-0.5 mt-0.5 ${
                                isUp ? "text-rose-400" : "text-emerald-400"
                              }`}
                            >
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

                  <div className="pt-3 border-t border-cyan-900/40 flex items-center justify-between text-xs">
                    <span className="text-cyan-200 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      全市场涨跌分布
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-rose-400 font-bold">涨 {marketData.up_count ?? "--"}</span>
                      <span className="text-slate-400">平 {marketData.flat_count ?? "--"}</span>
                      <span className="text-emerald-400 font-bold">跌 {marketData.down_count ?? "--"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 实盘持仓与风控 (PORTFOLIO) */}
        {/* ========================================================================= */}
        {activeTab === "portfolio" && (
          <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  我的实盘持仓与波段纪律穿透
                  <span className="text-xs font-normal text-slate-400">({holdings.length} 只标的)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  支持标准波段（+15%/+25%止盈、-8%止损、MA20+板块防守）与深套修复双模式，实时捕获日内冲高回落与深V异动。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSeedSelect()}
                  disabled={seeding}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <DatabaseBackup className="w-3.5 h-3.5" />
                  <span>{seeding ? "导入中..." : "导入兴森科技+3只观察股"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingHolding(null);
                    setHoldingModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>录入新持仓</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs text-slate-200 min-w-[1060px]">
                <thead className="bg-[#091322]/90 text-cyan-300/80 font-semibold border-b border-cyan-500/30">
                  <tr>
                    <th className="py-3 px-3 rounded-l-xl">标的 / 模式</th>
                    <th className="py-3 px-3">板块 / 强度</th>
                    <th className="py-3 px-3 text-right">持股 / 可卖</th>
                    <th className="py-3 px-3 text-right">成本 / 现价</th>
                    <th className="py-3 px-3 text-right">浮盈亏</th>
                    <th className="py-3 px-3 text-right">日内振幅 / 高撤</th>
                    <th className="py-3 px-3 text-right">防守 / 止损位</th>
                    <th className="py-3 px-3 min-w-[320px]">规则信号与操作建议</th>
                    <th className="py-3 px-3 rounded-r-xl text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-900/30">
                  {holdings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        暂无实盘持仓，点击右上角「录入新持仓」或「导入兴森科技+3只观察股」。
                      </td>
                    </tr>
                  ) : (
                    holdings.map((item) => {
                      const isProfit = item.pnl >= 0;
                      return (
                        <tr key={item.id || item.code} className="hover:bg-cyan-950/25 align-top">
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-white">
                              {item.name} <span className="font-mono text-cyan-400">{item.code}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                  item.position_mode === "deep_drawdown_recovery"
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                    : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                }`}
                              >
                                {item.position_mode === "deep_drawdown_recovery" ? "深套修复" : "标准波段"}
                              </span>
                              {item.board && <span className="text-[10px] text-slate-400">{item.board}</span>}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="text-cyan-200 font-medium">{item.sector || "--"}</div>
                            {typeof item.sector_change_pct === "number" && (
                              <div
                                className={`text-[11px] font-mono ${
                                  item.sector_change_pct >= 0 ? "text-rose-400" : "text-emerald-400"
                                }`}
                              >
                                {item.sector_change_pct >= 0 ? "+" : ""}
                                {item.sector_change_pct.toFixed(2)}%
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <div className="text-white font-semibold">{item.quantity.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">
                              可卖 {(item.available_quantity ?? item.quantity).toLocaleString()}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <div className="text-slate-400">成本 ¥{item.cost_price.toFixed(2)}</div>
                            <div className="text-white font-bold">
                              现价 ¥{item.current_price.toFixed(2)}
                              <span
                                className={`ml-1 text-[10px] ${
                                  item.day_change_pct >= 0 ? "text-rose-400" : "text-emerald-400"
                                }`}
                              >
                                {item.day_change_pct >= 0 ? "+" : ""}
                                {item.day_change_pct.toFixed(2)}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <div className={`font-bold ${isProfit ? "text-rose-400" : "text-emerald-400"}`}>
                              {isProfit ? "+" : ""}
                              {item.pnl.toFixed(0)}
                            </div>
                            <div className={`text-[11px] ${isProfit ? "text-rose-400" : "text-emerald-400"}`}>
                              {isProfit ? "+" : ""}
                              {item.pnl_pct.toFixed(2)}%
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <div>振幅 {item.amplitude_pct ?? 0}%</div>
                            <div
                              className={`text-[11px] ${
                                (item.pullback_from_high_pct ?? 0) >= 5 ? "text-amber-300 font-bold" : "text-slate-400"
                              }`}
                            >
                              高回撤 -{item.pullback_from_high_pct ?? 0}%
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <div className="text-amber-300 font-bold">¥{item.stop_loss_price.toFixed(2)}</div>
                            {item.technicals?.ma20 && (
                              <div className="text-[10px] text-slate-400">
                                MA20 ¥{item.technicals.ma20.toFixed(2)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3 min-w-[320px] max-w-[420px] space-y-1.5">
                            <div className="font-bold text-cyan-200">{item.action}</div>
                            {(item.signals || []).map((sig, idx) => (
                              <div
                                key={`${sig.key}-${idx}`}
                                className={`text-[11px] px-2 py-1 rounded border ${
                                  sig.severity === "ACTION"
                                    ? "bg-rose-500/15 border-rose-500/40 text-rose-200"
                                    : "bg-slate-950/70 border-slate-800 text-slate-300"
                                }`}
                              >
                                {sig.message}
                              </div>
                            ))}
                            {item.thesis && (
                              <p className="text-[10px] text-slate-400 line-clamp-2">{item.thesis}</p>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => void handleTriggerAiAnalyze(item.code, item.name)}
                                disabled={aiBusyCode !== null}
                                className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 cursor-pointer"
                                title="AI 深度研判"
                              >
                                <Bot className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingHolding(item);
                                  setHoldingModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer"
                                title="编辑成本与风控参数"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteHolding(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                                title="删除持仓"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: 5日轮动观察池 (POOL) */}
        {/* ========================================================================= */}
        {activeTab === "pool" && (
          <RollingPoolPanel
            onConverted={fetchPortfolioData}
            onTriggerAi={handleTriggerAiAnalyze}
            onNotify={showToast}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 4: 每日四合一看板 (DAILY) */}
        {/* ========================================================================= */}
        {activeTab === "daily" && (
          <DailyBoardView onNotify={showToast} refreshSignal={dailyRefreshSignal} />
        )}
      </div>

      {/* 新增 / 编辑实盘持仓弹窗 */}
      {holdingModalOpen && (
        <HoldingEditModal
          key={editingHolding?.id ? `edit-${editingHolding.id}` : "new-holding"}
          open={holdingModalOpen}
          initial={editingHolding}
          onClose={() => {
            setHoldingModalOpen(false);
            setEditingHolding(null);
          }}
          onSaved={fetchPortfolioData}
          onNotify={showToast}
        />
      )}
    </div>
  );
}
