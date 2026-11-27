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
  { ssr: false, loading: () => <div className="h-[112px] w-full animate-pulse rounded-2xl bg-[#042328]" /> }
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
    <div className="min-h-screen bg-gradient-to-b from-[#F2F7F9] via-[#F8F8F8] to-[#F8F8F4] text-[#0F0F0F] pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative">
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#042328] border border-[#184120] text-xs text-[#FFFFF2] shadow-[0_12px_30px_rgba(4,35,40,0.28)] backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#E1F209] shrink-0" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* 顶部主工作台标头（高定墨绿旗舰横幅） */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#042328] via-[#042328] to-[#184120] border border-[#184120] shadow-[0_18px_48px_rgba(4,35,40,0.18)]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFFFFF]/10 border border-[#E1F209]/35 text-[#E1F209]">
                <Activity className="h-4.5 w-4.5" />
              </span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#FFFFF2] flex flex-wrap items-center gap-2 font-mono">
                  CHEN TECH STUDIO ｜ A股波段纪律与5日轮动工作台
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#E1F209] text-[#042328]">
                    主板+创业板
                  </span>
                </h1>
                <p className="text-xs text-[#E0E7D9]/85">
                  盘前全天计划 · 盘中5分钟规则监控 · 5日轮动观察池 · 异常自动唤醒AI研判
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                tradingStatus.isTrading
                  ? "bg-[#184120] text-[#FFFFF2] border-[#33DD18]/45"
                  : "bg-[#FFFFFF]/10 text-[#E0E7D9] border-[#FFFFFF]/15"
              }`}
              title={tradingStatus.detail}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  tradingStatus.isTrading ? "bg-[#33DD18] animate-pulse" : "bg-[#C8C8C8]"
                }`}
              />
              <span className="font-bold">{tradingStatus.statusText}</span>
              <span className="text-[10px] text-[#E0E7D9]/75 hidden sm:inline">({tradingStatus.cstTimeStr})</span>
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
                  ? "bg-[#FFFFFF]/8 text-[#C8C8C8] border-[#FFFFFF]/15 cursor-not-allowed opacity-70"
                  : autoRefresh
                  ? "bg-[#E1F209] text-[#042328] border-[#E1F209] font-bold cursor-pointer"
                  : "bg-[#FFFFFF]/10 text-[#FFFFF2] border-[#FFFFFF]/20 cursor-pointer"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {!tradingStatus.isTrading ? "5分轮询: 自动停刷" : autoRefresh ? "5分轮询: 开启" : "5分轮询: 关闭"}
            </button>

            <button
              onClick={() => void loadAll(true)}
              disabled={isRefreshing || isLoading}
              className="px-3 py-1.5 rounded-xl border bg-[#FFFFFF]/12 hover:bg-[#FFFFFF]/20 text-[#FFFFF2] border-[#FFFFFF]/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? "animate-spin" : ""}`} />
              刷新
            </button>

            <button
              onClick={() => {
                setEditingHolding(null);
                setHoldingModalOpen(true);
              }}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-[#E1F209] hover:bg-[#FFFFF2] text-[#042328] border border-[#E1F209] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              录入持仓
            </button>

            <button
              onClick={() => void handleTriggerAiAnalyze()}
              disabled={aiBusyCode !== null}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-[#184120] hover:bg-[#263844] text-[#FFFFF2] border border-[#33DD18]/35 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Bot className="w-3.5 h-3.5 text-[#E1F209]" />
              {aiBusyCode === "ALL" ? "AI研判中..." : "AI 立即看盘"}
            </button>

            <WorkspaceLogout />
          </div>
        </div>

        {/* 投研晨报快捷入口 */}
        <MorningBriefingHero onOpenReportTab={() => setActiveTab("daily")} showToast={showToast} />

        {/* 主导航 Tabs (4个纯粹实战工作区) */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#FFFFFF] border border-[#D8D8E4] w-full overflow-x-auto no-scrollbar shadow-[0_6px_20px_rgba(4,35,40,0.04)]">
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
                  isActive ? "text-[#FFFFF2] font-bold" : "text-[#263844] hover:text-[#0F0F0F] hover:bg-[#F8F8F4]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="market-main-tab-pill"
                    className="absolute inset-0 rounded-xl bg-[#042328] shadow-[0_6px_16px_rgba(4,35,40,0.2)] border border-[#184120]"
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  />
                )}
                <Icon className={`relative z-10 w-3.5 h-3.5 ${isActive ? "text-[#E1F209]" : "text-[#263844]"}`} />
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
              <div className="lg:col-span-2 rounded-3xl bg-[#FFFFFF] border border-[#D8D8E4] p-5 space-y-3 shadow-[0_8px_28px_rgba(4,35,40,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#042328]" />
                    <h2 className="text-sm font-bold text-[#0F0F0F]">实盘持仓波段纪律监控</h2>
                    {actionCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D71018] text-[#FFFFFF] text-[10px] font-bold">
                        {actionCount} 只触发行动线
                      </span>
                    )}
                    {escalatedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#042328] text-[#E1F209] text-[10px] font-bold">
                        {escalatedCount} 只盘中异动
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("portfolio")}
                      className="text-xs text-[#042328] font-semibold hover:underline cursor-pointer"
                    >
                      进入持仓详情 →
                    </button>
                  </div>
                </div>

                {holdings.length === 0 ? (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-xs text-[#263844]">当前账户暂未录入实盘持仓，可一键导入兴森科技与3只观察股或手动录入。</p>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSeedSelect()}
                        disabled={seeding}
                        className="px-3 py-1.5 rounded-xl bg-[#E0E7D9] border border-[#184120]/30 text-[#184120] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
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
                        className="px-3 py-1.5 rounded-xl bg-[#042328] text-[#FFFFF2] font-bold text-xs cursor-pointer"
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
                            ? "bg-[#D71018]/6 border-[#D71018]/35"
                            : h.llm_escalate
                            ? "bg-[#FFFFF2] border-[#042328]/35"
                            : "bg-[#F8F8F4] border-[#E0E0E0]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#0F0F0F] text-sm">{h.name}</span>
                            <span className="ml-1.5 font-mono text-[#263844]">{h.code}</span>
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#D8D8E4] text-[#042328] font-medium">
                              {h.position_mode === "deep_drawdown_recovery" ? "深套修复" : "标准波段"}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="font-bold text-[#0F0F0F]">¥{h.current_price.toFixed(2)}</span>
                            <span
                              className={`ml-1.5 font-bold ${
                                h.day_change_pct >= 0 ? "text-[#D71018]" : "text-[#184120]"
                              }`}
                            >
                              {h.day_change_pct >= 0 ? "+" : ""}
                              {h.day_change_pct.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#263844]">
                          <span>
                            浮盈{" "}
                            <strong className={h.pnl >= 0 ? "text-[#D71018]" : "text-[#184120]"}>
                              {h.pnl >= 0 ? "+" : ""}
                              {h.pnl_pct.toFixed(2)}%
                            </strong>
                          </span>
                          <span>
                            振幅 {h.amplitude_pct ?? 0}% · 高点回撤 -{h.pullback_from_high_pct ?? 0}%
                          </span>
                        </div>
                        <div className="text-[11px] text-[#282828] bg-[#FFFFFF] px-2.5 py-1.5 rounded-lg border border-[#E4E4E8]">
                          {h.advice_reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 右侧：快捷操作与资产总览 */}
              <div className="rounded-3xl bg-[#FFFFFF] border border-[#D8D8E4] p-5 flex flex-col justify-between space-y-4 shadow-[0_8px_28px_rgba(4,35,40,0.05)]">
                <div className="space-y-2">
                  <div className="text-xs text-[#263844] font-medium">账户持仓总市值</div>
                  <div className="text-2xl font-black text-[#0F0F0F] font-mono">
                    ¥ {formatMoney(diagnoseSummary?.total_market_value || 0)}
                  </div>
                  <div
                    className={`text-xs font-mono font-bold ${
                      (diagnoseSummary?.total_pnl || 0) >= 0 ? "text-[#D71018]" : "text-[#184120]"
                    }`}
                  >
                    累计浮盈 {(diagnoseSummary?.total_pnl || 0) >= 0 ? "+" : ""}
                    {formatMoney(diagnoseSummary?.total_pnl || 0)} ({(diagnoseSummary?.total_pnl_pct || 0).toFixed(2)}%)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E0E0E0] text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("pool")}
                    className="p-2.5 rounded-xl bg-[#F8F8F4] hover:bg-[#E0E7D9]/70 border border-[#D8D8E4] text-left cursor-pointer"
                  >
                    <div className="font-bold text-[#042328] flex items-center gap-1">
                      <Radar className="w-3.5 h-3.5" />
                      5日观察池
                    </div>
                    <div className="text-[10px] text-[#263844] mt-0.5">查看买点A/B触发状态</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("daily")}
                    className="p-2.5 rounded-xl bg-[#F8F8F4] hover:bg-[#E0E7D9]/70 border border-[#D8D8E4] text-left cursor-pointer"
                  >
                    <div className="font-bold text-[#184120] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      每日看板
                    </div>
                    <div className="text-[10px] text-[#263844] mt-0.5">01盘前 / 02播报 / 03选股 / 04AI</div>
                  </button>
                </div>
              </div>
            </div>

            {/* 全市场短线量化盘口与红绿灯总闸门 */}
            <MarketSentimentMetricsBar initialMetrics={marketData?.sentiment_metrics} />

            {/* 全景核心 4 联指标看板 */}
            {marketData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#D8D8E4] shadow-[0_8px_28px_rgba(4,35,40,0.05)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#263844] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#042328] animate-pulse" />
                      情绪温度与红绿灯
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#042328] text-[#E1F209] font-mono font-semibold">
                      {marketData.market_state}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-[#0F0F0F] font-mono">
                      {trafficLight?.score ?? marketData.market_score}
                    </span>
                    <span className="text-xs text-[#263844] font-mono">/ 100</span>
                  </div>
                  <QuantumRadar3D
                    score={trafficLight?.score ?? marketData.market_score}
                    marketState={trafficLight?.label ?? marketData.market_state}
                  />
                  <p className="text-xs text-[#263844] flex items-center gap-1.5 pt-1.5 border-t border-[#E0E0E0]">
                    <Flame className="w-3.5 h-3.5 text-[#D71018] shrink-0" />
                    <span className="text-[#0F0F0F] font-bold truncate">{marketData.market_style}</span>
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#D8D8E4] shadow-[0_8px_28px_rgba(4,35,40,0.05)] flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-[#263844] flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-[#042328]" />
                      建议总仓位
                    </span>
                    <div className="mt-2 text-3xl font-black text-[#042328] font-mono">
                      {marketData.suggested_position}
                    </div>
                    <p className="text-[11px] text-[#282828] mt-1">
                      {trafficLight?.summary || diagnoseSummary?.overall_action}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E0E0E0] space-y-1.5">
                    <span className="text-xs font-semibold text-[#263844] flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#D71018]" />
                      两市成交额
                    </span>
                    <div className="text-2xl font-bold text-[#0F0F0F] font-mono">
                      {marketData.total_turnover_text || "--"}
                    </div>
                    <div className="text-[11px] text-[#263844] font-mono">
                      {(marketData.volume_metrics as { status_detail?: string })?.status_detail || "实时统计中"}
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#D8D8E4] shadow-[0_8px_28px_rgba(4,35,40,0.05)] md:col-span-2 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#263844] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#042328]" />
                      四大核心股指实时全景
                    </span>
                    <span className="text-[10px] text-[#263844]/80 font-mono">
                      更新时间: {marketData.snapshot_time}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {marketData.indices.slice(0, 4).map((idx) => {
                      const isUp = idx.change_pct >= 0;
                      return (
                        <div
                          key={idx.code}
                          className="p-3 rounded-2xl bg-[#F8F8F4] border border-[#E0E0E0] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#0F0F0F] truncate">{idx.name}</span>
                              <span className="text-[10px] text-[#263844] font-mono">{idx.code}</span>
                            </div>
                            <div className="text-base font-black text-[#0F0F0F] mt-1 font-mono">
                              {idx.close.toFixed(2)}
                            </div>
                            <div
                              className={`text-xs font-bold flex items-center gap-0.5 mt-0.5 ${
                                isUp ? "text-[#D71018]" : "text-[#184120]"
                              }`}
                            >
                              {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              <span>{idx.change_pct > 0 ? `+${idx.change_pct}%` : `${idx.change_pct}%`}</span>
                            </div>
                          </div>
                          <div className="mt-2 pt-1 border-t border-[#E4E4E8]">
                            <SparklineChart changePct={idx.change_pct} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-[#E0E0E0] flex items-center justify-between text-xs">
                    <span className="text-[#263844] font-medium flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-[#042328]" />
                      全市场涨跌分布
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-[#D71018] font-bold">涨 {marketData.up_count ?? "--"}</span>
                      <span className="text-[#263844]">平 {marketData.flat_count ?? "--"}</span>
                      <span className="text-[#184120] font-bold">跌 {marketData.down_count ?? "--"}</span>
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
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#D8D8E4] shadow-[0_8px_28px_rgba(4,35,40,0.05)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0F0F0F] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#042328]" />
                  我的实盘持仓与波段纪律穿透
                  <span className="text-xs font-normal text-[#263844]">({holdings.length} 只标的)</span>
                </h2>
                <p className="text-xs text-[#263844] mt-0.5">
                  支持标准波段（+15%/+25%止盈、-8%止损、MA20+板块防守）与深套修复双模式，实时捕获日内冲高回落与深V异动。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSeedSelect()}
                  disabled={seeding}
                  className="px-3 py-2 rounded-xl bg-[#E0E7D9] hover:bg-[#E0E7D9]/80 text-[#184120] border border-[#184120]/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-[#042328] hover:bg-[#184120] text-[#FFFFF2] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E1F209]" />
                  <span>录入新持仓</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar rounded-2xl border border-[#D8D8E4]">
              <table className="w-full text-left text-xs text-[#282828] min-w-[1060px]">
                <thead className="bg-[#F8F8F4] text-[#042328] font-semibold border-b border-[#D8D8E4]">
                  <tr>
                    <th className="py-3 px-3">标的 / 模式</th>
                    <th className="py-3 px-3">板块 / 强度</th>
                    <th className="py-3 px-3 text-right">持股 / 可卖</th>
                    <th className="py-3 px-3 text-right">成本 / 现价</th>
                    <th className="py-3 px-3 text-right">浮盈亏</th>
                    <th className="py-3 px-3 text-right">日内振幅 / 高撤</th>
                    <th className="py-3 px-3 text-right">防守 / 止损位</th>
                    <th className="py-3 px-3 min-w-[320px]">规则信号与操作建议</th>
                    <th className="py-3 px-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E8]">
                  {holdings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#263844]">
                        暂无实盘持仓，点击右上角「录入新持仓」或「导入兴森科技+3只观察股」。
                      </td>
                    </tr>
                  ) : (
                    holdings.map((item) => {
                      const isProfit = item.pnl >= 0;
                      return (
                        <tr key={item.id || item.code} className="hover:bg-[#F2F7F9]/75 align-top">
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-[#0F0F0F]">
                              {item.name} <span className="font-mono text-[#042328]">{item.code}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                                  item.position_mode === "deep_drawdown_recovery"
                                    ? "bg-[#FFFFF2] text-[#0F0F0F] border-[#C8C8C8]"
                                    : "bg-[#E0E7D9] text-[#184120] border-[#184120]/25"
                                }`}
                              >
                                {item.position_mode === "deep_drawdown_recovery" ? "深套修复" : "标准波段"}
                              </span>
                              {item.board && <span className="text-[10px] text-[#263844]">{item.board}</span>}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="text-[#0F0F0F] font-medium">{item.sector || "--"}</div>
                            {typeof item.sector_change_pct === "number" && (
                              <div
                                className={`text-[11px] font-mono font-semibold ${
                                  item.sector_change_pct >= 0 ? "text-[#D71018]" : "text-[#184120]"
                                }`}
                              >
                                {item.sector_change_pct >= 0 ? "+" : ""}
                                {item.sector_change_pct.toFixed(2)}%
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <div className="text-[#0F0F0F] font-semibold">{item.quantity.toLocaleString()}</div>
                            <div className="text-[10px] text-[#263844]">
                              可卖 {(item.available_quantity ?? item.quantity).toLocaleString()}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <div className="text-[#263844]">成本 ¥{item.cost_price.toFixed(2)}</div>
                            <div className="text-[#0F0F0F] font-bold">
                              现价 ¥{item.current_price.toFixed(2)}
                              <span
                                className={`ml-1 text-[10px] font-bold ${
                                  item.day_change_pct >= 0 ? "text-[#D71018]" : "text-[#184120]"
                                }`}
                              >
                                {item.day_change_pct >= 0 ? "+" : ""}
                                {item.day_change_pct.toFixed(2)}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <div className={`font-bold ${isProfit ? "text-[#D71018]" : "text-[#184120]"}`}>
                              {isProfit ? "+" : ""}
                              {item.pnl.toFixed(0)}
                            </div>
                            <div className={`text-[11px] font-semibold ${isProfit ? "text-[#D71018]" : "text-[#184120]"}`}>
                              {isProfit ? "+" : ""}
                              {item.pnl_pct.toFixed(2)}%
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <div>振幅 {item.amplitude_pct ?? 0}%</div>
                            <div
                              className={`text-[11px] ${
                                (item.pullback_from_high_pct ?? 0) >= 5 ? "text-[#D71018] font-bold" : "text-[#263844]"
                              }`}
                            >
                              高回撤 -{item.pullback_from_high_pct ?? 0}%
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                            <div className="text-[#042328] font-bold">¥{item.stop_loss_price.toFixed(2)}</div>
                            {item.technicals?.ma20 && (
                              <div className="text-[10px] text-[#263844]">
                                MA20 ¥{item.technicals.ma20.toFixed(2)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3 min-w-[320px] max-w-[420px] space-y-1.5">
                            <div className="font-bold text-[#042328]">{item.action}</div>
                            {(item.signals || []).map((sig, idx) => (
                              <div
                                key={`${sig.key}-${idx}`}
                                className={`text-[11px] px-2 py-1 rounded border ${
                                  sig.severity === "ACTION"
                                    ? "bg-[#D71018]/8 border-[#D71018]/30 text-[#D71018] font-medium"
                                    : "bg-[#F8F8F4] border-[#E0E0E0] text-[#282828]"
                                }`}
                              >
                                {sig.message}
                              </div>
                            ))}
                            {item.thesis && (
                              <p className="text-[10px] text-[#263844] line-clamp-2">{item.thesis}</p>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => void handleTriggerAiAnalyze(item.code, item.name)}
                                disabled={aiBusyCode !== null}
                                className="p-1.5 rounded-lg bg-[#042328] hover:bg-[#184120] text-[#E1F209] border border-[#184120] cursor-pointer"
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
                                className="p-1.5 rounded-lg bg-[#F8F8F4] hover:bg-[#E0E7D9] text-[#042328] border border-[#D8D8E4] cursor-pointer"
                                title="编辑成本与风控参数"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteHolding(item.id)}
                                className="p-1.5 rounded-lg text-[#263844] hover:text-[#D71018] hover:bg-[#D71018]/10 cursor-pointer"
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
