"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Radar,
  Plus,
  Sparkles,
  Trash2,
  ArrowRightCircle,
  RefreshCw,
  Bot,
  DatabaseBackup,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CandlestickChart,
  Search,
  Trophy,
  Activity,
} from "lucide-react";
import type { MarketTrafficLightState, SwingSignalItem } from "@/lib/quant-arena/swing-rules";
import { SignalKlineModal, type SignalTradeRecord } from "@/components/market/signal-kline-modal";

interface SearchStockCandidate {
  code: string;
  name: string;
  current_price?: number | null;
  day_change_pct?: number | null;
}

interface SignalWinRateStatsPayload {
  total_trades: number;
  open_count: number;
  closed_count: number;
  win_count: number;
  loss_count: number;
  win_rate_pct: number;
  avg_pnl_pct: number;
  open_avg_pnl_pct: number;
  profit_factor: number | null;
  cumulative_return_pct: number;
  buy_a_stats: { total: number; closed: number; wins: number; win_rate_pct: number; avg_pnl_pct: number };
  buy_b_stats: { total: number; closed: number; wins: number; win_rate_pct: number; avg_pnl_pct: number };
  equity_curve: Array<{ label: string; equity: number; pnl_pct: number; code: string; name: string }>;
}

export interface EnrichedRollingItem {
  id: number;
  stock_code: string;
  stock_name: string;
  board: string;
  sector: string;
  sector_change_pct?: number;
  added_date: string;
  observed_days: number;
  max_days: number;
  entry_ref_price: number;
  buy_low: number | null;
  buy_high: number | null;
  breakout_price: number | null;
  invalid_price: number | null;
  vol_ratio_5_20: number | null;
  limit_up_count_1y: number | null;
  moat_score: number | null;
  structure_score: number | null;
  thesis: string;
  status: string;
  live_price: number | null;
  live_change_pct: number;
  live_vol_ratio: number;
  dist_to_buy_high_pct: number | null;
  dist_to_breakout_pct: number | null;
  dist_to_invalid_pct?: number | null;
  dist_ma20_pct?: number | null;
  amp_20d_pct?: number | null;
  rr_ratio?: number | null;
  triggered_signal: "BUY_A" | "BUY_B" | "INVALIDATED" | null;
  signals: SwingSignalItem[];
  status_summary: string;
  paper_trade?: {
    id: number;
    status: "OPEN" | "CLOSED";
    buy_signal: "BUY_A" | "BUY_B";
    buy_date: string;
    buy_time: string;
    buy_price: number;
    sell_signal: string | null;
    sell_date: string | null;
    sell_time: string | null;
    sell_price: number | null;
    pnl_pct: number;
    hold_days: number;
  } | null;
  drop_date?: string | null;
  drop_reason?: string | null;
  exit_price?: number | null;
}

interface RollingPoolPanelProps {
  onConverted?: () => Promise<void> | void;
  onTriggerAi?: (stockCode: string, stockName: string) => Promise<void> | void;
  onNotify?: (text: string, type?: "info" | "success" | "warning") => void;
}

export function RollingPoolPanel({ onConverted, onTriggerAi, onNotify }: RollingPoolPanelProps) {
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [trafficLight, setTrafficLight] = useState<MarketTrafficLightState | null>(null);
  const [activeList, setActiveList] = useState<EnrichedRollingItem[]>([]);
  const [archiveList, setArchiveList] = useState<EnrichedRollingItem[]>([]);
  const [stats, setStats] = useState<{
    active_count: number;
    max_active: number;
    buy_ready_count: number;
    converted_count: number;
    expired_count: number;
    invalidated_count: number;
  } | null>(null);

  // 推荐股模拟交易与胜率状态
  const [paperStats, setPaperStats] = useState<SignalWinRateStatsPayload | null>(null);
  const [paperTrades, setPaperTrades] = useState<SignalTradeRecord[]>([]);
  const [klineTarget, setKlineTarget] = useState<{ code: string; name: string } | null>(null);

  // 手动添加观察股与智能搜股状态
  const [showAddForm, setShowAddForm] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [addSearchResults, setAddSearchResults] = useState<SearchStockCandidate[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [addCode, setAddCode] = useState("");
  const [addName, setAddName] = useState("");
  const [addSector, setAddSector] = useState("");
  const [addThesis, setAddThesis] = useState("");

  // 一键转入持仓弹窗状态
  const [convertTarget, setConvertTarget] = useState<EnrichedRollingItem | null>(null);
  const [convertShares, setConvertShares] = useState("500");
  const [convertPrice, setConvertPrice] = useState("");

  const loadPool = useCallback(async () => {
    try {
      const [poolRes, tradeRes] = await Promise.all([
        fetch("/api-market/rolling-pool", { cache: "no-store" }),
        fetch("/api-market/signal-trades", { cache: "no-store" }),
      ]);
      if (poolRes.ok) {
        const json = await poolRes.json();
        if (json.success) {
          setTrafficLight(json.traffic_light || null);
          setActiveList(json.active || []);
          setArchiveList(json.archive || []);
          setStats(json.stats || null);
        }
      }
      if (tradeRes.ok) {
        const tJson = await tradeRes.json();
        if (tJson.success) {
          setPaperStats(tJson.stats || null);
          setPaperTrades(tJson.all_trades || []);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const [poolRes, tradeRes] = await Promise.all([
          fetch("/api-market/rolling-pool", { cache: "no-store" }),
          fetch("/api-market/signal-trades", { cache: "no-store" }),
        ]);
        if (poolRes.ok && active) {
          const json = await poolRes.json();
          if (json.success) {
            setTrafficLight(json.traffic_light || null);
            setActiveList(json.active || []);
            setArchiveList(json.archive || []);
            setStats(json.stats || null);
          }
        }
        if (tradeRes.ok && active) {
          const tJson = await tradeRes.json();
          if (tJson.success) {
            setPaperStats(tJson.stats || null);
            setPaperTrades(tJson.all_trades || []);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const q = addSearchQuery.trim();
    if (!q || !showAddForm) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setAddSearching(true);
      try {
        const res = await fetch(`/api-market/stock-search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok && !controller.signal.aborted) {
          const json = await res.json();
          setAddSearchResults(json.items || json.results || []);
        }
      } catch {
        // ignore abort
      } finally {
        if (!controller.signal.aborted) setAddSearching(false);
      }
    }, 240);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [addSearchQuery, showAddForm]);

  const handleSyncSignals = async () => {
    setBusyAction("sync-signals");
    try {
      const res = await fetch("/api-market/signal-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.(json.message || "已完成信号巡检同步", "success");
        await loadPool();
      } else {
        onNotify?.(json.error || "同步失败", "warning");
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleManualCloseTrade = async (trade: SignalTradeRecord) => {
    setBusyAction(`close-${trade.id}`);
    try {
      const res = await fetch("/api-market/signal-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "manual_close", id: trade.id }),
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.(json.message || "已平仓", "success");
        await loadPool();
      } else {
        onNotify?.(json.error || "平仓失败", "warning");
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleSeedSelect = async () => {
    setBusyAction("seed");
    try {
      const res = await fetch("/api-market/rolling-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_select" }),
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.(json.message || "初始波段账本导入成功", "success");
        await loadPool();
        await onConverted?.();
      } else {
        onNotify?.(json.error || "导入失败", "warning");
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunScreener = async () => {
    setBusyAction("screener");
    try {
      const res = await fetch("/api-market/rolling-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_postmarket" }),
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.(json.message || "盘后选股轮动完成", "success");
        await loadPool();
      } else {
        onNotify?.(json.error || "选股执行失败", "warning");
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction("add");
    try {
      const res = await fetch("/api-market/rolling-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          stock_code: addCode.trim(),
          stock_name: addName.trim(),
          sector: addSector.trim(),
          thesis: addThesis.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.("已加入 5 日观察池并自动计算低吸/突破位", "success");
        setAddCode("");
        setAddName("");
        setAddSector("");
        setAddThesis("");
        setShowAddForm(false);
        await loadPool();
      } else {
        onNotify?.(json.error || "加入失败", "warning");
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleDrop = async (item: EnrichedRollingItem) => {
    setBusyAction(`drop-${item.id}`);
    try {
      const res = await fetch("/api-market/rolling-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "drop", id: item.id, reason: "用户手动移除" }),
      });
      if (res.ok) {
        onNotify?.(`已将 ${item.stock_name} 移出观察池并归档`, "info");
        await loadPool();
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertTarget) return;
    setBusyAction(`convert-${convertTarget.id}`);
    try {
      const res = await fetch("/api-market/rolling-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "convert",
          id: convertTarget.id,
          quantity: Number(convertShares),
          price: Number(convertPrice),
          signal: convertTarget.triggered_signal || "MANUAL_BUY",
        }),
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.(`${convertTarget.stock_name} 已转入实盘持仓风控监控`, "success");
        setConvertTarget(null);
        await loadPool();
        await onConverted?.();
      } else {
        onNotify?.(json.error || "转持仓失败", "warning");
      }
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 顶部控制栏与情绪闸门 */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E4E4E8] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-[0_1px_2px_rgba(15,15,15,0.03),0_8px_24px_-8px_rgba(38,56,68,0.05)]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Radar className="w-5 h-5 text-[#263844]" />
            <h3 className="text-base font-bold text-[#0F0F0F]">5 日轮动观察池（账户独立）</h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F2F7F9] text-[#263844] border border-[#D8D8E4] font-mono">
              仅限沪深主板 + 创业板 · 排除科创/北交/ETF/ST
            </span>
            {trafficLight && (
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${
                  trafficLight.light === "RED"
                    ? "bg-[#D71018]/[0.06] text-[#D71018] border-[#D71018]/25"
                    : trafficLight.light === "YELLOW"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-[#E0E7D9]/55 text-[#184120] border-[#184120]/20"
                }`}
              >
                {trafficLight.label}
              </span>
            )}
          </div>
          <p className="text-xs text-[#5C6873]">
            每个交易日盘后自动精选 2~3 只放量科技成长股滚入观察池；跟踪 5 个交易日内的买点 A（缩量回踩低吸）与买点 B（放量突破共振），满 5 天未出买点或破位自动放弃。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void loadPool()}
            disabled={busyAction !== null}
            className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F8F8F8] text-[#282828] text-xs font-medium border border-[#E0E0E0] hover:border-[#0F0F0F] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>刷新实时买点</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F8F8F8] text-[#0F0F0F] text-xs font-semibold border border-[#E0E0E0] hover:border-[#0F0F0F] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>手动加池</span>
          </button>
          <button
            type="button"
            onClick={handleSeedSelect}
            disabled={busyAction !== null}
            className="px-3 py-1.5 rounded-xl bg-[#F2F7F9] hover:bg-[#E0E7D9]/55 text-[#263844] text-xs font-semibold border border-[#D8D8E4] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <DatabaseBackup className="w-3.5 h-3.5" />
            <span>{busyAction === "seed" ? "导入中..." : "导入兴森+3只初始标的"}</span>
          </button>
          <button
            type="button"
            onClick={handleRunScreener}
            disabled={busyAction !== null}
            className="px-3.5 py-1.5 rounded-xl bg-[#042328] hover:bg-[#184120] text-[#FFFFF2] border border-[#042328] text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E1F209]" />
            <span>{busyAction === "screener" ? "全市场扫描中..." : "立即执行盘后选股轮动"}</span>
          </button>
        </div>
      </div>

      {/* 统计 KPI 行 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E4E4E8]">
            <span className="text-[11px] text-[#5C6873] block">活跃观察池</span>
            <span className="text-xl font-extrabold text-[#0F0F0F] font-mono">
              {stats.active_count} <span className="text-xs font-normal text-[#5C6873]">/ {stats.max_active}</span>
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E4E4E8]">
            <span className="text-[11px] text-[#5C6873] block">当前触发买点</span>
            <span className="text-xl font-extrabold text-[#D71018] font-mono">{stats.buy_ready_count}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E4E4E8]">
            <span className="text-[11px] text-[#5C6873] block">已转实盘买入</span>
            <span className="text-xl font-extrabold text-[#184120] font-mono">{stats.converted_count}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E4E4E8]">
            <span className="text-[11px] text-[#5C6873] block">满5日自动放弃</span>
            <span className="text-xl font-extrabold text-[#263844] font-mono">{stats.expired_count}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E4E4E8]">
            <span className="text-[11px] text-[#5C6873] block">破位提前淘汰</span>
            <span className="text-xl font-extrabold text-[#0F0F0F] font-mono">{stats.invalidated_count}</span>
          </div>
        </div>
      )}

      {/* 手动加池表单（含智能搜股联想） */}
      {showAddForm && (
        <form
          onSubmit={handleAddManual}
          className="rounded-2xl bg-[#FFFFFF] border border-[#C8C8C8] p-4 space-y-3 text-xs shadow-sm"
        >
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#5C6873] absolute left-3 top-2.5" />
            <input
              type="text"
              value={addSearchQuery}
              onChange={(e) => {
                setAddSearchQuery(e.target.value);
                if (!e.target.value.trim()) setAddSearchResults([]);
              }}
              placeholder="快速搜股联想（输入代码 / 简称 / 拼音，如 002916 或 深南电路，选中后自动填入）"
              className="w-full pl-8 pr-16 py-2 rounded-lg bg-[#F8F8F8] border border-[#E0E0E0] text-[#0F0F0F] placeholder:text-[#5C6873]/60 focus:bg-[#FFFFFF] focus:border-[#0F0F0F] outline-none"
            />
            {addSearching && (
              <span className="absolute right-3 top-2 text-[11px] text-[#263844] font-semibold">搜索中...</span>
            )}
            {addSearchResults.length > 0 && (
              <div className="mt-1 rounded-lg border border-[#E4E4E8] bg-[#FFFFFF] max-h-40 overflow-y-auto divide-y divide-[#E4E4E8] shadow-md">
                {addSearchResults.map((cand) => (
                  <button
                    key={cand.code}
                    type="button"
                    onClick={() => {
                      setAddCode(cand.code);
                      setAddName(cand.name);
                      setAddSearchQuery("");
                      setAddSearchResults([]);
                    }}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-[#F2F7F9] text-left cursor-pointer"
                  >
                    <span>
                      <strong className="text-[#0F0F0F]">{cand.name}</strong>
                      <span className="ml-2 font-mono text-[#5C6873]">{cand.code}</span>
                    </span>
                    {cand.current_price ? (
                      <span className="font-mono font-semibold text-[#0F0F0F]">¥{cand.current_price.toFixed(2)}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input
              type="text"
              required
              value={addCode}
              onChange={(e) => setAddCode(e.target.value)}
              placeholder="6位代码 (如 002916)"
              className="px-3 py-2 rounded-lg bg-[#F8F8F8] border border-[#E0E0E0] text-[#0F0F0F] font-mono focus:bg-[#FFFFFF] focus:border-[#0F0F0F] outline-none"
            />
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="股票名称 (自动填充)"
              className="px-3 py-2 rounded-lg bg-[#F8F8F8] border border-[#E0E0E0] text-[#0F0F0F] focus:bg-[#FFFFFF] focus:border-[#0F0F0F] outline-none"
            />
            <input
              type="text"
              value={addSector}
              onChange={(e) => setAddSector(e.target.value)}
              placeholder="所属板块 (如 元件)"
              className="px-3 py-2 rounded-lg bg-[#F8F8F8] border border-[#E0E0E0] text-[#0F0F0F] focus:bg-[#FFFFFF] focus:border-[#0F0F0F] outline-none"
            />
            <input
              type="text"
              value={addThesis}
              onChange={(e) => setAddThesis(e.target.value)}
              placeholder="跟踪逻辑备注"
              className="px-3 py-2 rounded-lg bg-[#F8F8F8] border border-[#E0E0E0] text-[#0F0F0F] focus:bg-[#FFFFFF] focus:border-[#0F0F0F] outline-none"
            />
            <button
              type="submit"
              disabled={busyAction === "add"}
              className="px-4 py-2 rounded-lg bg-[#042328] hover:bg-[#184120] text-[#FFFFF2] font-bold cursor-pointer"
            >
              {busyAction === "add" ? "计算点位中..." : "加入观察池"}
            </button>
          </div>
        </form>
      )}

      {/* 活跃 5 日观察池列表 */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E4E4E8] overflow-hidden shadow-[0_1px_2px_rgba(15,15,15,0.03),0_8px_24px_-8px_rgba(38,56,68,0.05)]">
        <div className="px-4 py-3 border-b border-[#E4E4E8] bg-[#F8F8F8] flex items-center justify-between">
          <span className="text-xs font-bold text-[#0F0F0F]">当前活跃观察标的（按买点距离与状态实时监控）</span>
          <span className="text-[11px] text-[#5C6873]">买点A：缩量回踩低吸 · 买点B：放量突破共振</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#5C6873]">正在加载观察池与日K点位...</div>
        ) : activeList.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-[#0F0F0F]">当前账户 5 日观察池为空</p>
            <p className="text-xs text-[#5C6873]">
              可点击右上角「立即执行盘后选股轮动」从全市场筛选科技成长股，或点击「导入兴森+3只初始标的」一键同步初始数据。
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E4E8]">
            {activeList.map((item) => {
              const isBuy = item.triggered_signal === "BUY_A" || item.triggered_signal === "BUY_B";
              const isInvalid = item.triggered_signal === "INVALIDATED";
              const dayProgress = Math.min(100, Math.round((item.observed_days / Math.max(1, item.max_days)) * 100));

              return (
                <div
                  key={item.id}
                  className={`p-4 transition-colors ${
                    isBuy ? "bg-[#D71018]/[0.03]" : isInvalid ? "bg-[#F8F8F8]" : "hover:bg-[#F2F7F9]/50"
                  }`}
                >
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* 左侧：标的基本面与5日进度 */}
                    <div className="space-y-1.5 min-w-[260px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#0F0F0F]">{item.stock_name}</span>
                        <span className="text-xs font-mono text-[#5C6873]">{item.stock_code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F8F8F8] text-[#5C6873] border border-[#E0E0E0]">
                          {item.board}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F2F7F9] text-[#263844] border border-[#D8D8E4] font-medium">
                          {item.sector}
                          {item.sector_change_pct !== undefined
                            ? ` (${item.sector_change_pct >= 0 ? "+" : ""}${item.sector_change_pct.toFixed(2)}%)`
                            : ""}
                        </span>
                        {isBuy && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#D71018]/[0.08] text-[#D71018] border border-[#D71018]/25 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            {item.triggered_signal === "BUY_A" ? "触发买点A·低吸" : "触发买点B·突破"}
                          </span>
                        )}
                        {isInvalid && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            破位预警
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#5C6873]">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#263844]" />
                          观察 Day {item.observed_days}/{item.max_days}
                        </span>
                        <div className="w-24 h-1.5 rounded-full bg-[#E4E4E8] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.observed_days >= item.max_days - 1 ? "bg-[#D71018]" : "bg-[#0F0F0F]"
                            }`}
                            style={{ width: `${dayProgress}%` }}
                          />
                        </div>
                        <span>入池日 {item.added_date}</span>
                        {item.vol_ratio_5_20 && <span>5/20堆量 {item.vol_ratio_5_20}x</span>}
                        {item.limit_up_count_1y !== null && <span>1年涨停 {item.limit_up_count_1y}次</span>}
                        {item.amp_20d_pct !== undefined && item.amp_20d_pct !== null && (
                          <span>20日振幅 {item.amp_20d_pct}%</span>
                        )}
                        {item.paper_trade && (
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-semibold border ${
                              item.paper_trade.status === "OPEN"
                                ? "bg-[#0F0F0F] text-[#FFFFFF] border-[#0F0F0F]"
                                : "bg-[#F8F8F8] text-[#263844] border-[#E0E0E0]"
                            }`}
                          >
                            {item.paper_trade.status === "OPEN" ? "已模拟买入" : "模拟已卖出"}{" "}
                            {item.paper_trade.pnl_pct >= 0 ? "+" : ""}
                            {item.paper_trade.pnl_pct}%
                          </span>
                        )}
                      </div>

                      {item.thesis && <p className="text-[11px] text-[#282828] line-clamp-2">{item.thesis}</p>}
                    </div>

                    {/* 中间：5日推荐股实战多维指标（现价/MA20偏离、低吸与量比、突破与盈亏比、失效防守） */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-[#F8F8F8] border border-[#E4E4E8]">
                        <span className="text-[10px] text-[#5C6873] block">现价 / MA20偏离</span>
                        <span className="text-sm font-bold text-[#0F0F0F]">
                          {item.live_price !== null ? `¥${item.live_price.toFixed(2)}` : "--"}
                        </span>
                        <span
                          className={`ml-1.5 text-[11px] font-semibold ${
                            item.live_change_pct >= 0 ? "text-[#D71018]" : "text-[#184120]"
                          }`}
                        >
                          {item.live_change_pct >= 0 ? "+" : ""}
                          {item.live_change_pct.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-[#5C6873] block">
                          MA20{" "}
                          {item.dist_ma20_pct !== undefined && item.dist_ma20_pct !== null
                            ? `${item.dist_ma20_pct >= 0 ? "+" : ""}${item.dist_ma20_pct}%`
                            : "--"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F8F8F8] border border-[#E4E4E8]">
                        <span className="text-[10px] text-[#263844] font-semibold block">买点A 低吸 / 量比</span>
                        <span className="text-[#0F0F0F] font-semibold">
                          {item.buy_low?.toFixed(2) ?? "--"} ~ {item.buy_high?.toFixed(2) ?? "--"}
                        </span>
                        <span className="text-[10px] text-[#5C6873] block">
                          量比 {item.live_vol_ratio}x · 距区间{" "}
                          {item.dist_to_buy_high_pct !== null
                            ? `${item.dist_to_buy_high_pct >= 0 ? "+" : ""}${item.dist_to_buy_high_pct}%`
                            : "--"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F8F8F8] border border-[#E4E4E8]">
                        <span className="text-[10px] text-[#D71018] font-semibold block">买点B / 盈亏比 R:R</span>
                        <span className="text-[#0F0F0F] font-semibold">¥{item.breakout_price?.toFixed(2) ?? "--"}</span>
                        <span className="text-[10px] text-[#5C6873] block">
                          {item.rr_ratio ? `盈亏比 ${item.rr_ratio}:1` : "--"} ·{" "}
                          {item.dist_to_breakout_pct !== null
                            ? item.dist_to_breakout_pct > 0
                              ? `+${item.dist_to_breakout_pct}%`
                              : "已突破"
                            : ""}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F8F8F8] border border-[#E4E4E8]">
                        <span className="text-[10px] text-[#184120] font-semibold block">失效防守 / 股性</span>
                        <span className="text-[#0F0F0F] font-semibold">¥{item.invalid_price?.toFixed(2) ?? "--"}</span>
                        <span className="text-[10px] text-[#5C6873] block">
                          距线{" "}
                          {item.dist_to_invalid_pct !== undefined && item.dist_to_invalid_pct !== null
                            ? `+${item.dist_to_invalid_pct}%`
                            : "--"}{" "}
                          · 护{item.moat_score ?? "--"}
                        </span>
                      </div>
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setKlineTarget({ code: item.stock_code, name: item.stock_name })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F8F8F8] text-[#0F0F0F] border border-[#E0E0E0] hover:border-[#0F0F0F] text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <CandlestickChart className="w-3.5 h-3.5" />
                        <span>K线买卖点</span>
                      </button>
                      {onTriggerAi && (
                        <button
                          type="button"
                          onClick={() => void onTriggerAi(item.stock_code, item.stock_name)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F8F8F8] text-[#263844] border border-[#E0E0E0] hover:border-[#0F0F0F] text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>AI研判</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setConvertTarget(item);
                          setConvertPrice(String(item.live_price || item.entry_ref_price));
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#E0E7D9]/55 hover:bg-[#184120] text-[#184120] hover:text-[#FFFFFF] border border-[#184120]/20 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowRightCircle className="w-3.5 h-3.5" />
                        <span>买入转持仓</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDrop(item)}
                        disabled={busyAction === `drop-${item.id}`}
                        className="p-1.5 rounded-lg text-[#5C6873] hover:text-[#D71018] hover:bg-[#D71018]/[0.06] cursor-pointer"
                        title="移出观察池"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#E4E4E8] text-[11px] text-[#282828]">
                    <span className="font-semibold text-[#0F0F0F]">规则状态：</span>
                    {item.status_summary}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 推荐股自动模拟账户 & 买卖点胜率验证台 */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E4E4E8] p-5 space-y-4 shadow-[0_1px_2px_rgba(15,15,15,0.03),0_8px_24px_-8px_rgba(38,56,68,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E4E8] pb-3">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-[#0F0F0F] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#263844]" />
              推荐股模拟验证账户 · 自动买卖点与胜率追踪
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F2F7F9] text-[#263844] border border-[#D8D8E4] font-mono font-semibold">
                严格 A 股 T+1
              </span>
            </h3>
            <p className="text-xs text-[#5C6873]">
              观察池一旦触发 BUY_A/BUY_B 买点即自动模拟买入，次日起触发 -8%止损 / +20%止盈 / +10%回撤5%移动止盈 / 跌破MA20(-3%) / 满10日结算 自动模拟卖出，全程计入 K 线与胜率统计。
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSyncSignals()}
            disabled={busyAction !== null}
            className="px-3 py-1.5 rounded-xl bg-[#042328] hover:bg-[#184120] text-[#FFFFF2] border border-[#042328] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Activity className="w-3.5 h-3.5 text-[#E1F209]" />
            <span>{busyAction === "sync-signals" ? "同步巡检中..." : "立即同步模拟买卖"}</span>
          </button>
        </div>

        {/* 胜率 KPI 卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#F8F8F8] border border-[#E4E4E8]">
            <span className="text-[10px] text-[#5C6873] block">模拟已平仓胜率</span>
            <span className="text-xl font-black text-[#D71018]">
              {paperStats?.closed_count ? `${paperStats.win_rate_pct}%` : "--"}
            </span>
            <span className="text-[10px] text-[#5C6873] block">
              胜 {paperStats?.win_count ?? 0} / 负 {paperStats?.loss_count ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#F8F8F8] border border-[#E4E4E8]">
            <span className="text-[10px] text-[#5C6873] block">总信号笔数</span>
            <span className="text-xl font-black text-[#0F0F0F]">{paperStats?.total_trades ?? 0}</span>
            <span className="text-[10px] text-[#5C6873] block">
              持仓中 {paperStats?.open_count ?? 0} · 已平仓 {paperStats?.closed_count ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#F8F8F8] border border-[#E4E4E8]">
            <span className="text-[10px] text-[#5C6873] block">已结算单笔均益</span>
            <span
              className={`text-xl font-black ${
                (paperStats?.avg_pnl_pct ?? 0) >= 0 ? "text-[#D71018]" : "text-[#184120]"
              }`}
            >
              {paperStats?.closed_count
                ? `${paperStats.avg_pnl_pct >= 0 ? "+" : ""}${paperStats.avg_pnl_pct}%`
                : "--"}
            </span>
            <span className="text-[10px] text-[#5C6873] block">
              在途均盈 {paperStats?.open_count ? `${paperStats.open_avg_pnl_pct >= 0 ? "+" : ""}${paperStats.open_avg_pnl_pct}%` : "--"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#F8F8F8] border border-[#E4E4E8]">
            <span className="text-[10px] text-[#5C6873] block">盈亏比 / 等权累计</span>
            <span className="text-xl font-black text-[#0F0F0F]">
              {paperStats?.profit_factor ? `${paperStats.profit_factor}x` : "--"}
            </span>
            <span className="text-[10px] text-[#5C6873] block">
              累计 {(paperStats?.cumulative_return_pct ?? 0) >= 0 ? "+" : ""}
              {paperStats?.cumulative_return_pct ?? 0}%
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#F8F8F8] border border-[#E4E4E8]">
            <span className="text-[10px] text-[#263844] font-semibold block">BUY_A 低吸策略</span>
            <span className="text-lg font-bold text-[#0F0F0F]">
              {paperStats?.buy_a_stats.closed ? `${paperStats.buy_a_stats.win_rate_pct}%` : `${paperStats?.buy_a_stats.total ?? 0}笔`}
            </span>
            <span className="text-[10px] text-[#5C6873] block">
              胜 {paperStats?.buy_a_stats.wins ?? 0}/{paperStats?.buy_a_stats.closed ?? 0} · 均{" "}
              {paperStats?.buy_a_stats.avg_pnl_pct ?? 0}%
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#F8F8F8] border border-[#E4E4E8]">
            <span className="text-[10px] text-[#D71018] font-semibold block">BUY_B 突破策略</span>
            <span className="text-lg font-bold text-[#0F0F0F]">
              {paperStats?.buy_b_stats.closed ? `${paperStats.buy_b_stats.win_rate_pct}%` : `${paperStats?.buy_b_stats.total ?? 0}笔`}
            </span>
            <span className="text-[10px] text-[#5C6873] block">
              胜 {paperStats?.buy_b_stats.wins ?? 0}/{paperStats?.buy_b_stats.closed ?? 0} · 均{" "}
              {paperStats?.buy_b_stats.avg_pnl_pct ?? 0}%
            </span>
          </div>
        </div>

        {/* 模拟交易明细列表（点击可直接查看 K 线图 B/S 买卖点） */}
        {!paperTrades.length ? (
          <div className="p-6 text-center text-xs text-[#5C6873] rounded-xl bg-[#F8F8F8] border border-[#E4E4E8]">
            暂无已触发买点的模拟交易记录；一旦观察池任一标的盘中触发 BUY_A 或 BUY_B，系统将自动买入并在此生成胜率曲线与 K 线买卖点。
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E4E4E8]">
            <table className="w-full text-left text-xs text-[#282828]">
              <thead className="bg-[#F8F8F8] text-[11px] text-[#263844] border-b border-[#E4E4E8]">
                <tr>
                  <th className="px-3 py-2.5">标的</th>
                  <th className="px-3 py-2.5">买点 / 时间</th>
                  <th className="px-3 py-2.5">买入价</th>
                  <th className="px-3 py-2.5">卖点 / 时间</th>
                  <th className="px-3 py-2.5">现价 / 卖价</th>
                  <th className="px-3 py-2.5">持仓 / 盈亏</th>
                  <th className="px-3 py-2.5 text-right">复盘操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E8] font-mono">
                {paperTrades.slice(0, 30).map((tr) => (
                  <tr key={tr.id} className="hover:bg-[#F2F7F9]/60">
                    <td className="px-3 py-2 font-sans">
                      <span className="font-bold text-[#0F0F0F]">{tr.stock_name}</span>
                      <span className="ml-1.5 font-mono text-[#5C6873]">{tr.stock_code}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#D71018]/[0.06] text-[#D71018] text-[10px] font-bold mr-1.5">
                        {tr.buy_signal}
                      </span>
                      <span className="text-[#282828]">
                        {tr.buy_date} {tr.buy_time}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#0F0F0F] font-semibold">¥{tr.buy_price.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      {tr.status === "CLOSED" ? (
                        <>
                          <span className="px-1.5 py-0.5 rounded bg-[#0F0F0F] text-[#FFFFFF] text-[10px] font-bold mr-1.5">
                            {tr.sell_signal}
                          </span>
                          <span className="text-[#282828]">
                            {tr.sell_date} {tr.sell_time}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#184120] font-sans font-semibold">T+{tr.hold_days} 持仓跟踪中</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[#0F0F0F]">
                      ¥{(tr.status === "CLOSED" ? tr.sell_price : tr.live_price ?? tr.buy_price)?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`font-bold ${tr.pnl_pct >= 0 ? "text-[#D71018]" : "text-[#184120]"}`}
                      >
                        {tr.pnl_pct >= 0 ? `+${tr.pnl_pct.toFixed(2)}%` : `${tr.pnl_pct.toFixed(2)}%`}
                      </span>
                      {tr.status === "CLOSED" && (
                        <span className={`ml-1.5 text-[10px] font-bold ${tr.is_win ? "text-[#D71018]" : "text-[#184120]"}`}>
                          {tr.is_win ? "胜" : "负"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-sans">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setKlineTarget({ code: tr.stock_code, name: tr.stock_name })}
                          className="px-2 py-1 rounded bg-[#FFFFFF] hover:bg-[#F8F8F8] text-[#0F0F0F] border border-[#E0E0E0] hover:border-[#0F0F0F] text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CandlestickChart className="w-3 h-3" />
                          <span>看K线图</span>
                        </button>
                        {tr.status === "OPEN" && (
                          <button
                            type="button"
                            onClick={() => void handleManualCloseTrade(tr)}
                            disabled={busyAction === `close-${tr.id}`}
                            className="px-2 py-1 rounded bg-[#FFFFFF] hover:bg-[#F8F8F8] text-[#5C6873] border border-[#E0E0E0] text-[11px] cursor-pointer"
                          >
                            平仓
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 历史轮动归档 */}
      {archiveList.length > 0 && (
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E4E4E8] overflow-hidden shadow-[0_1px_2px_rgba(15,15,15,0.03),0_8px_24px_-8px_rgba(38,56,68,0.05)]">
          <div className="px-4 py-2.5 border-b border-[#E4E4E8] bg-[#F8F8F8] text-xs font-bold text-[#0F0F0F]">
            5 日轮动淘汰 / 转实盘归档记录（最近 {archiveList.length} 条）
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#282828]">
              <thead className="bg-[#F8F8F8] text-[11px] text-[#263844] border-b border-[#E4E4E8]">
                <tr>
                  <th className="px-3 py-2">标的</th>
                  <th className="px-3 py-2">入池日</th>
                  <th className="px-3 py-2">归档日</th>
                  <th className="px-3 py-2">结果状态</th>
                  <th className="px-3 py-2">原因说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E8]">
                {archiveList.slice(0, 20).map((a) => (
                  <tr key={a.id} className="hover:bg-[#F2F7F9]/60">
                    <td className="px-3 py-2 font-medium text-[#0F0F0F]">
                      {a.stock_name} <span className="font-mono text-[#5C6873]">{a.stock_code}</span>
                    </td>
                    <td className="px-3 py-2 font-mono">{a.added_date}</td>
                    <td className="px-3 py-2 font-mono">{a.drop_date || "--"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                          a.status === "CONVERTED"
                            ? "bg-[#E0E7D9]/55 text-[#184120] border-[#184120]/20"
                            : a.status === "INVALIDATED"
                            ? "bg-[#D71018]/[0.06] text-[#D71018] border-[#D71018]/25"
                            : "bg-[#F8F8F8] text-[#5C6873] border-[#E0E0E0]"
                        }`}
                      >
                        {a.status === "CONVERTED"
                          ? "已转持仓"
                          : a.status === "EXPIRED"
                          ? "满5日放弃"
                          : a.status === "INVALIDATED"
                          ? "破位淘汰"
                          : a.status === "ROTATED"
                          ? "满额换出"
                          : "手动移除"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#5C6873]">{a.drop_reason || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 一键转持仓弹窗 */}
      {convertTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F0F]/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleConvertSubmit}
            className="w-full max-w-md rounded-2xl bg-[#FFFFFF] border border-[#E4E4E8] p-5 space-y-4 text-xs text-[#0F0F0F] shadow-[0_24px_70px_rgba(15,15,15,0.16)]"
          >
            <h4 className="text-sm font-bold text-[#0F0F0F]">
              转入实盘持仓 · {convertTarget.stock_name} ({convertTarget.stock_code})
            </h4>
            <p className="text-[#5C6873]">
              将自动沿用该标的失效线（¥{convertTarget.invalid_price?.toFixed(2) ?? "--"}）并按 A 股 T+1 初始化今日可卖股数为 0。
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#5C6873] mb-1">实际成交均价 (元)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={convertPrice}
                  onChange={(e) => setConvertPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8F8F8] border border-[#E0E0E0] text-[#0F0F0F] font-mono focus:bg-[#FFFFFF] focus:border-[#0F0F0F] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#5C6873] mb-1">买入股数 (100整数倍)</label>
                <input
                  type="number"
                  step="100"
                  min="100"
                  required
                  value={convertShares}
                  onChange={(e) => setConvertShares(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8F8F8] border border-[#E0E0E0] text-[#0F0F0F] font-mono focus:bg-[#FFFFFF] focus:border-[#0F0F0F] outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConvertTarget(null)}
                className="px-4 py-1.5 rounded-lg border border-[#E0E0E0] text-[#282828] cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={busyAction !== null}
                className="px-4 py-1.5 rounded-lg bg-[#042328] hover:bg-[#184120] text-[#FFFFF2] font-bold cursor-pointer"
              >
                确认买入入仓
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 模拟账户 K 线买卖点弹窗 */}
      <SignalKlineModal
        open={Boolean(klineTarget)}
        stockCode={klineTarget?.code || ""}
        stockName={klineTarget?.name || ""}
        onClose={() => setKlineTarget(null)}
      />
    </div>
  );
}
