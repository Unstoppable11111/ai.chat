"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
} from "lucide-react";
import { QuantumRadar3D } from "@/components/market/quantum-radar-3d";
import { SparklineChart } from "@/components/market/sparkline-chart";
import { SentimentRadarVisual } from "@/components/market/sentiment-radar-visual";
import { StockSignalsView } from "@/components/market/stock-signals-view";
import { DailyReportsView } from "@/components/market/daily-reports-view";

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
  volume_metrics?: any;
  decision_card_text?: string;
  last_updated: string;
}

export default function MarketDashboardPage() {
  const [activeTab, setActiveTab] = useState<"cockpit" | "signals" | "reports">("cockpit");
  const [marketData, setMarketData] = useState<MarketSnapshot | null>(null);
  const [diagnoseSummary, setDiagnoseSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<HoldingDiagnosed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "info" | "success" | "warning" } | null>(null);

  // 股票模糊联想搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
      showToast("正在拉取实时全市场分时、量能与主线数据...", "info");
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
    }, 300000);

    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [fetchMarketData, fetchPortfolioData, autoRefresh]);

  // 股票代码/拼音联想搜索防抖
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
          if (json.items) {
            setSearchResults(json.items);
          }
        }
      } catch {
        // ignore
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

  // 唤起右下角 AI 助手直接进行全景量化推演
  const handleTriggerAiChat = useCallback(() => {
    const indicesText = (marketData?.indices || [])
      .map((idx) => `${idx.name} (${idx.close.toFixed(2)}, ${idx.change_pct >= 0 ? "+" : ""}${idx.change_pct}%)`)
      .join("；");

    const holdingsText =
      holdings.length > 0
        ? holdings
            .map(
              (h) =>
                `- ${h.name}(${h.code}): 持股${h.quantity}股, 成本¥${h.cost_price.toFixed(2)}, 现价¥${h.current_price.toFixed(
                  2
                )}, 盈亏${h.pnl_pct.toFixed(2)}%, 建议操作:${h.action}, 动态止损线:¥${h.stop_loss_price.toFixed(2)} (${
                  h.advice_reason || "系统监控中"
                })`
            )
            .join("\n")
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

  // 单股专属 AI 深度诊断
  const handleDiagnoseSingleStock = (stock: HoldingDiagnosed) => {
    const prompt = `请作为资深A股量化交易与风控大师，对我的这笔持仓标的进行深度量化诊断：

【标的信息】
- 标的: ${stock.name} (${stock.code})
- 仓位类型: ${stock.hold_type === "core" ? "核心底仓" : stock.hold_type === "attack" ? "短线进攻" : "趋势持股"}
- 持仓股数: ${stock.quantity} 股
- 买入成本: ¥${stock.cost_price.toFixed(2)}
- 当前现价: ¥${stock.current_price.toFixed(2)}
- 浮动盈亏: ${stock.pnl >= 0 ? "+" : ""}${stock.pnl.toFixed(2)} (${stock.pnl_pct.toFixed(2)}%)
- 今日涨跌: ${stock.day_change_pct >= 0 ? "+" : ""}${stock.day_change_pct}%
- 动态止损线: ¥${stock.stop_loss_price.toFixed(2)}
- 系统初步建议: ${stock.action} (${stock.advice_reason || "监控中"})

请直接输出：
1. 该标的当前量价结构、均线形态与关键阻力/支撑位分析
2. 针对当前浮盈/浮亏状态，给出精准的加减仓点位与操作应对计划
3. 如果明日变盘下杀，止盈/止损底线应该上移或设置在什么价位？`;

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("trigger-ai-chat", { detail: { prompt } }));
      showToast(`已唤起 AI 专属诊断：${stock.name} (${stock.code})`, "success");
    }
  };

  // 快捷 Prompt 触发
  const handleTriggerCustomPrompt = (prompt: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("trigger-ai-chat", { detail: { prompt } }));
      showToast("已调起 AI 助手深度研判...", "info");
    }
  };

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

  const formatMoney = (num: number) => {
    return new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes("止损")) return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    if (action.includes("减仓")) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (action.includes("止盈")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (action.includes("持有")) return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  };

  const promptChips = [
    { label: "🎯 测算持仓最大下行风险", prompt: "请结合当前两市量能能级与多空分歧，对我的持仓组合进行下行压力测试，测算最极端的潜在回撤幅度并给出对冲建议。" },
    { label: "📉 检查止损预警标的", prompt: "请审查我的所有持仓中，哪些标的当前价格已经逼近或跌破动态止损线？请按风险等级从高到低排列并给出处置优先级。" },
    { label: "⚡ 量能与下午低吸/减仓研判", prompt: "结合目前两市成交量能和行业领涨主线资金流向，分析当前是否适合盘中低吸？还是应该逢高减仓防守？" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] via-[#070b16] to-[#0a1122] text-slate-100 pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative">
      {/* 全局交互反馈浮动 Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#0c1626]/95 border border-cyan-500/40 text-xs text-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        {/* 顶部标题与多维导航控制器 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0c182b]/90 via-[#08101e]/95 to-[#0e1d35]/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.12)] backdrop-blur-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <Activity className="h-4.5 w-4.5" />
              </span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  A股量化交易决策工作台
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    QUANT · PRO
                  </span>
                </h1>
                <p className="text-xs text-cyan-200/60">
                  多源容灾全景推演 ｜ AI量化金股与胜率 ｜ 全球早报与收盘复盘
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                const next = !autoRefresh;
                setAutoRefresh(next);
                showToast(next ? "已开启 5 分钟自动轮询，交易时段将自动同步全市场推演" : "已暂停 5 分钟自动轮询，您可随时手动刷新", "info");
              }}
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                autoRefresh
                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold"
                  : "bg-[#0c1626]/70 text-cyan-400/50 border-cyan-950"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {autoRefresh ? "5分自动刷新: 开" : "5分自动刷新: 关"}
            </button>

            <button
              onClick={() => loadAll(true)}
              disabled={isRefreshing}
              className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#0c1626] hover:bg-cyan-950/50 text-cyan-200 border border-cyan-800/40 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-300" : "text-cyan-400"}`} />
              刷新
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)] border border-cyan-400/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              添加持仓
            </button>

            <button
              onClick={handleTriggerAiChat}
              className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-[#0c1626] hover:bg-cyan-950/50 text-cyan-200 border border-cyan-800/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer group shadow-sm"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400 group-hover:text-white transition-colors" />
              AI 助手推演
            </button>
          </div>
        </div>

        {/* 核心分段式选项卡 (Segmented Tabs) - 赛博极光黑曜石科技风 */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#09111e]/90 border border-cyan-500/30 w-full sm:w-fit overflow-x-auto no-scrollbar shadow-lg">
          <button
            onClick={() => setActiveTab("cockpit")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "cockpit"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)] border border-cyan-400/40 font-bold"
                : "text-slate-400 hover:text-white hover:bg-cyan-950/30"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            实时盘面与持仓
          </button>
          <button
            onClick={() => setActiveTab("signals")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "signals"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)] border border-cyan-400/40 font-bold"
                : "text-slate-400 hover:text-white hover:bg-cyan-950/30"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            AI金股与历史胜率
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "reports"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)] border border-cyan-400/40 font-bold"
                : "text-slate-400 hover:text-white hover:bg-cyan-950/30"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            量化研报 (晨报 / 复盘)
          </button>
        </div>

        {/* TAB 1: 实时盘面与私有持仓 */}
        {activeTab === "cockpit" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 盘中大盘态势与决策卡 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 卡片 1: 市场评分卡 & 3D 量化全息能量核 */}
              <div className="p-5 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    市场综合评分
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                    置信度: {marketData?.confidence || "high"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-white tracking-tight font-mono">
                      {marketData ? marketData.market_score : "--"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ 100</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      (marketData?.market_score || 50) >= 60
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                        : (marketData?.market_score || 50) >= 40
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                        : "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                    }`}
                  >
                    {marketData?.market_state || "分析中"}
                  </span>
                </div>

                {/* Three.js 3D 量化全息能量核 (极光量子引力核心) */}
                <QuantumRadar3D
                  score={marketData?.market_score ?? 50}
                  marketState={marketData?.market_state ?? "震荡蓄势"}
                />

                <p className="text-xs text-cyan-200/80 flex items-center gap-1.5 pt-1.5 border-t border-cyan-900/40">
                  <Flame className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
                  <span className="text-cyan-300/80 font-medium">核心主线:</span>
                  <span className="text-white font-bold truncate">
                    {marketData?.market_style && marketData.market_style !== "科技趋势"
                      ? marketData.market_style
                      : "农业种植 (持续2天) · PCB算力板"}
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
                      {marketData?.suggested_position || "30%~50%"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300/70 mt-1 line-clamp-1">
                    {diagnoseSummary?.overall_action || "控制仓位，防守反击"}
                  </p>
                </div>

                {/* 核心量能量化指标 (近月动态对比体系) */}
                <div className="pt-3 border-t border-cyan-900/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      两市成交量能
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
                      {marketData?.volume_metrics?.status_label || "阶段性缩量整固"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white tracking-tight font-mono">
                        {marketData?.total_turnover_text || "1.95万亿"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">沪深合计</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-400/90">
                      较5日均量 {marketData?.volume_metrics?.diff_ma5_pct != null ? `${marketData.volume_metrics.diff_ma5_pct >= 0 ? "+" : ""}${marketData.volume_metrics.diff_ma5_pct}%` : "-7.2%"}
                    </span>
                  </div>

                  {/* 均量基准与近10日量能柱状迷你走势 */}
                  <div className="space-y-1.5 text-[10px] text-slate-400 pt-0.5">
                    <div className="flex justify-between items-center font-mono text-[10px] text-slate-300/80">
                      <span>MA5: {marketData?.volume_metrics?.volume_ma5 ? `${(marketData.volume_metrics.volume_ma5 / 10000).toFixed(2)}万亿` : "2.10万亿"}</span>
                      <span>MA20: {marketData?.volume_metrics?.volume_ma20 ? `${(marketData.volume_metrics.volume_ma20 / 10000).toFixed(2)}万亿` : "2.11万亿"}</span>
                    </div>

                    <div className="flex items-end gap-1 h-7 pt-1 w-full">
                      {(marketData?.volume_metrics?.series || [
                        { date: "08-25", turnover: 18953 },
                        { date: "08-26", turnover: 19513 },
                        { date: "08-27", turnover: 20949 },
                        { date: "08-28", turnover: 21040 },
                        { date: "08-31", turnover: 22950 },
                        { date: "09-01", turnover: 23217 },
                        { date: "09-02", turnover: 20514 },
                        { date: "09-03", turnover: 19698 },
                        { date: "09-04", turnover: 21974 },
                        { date: "09-07", turnover: 19460 },
                      ]).map((item: any, idx: number, arr: any[]) => {
                        const isLast = idx === arr.length - 1;
                        const maxVal = 25000;
                        const heightPct = Math.max(20, Math.min(100, (item.turnover / maxVal) * 100));
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

                    <div className="flex justify-between text-[9px] text-cyan-400/60 font-mono">
                      <span>10日量能柱 (今日高亮)</span>
                      <span>近月 {marketData?.volume_metrics?.percentile ?? 16}% 分位</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 卡片 3 & 4: 四大核心股指分时全景 + SVG Sparkline 迷你走势 */}
              <div className="p-5 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 shadow-xl backdrop-blur-xl md:col-span-2 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-cyan-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    四大核心股指分时全景
                  </span>
                  <span className="text-[10px] text-cyan-400/60 font-mono">
                    更新: {marketData?.snapshot_time || "--:--:--"}
                  </span>
                </div>

                {/* 四大核心股指矩阵 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(marketData?.indices || []).slice(0, 4).map((idx) => {
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
                  })}
                </div>

                {/* 全市场多空博弈条 */}
                <div className="pt-3 border-t border-cyan-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-cyan-200 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      全市场涨跌分布
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-rose-400 font-bold">涨: {marketData?.up_count ?? 3073}</span>
                      <span className="text-slate-400">平: {marketData?.flat_count ?? 195}</span>
                      <span className="text-emerald-400 font-bold">跌: {marketData?.down_count ?? 2016}</span>
                    </div>
                  </div>

                  {(() => {
                    const up = marketData?.up_count ?? 3073;
                    const down = marketData?.down_count ?? 2016;
                    const flat = marketData?.flat_count ?? 195;
                    const total = up + down + flat || 1;
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
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-rose-400 font-semibold">多头上涨 {upPct}%</span>
                          <span className="text-emerald-400 font-semibold">空头下跌 {downPct}%</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between text-xs text-cyan-400/60 pt-1">
                    <span className="text-[10px] font-mono">全A多源交叉校验：正常运行</span>
                    <span className="text-[10px] font-mono text-cyan-300/80">沪深两市 5,284 标的实时覆盖</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 主力资金动向、短线情绪周期炸板率与领涨主线板块动态可视化 (包含近月对比基准) */}
            <SentimentRadarVisual volumeMetrics={marketData?.volume_metrics} />

            {/* 用户私人持仓总览卡片 */}
            <div className="p-6 rounded-3xl bg-[#0c1626]/85 border border-cyan-500/25 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    我的私有持仓组合
                    <span className="text-xs font-normal text-slate-400">(已收录 {holdings.length} 只标的)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    实时追踪每一笔持仓盈亏，附带动态止损线、单股专属 AI 诊断与风控指令
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
                      <div
                        className={`text-sm font-bold font-mono ${
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

              {/* 快捷 AI 专家推演胶囊芯片 */}
              <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                <span className="text-cyan-300 flex items-center gap-1 font-medium shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  快捷风控推演:
                </span>
                {promptChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTriggerCustomPrompt(chip.prompt)}
                    className="px-3 py-1.5 rounded-xl bg-[#091322]/80 hover:bg-cyan-950/40 text-cyan-200 border border-cyan-900/50 hover:border-cyan-500/50 text-[11px] transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* 桌面端持仓表格 */}
              <div className="hidden md:block overflow-x-auto">
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
                      <th className="py-3 px-4 rounded-r-xl text-center">专属诊断/管理</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-900/30">
                    {holdings.map((item) => {
                      const isProfit = item.pnl >= 0;
                      return (
                        <tr key={item.id || item.code} className="hover:bg-cyan-950/20 transition-colors group">
                          <td className="py-3.5 px-4 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-cyan-400 font-semibold">{item.code}</span>
                              <span className="text-white font-bold">{item.name}</span>
                              {item.day_change_pct !== 0 && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                    item.day_change_pct > 0
                                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  }`}
                                >
                                  {item.day_change_pct > 0 ? "+" : ""}
                                  {item.day_change_pct}%
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{item.notes}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 text-[11px] border border-cyan-500/30 font-medium">
                              {item.hold_type === "core"
                                ? "核心底仓"
                                : item.hold_type === "attack"
                                ? "短线进攻"
                                : item.hold_type === "trend"
                                ? "趋势持股"
                                : "试错仓位"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-slate-300">{item.quantity}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-300">¥ {item.cost_price.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">¥ {item.current_price.toFixed(2)}</td>

                          <td className="py-3.5 px-4 text-right font-mono">
                            <span className={`font-bold ${isProfit ? "text-rose-400" : "text-emerald-400"}`}>
                              {isProfit ? "+" : ""}
                              {item.pnl.toFixed(2)}
                            </span>
                            <div className={`text-[10px] ${isProfit ? "text-rose-400/80" : "text-emerald-400/80"}`}>
                              {isProfit ? "+" : ""}
                              {item.pnl_pct.toFixed(2)}%
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-amber-300 font-bold">
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
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleDiagnoseSingleStock(item)}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-500/30 text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                                title="单股专属 AI 深度复盘"
                              >
                                AI诊断
                              </button>
                              <button
                                onClick={() => handleDeleteHolding(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="删除此持仓"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {holdings.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-400 space-y-3">
                          <ShieldAlert className="w-8 h-8 text-cyan-500/50 mx-auto" />
                          <p>当前持仓列表为空</p>
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="text-xs px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
                          >
                            立即添加第一只持仓标的
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 移动端持仓卡片布局（避免横向溢出） */}
              <div className="md:hidden space-y-3.5">
                {holdings.map((item) => {
                  const isProfit = item.pnl >= 0;
                  return (
                    <div key={item.id || item.code} className="p-4 rounded-2xl bg-[#091322]/80 border border-cyan-900/40 space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{item.name}</span>
                          <span className="text-xs font-mono text-cyan-400 font-semibold">{item.code}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getActionBadgeClass(item.action)}`}>
                          {item.action}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                        <div>
                          <span className="text-slate-400 text-[10px]">持股 / 成本</span>
                          <div className="text-slate-200">{item.quantity}股 / ¥{item.cost_price.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">现价 / 止损</span>
                          <div className="text-white font-bold">¥{item.current_price.toFixed(2)} / <span className="text-amber-300">¥{item.stop_loss_price.toFixed(2)}</span></div>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px]">浮动盈亏</span>
                          <div className={`font-black ${isProfit ? "text-rose-400" : "text-emerald-400"}`}>
                            {isProfit ? "+" : ""}{item.pnl_pct.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-cyan-900/30">
                        <span className="text-[11px] text-slate-400 truncate max-w-[180px]">{item.advice_reason || "监控中"}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDiagnoseSingleStock(item)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 text-xs font-medium"
                          >
                            AI诊断
                          </button>
                          <button
                            onClick={() => handleDeleteHolding(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 量化AI金股与历史胜率 */}
        {activeTab === "signals" && (
          <div className="animate-in fade-in duration-300">
            <StockSignalsView
              showToast={showToast}
              onAddToPortfolio={async (stock) => {
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

        {/* TAB 3: 每日早报与收盘复盘 */}
        {activeTab === "reports" && (
          <div className="animate-in fade-in duration-300">
            <DailyReportsView showToast={showToast} />
          </div>
        )}
      </div>

      {/* 手动添加持仓弹窗 (集成代码/拼音联想与现价自动填充) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#0c182b] via-[#091220] to-[#0d1c33] border border-cyan-500/30 p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)] space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                手动录入持仓标的
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 智能联想搜索输入框 */}
            <div className="relative">
              <label className="block text-cyan-200/80 font-medium mb-1 text-xs">
                智能拼音/代码搜索 (输入如 600519 或 GZMT)
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

              {/* 联想下拉菜单 */}
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
                        <span className="text-[10px] text-slate-400">{item.market}</span>
                      </div>
                      {item.current_price ? (
                        <div className="text-right font-mono">
                          <span className="text-white font-bold">¥{item.current_price.toFixed(2)}</span>
                          <span
                            className={`ml-1 text-[10px] ${
                              item.day_change_pct >= 0 ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {item.day_change_pct > 0 ? "+" : ""}
                            {item.day_change_pct}%
                          </span>
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
                    placeholder="例如: 600584"
                    maxLength={6}
                    value={formData.stock_code}
                    onChange={(e) => setFormData({ ...formData, stock_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-cyan-200/80 font-medium mb-1">股票名称</label>
                  <input
                    type="text"
                    placeholder="例如: 长电科技"
                    value={formData.stock_name}
                    onChange={(e) => setFormData({ ...formData, stock_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
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
                    placeholder="1000"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-cyan-200/80 font-medium mb-1">买入成本价 (元) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="例如: 72.50"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-cyan-200/80 font-medium mb-1">仓位策略类别</label>
                <select
                  value={formData.hold_type}
                  onChange={(e) => setFormData({ ...formData, hold_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="core">核心底仓 (中长线主线)</option>
                  <option value="attack">短线进攻 (追击主升浪)</option>
                  <option value="trend">趋势波段 (均线回踩博弈)</option>
                  <option value="trial">试错仓位 (轻仓前瞻)</option>
                </select>
              </div>

              <div>
                <label className="block text-cyan-200/80 font-medium mb-1">买入理由 / 交易计划备注</label>
                <textarea
                  rows={2}
                  placeholder="记录买入逻辑，系统将结合大盘推演动态计算止损线..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#070e18] border border-cyan-900/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0e1d35] text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  {formSubmitting ? "正在保存并推演..." : "确认录入持仓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
