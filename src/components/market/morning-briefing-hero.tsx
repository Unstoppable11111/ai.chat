"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, RefreshCw, Sparkles, ShieldAlert, TrendingUp } from "lucide-react";

interface PremarketHeroData {
  report_date: string;
  generated_at: string;
  traffic_light?: {
    light: "RED" | "YELLOW" | "GREEN";
    label: string;
    score: number | null;
    summary: string;
  };
  plan_markdown?: string;
  ai_used?: boolean;
  model_used?: string;
}

export function MorningBriefingHero({
  onOpenReportTab,
  showToast,
}: {
  onOpenReportTab?: () => void;
  showToast?: (text: string, type?: "info" | "success" | "warning") => void;
}) {
  const [premarket, setPremarket] = useState<PremarketHeroData | null>(null);
  const [latestTickSummary, setLatestTickSummary] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const loadBoard = useCallback(async () => {
    try {
      const res = await fetch("/api-market/daily-board", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.board) {
        if (json.board.premarket) {
          setPremarket(json.board.premarket as PremarketHeroData);
        }
        const ticks = json.board.intraday?.ticks;
        if (Array.isArray(ticks) && ticks.length > 0) {
          const last = ticks[ticks.length - 1];
          setLatestTickSummary(
            `最新巡检 ${last.tick_time} · ${last.traffic_light?.label || ""} · 涨${last.up_count}/跌${last.down_count} · 涨停${last.limit_up_count}`
          );
        }
      }
    } catch {
      // ignore initial transient error
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!active) return;
      await loadBoard();
    };
    void init();
    return () => {
      active = false;
    };
  }, [loadBoard]);

  async function refreshPremarket() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api-market/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: "premarket", force: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "生成盘前计划失败，请重试");
      await loadBoard();
      showToast?.("今日盘前全天计划已重新生成", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "刷新失败");
    } finally {
      setPending(false);
    }
  }

  const lightBadgeCls =
    premarket?.traffic_light?.light === "GREEN"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35"
      : premarket?.traffic_light?.light === "RED"
      ? "bg-rose-500/15 text-rose-300 border-rose-500/35"
      : "bg-amber-500/15 text-amber-300 border-amber-500/35";

  const previewExcerpt = premarket?.plan_markdown
    ? premarket.plan_markdown
        .replace(/[#>*`]/g, "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 8)
        .slice(0, 2)
        .join(" ｜ ")
        .slice(0, 180)
    : "每个交易日 08:35 自动拉取 A 股要闻、市场情绪红绿灯与个人持仓/5日观察池纪律生成全天作战计划。";

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-cyan-500/25 bg-[#0a172a]/80 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-100">
            <Sparkles size={15} className="text-cyan-400" />
            今日盘前作战总纲与盘中纪律摘要
          </span>
          {premarket?.traffic_light && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-mono ${lightBadgeCls}`}>
              {premarket.traffic_light.light === "RED" ? <ShieldAlert size={11} /> : <TrendingUp size={11} />}
              {premarket.traffic_light.label}
            </span>
          )}
          {premarket?.report_date && (
            <span className="text-[11px] font-mono text-slate-400">{premarket.report_date}</span>
          )}
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-slate-300 line-clamp-2">{previewExcerpt}</p>
        {latestTickSummary && <p className="text-[11px] font-mono text-cyan-300/80">{latestTickSummary}</p>}
        {error && (
          <p role="alert" className="text-xs text-amber-300">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          onClick={onOpenReportTab}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-700/70 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-900/40 transition-colors"
        >
          <Calendar size={14} />
          打开每日四合一看板
        </button>
        <button
          onClick={refreshPremarket}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-700 px-3 py-2 text-xs text-white hover:bg-cyan-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={pending ? "animate-spin" : ""} />
          {pending ? "生成中..." : "刷新盘前计划"}
        </button>
      </div>
    </section>
  );
}
