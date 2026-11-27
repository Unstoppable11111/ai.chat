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
      if (json.success) {
        if (json.premarket) {
          setPremarket(json.premarket as PremarketHeroData);
        }
        const ticks = json.intraday?.entries;
        if (Array.isArray(ticks) && ticks.length > 0) {
          const last = ticks[0];
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
      ? "bg-[#E0E7D9]/55 text-[#184120] border-[#184120]/20"
      : premarket?.traffic_light?.light === "RED"
      ? "bg-[#D71018]/[0.06] text-[#D71018] border-[#D71018]/20"
      : "bg-amber-50 text-amber-800 border-amber-200";

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
    <section className="flex flex-col gap-4 rounded-2xl border border-[#E4E4E8] border-l-4 border-l-[#042328] bg-[#FFFFFF] p-5 shadow-[0_1px_2px_rgba(4,35,40,0.04),0_8px_24px_-8px_rgba(38,56,68,0.07)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#042328]">
            <Sparkles size={15} className="text-[#184120]" />
            今日盘前作战总纲与盘中纪律摘要
          </span>
          {premarket?.traffic_light && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-semibold ${lightBadgeCls}`}>
              {premarket.traffic_light.light === "RED" ? <ShieldAlert size={11} /> : <TrendingUp size={11} />}
              {premarket.traffic_light.label}
            </span>
          )}
          {premarket?.report_date && (
            <span className="text-[11px] font-mono text-[#263844] bg-[#F8F8F4] border border-[#E4E4E8] px-2 py-0.5 rounded-full">
              {premarket.report_date}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-[#282828] line-clamp-2">{previewExcerpt}</p>
        {latestTickSummary && (
          <p className="text-[11px] font-mono text-[#263844] bg-[#F2F7F9] inline-block px-2.5 py-0.5 rounded-lg border border-[#D8D8E4]">
            {latestTickSummary}
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-[#D71018]">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          onClick={onOpenReportTab}
          className="flex items-center gap-1.5 rounded-xl border border-[#D8D8E4] bg-[#F2F7F9] px-3.5 py-2 text-xs font-medium text-[#263844] hover:border-[#263844] hover:bg-[#FFFFFF] transition-colors cursor-pointer"
        >
          <Calendar size={14} />
          打开每日四合一看板
        </button>
        <button
          onClick={refreshPremarket}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-xl bg-[#042328] px-3.5 py-2 text-xs font-semibold text-[#FFFFF2] border border-[#042328] hover:bg-[#184120] disabled:opacity-50 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={pending ? "animate-spin text-[#E1F209]" : "text-[#E1F209]"} />
          {pending ? "生成中..." : "刷新盘前计划"}
        </button>
      </div>
    </section>
  );
}
