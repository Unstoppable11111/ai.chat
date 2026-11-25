"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Calendar,
  FileText,
  Radio,
  ListChecks,
  Bot,
  RefreshCw,
  Play,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import type {
  AnomalyReportPayload,
  IntradayReportPayload,
  PostmarketReportPayload,
  PremarketReportPayload,
} from "@/lib/daily-board-db";

type BoardSubTab = "premarket" | "intraday" | "postmarket" | "anomaly";

interface DailyBoardViewProps {
  onNotify?: (text: string, type?: "info" | "success" | "warning") => void;
  refreshSignal?: number;
}

export function DailyBoardView({ onNotify, refreshSignal = 0 }: DailyBoardViewProps) {
  const [subTab, setSubTab] = useState<BoardSubTab>("premarket");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [premarket, setPremarket] = useState<PremarketReportPayload | null>(null);
  const [intraday, setIntraday] = useState<IntradayReportPayload | null>(null);
  const [postmarket, setPostmarket] = useState<PostmarketReportPayload | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  const fetchBoard = useCallback(async (dateOverride?: string) => {
    try {
      const target = dateOverride || selectedDate;
      const qs = target ? `?date=${encodeURIComponent(target)}` : "";
      const res = await fetch(`/api-market/daily-board${qs}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSelectedDate((prev) => prev || json.report_date);
          setAvailableDates(json.available_dates || [json.report_date]);
          setPremarket(json.premarket || null);
          setIntraday(json.intraday || null);
          setPostmarket(json.postmarket || null);
          setAnomaly(json.anomaly || null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    let active = true;
    const loadInitial = async () => {
      try {
        const qs = selectedDate ? `?date=${encodeURIComponent(selectedDate)}` : "";
        const res = await fetch(`/api-market/daily-board${qs}`, { cache: "no-store" });
        if (res.ok && active) {
          const json = await res.json();
          if (json.success) {
            if (!selectedDate) setSelectedDate(json.report_date);
            setAvailableDates(json.available_dates || [json.report_date]);
            setPremarket(json.premarket || null);
            setIntraday(json.intraday || null);
            setPostmarket(json.postmarket || null);
            setAnomaly(json.anomaly || null);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadInitial();
    return () => {
      active = false;
    };
  }, [selectedDate, refreshSignal]);

  const handleTriggerCron = async (job: "premarket" | "intraday" | "postmarket") => {
    setRunningJob(job);
    try {
      const res = await fetch("/api-market/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, force: true }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const label =
          job === "premarket"
            ? "盘前全天计划已生成"
            : job === "intraday"
            ? "盘中 5 分钟规则快照已抓拍"
            : "盘后选股与 5 日观察池轮动已完成";
        onNotify?.(label, "success");
        setSubTab(job);
        await fetchBoard();
      } else {
        onNotify?.(json.error || "执行失败", "warning");
      }
    } finally {
      setRunningJob(null);
    }
  };

  const handleManualAiAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningJob("manual-ai");
    try {
      const res = await fetch("/api-market/daily-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", question: question.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        onNotify?.("AI 盘面与持仓深度研判已生成归档", "success");
        setQuestion("");
        setSubTab("anomaly");
        await fetchBoard();
      } else {
        onNotify?.(json.error || "AI 研判失败", "warning");
      }
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部控制栏：按日期隔离、不杂乱 */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-700/70 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-white">每日归档看板</span>
          </div>
          <select
            value={selectedDate}
            onChange={(e) => {
              setLoading(true);
              setSelectedDate(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300"
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400">
            每日独立归档 4 份结构化记录 · 自动调度：08:35 盘前 / 盘中每5分钟 / 15:35 盘后
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleTriggerCron("premarket")}
            disabled={runningJob !== null}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3 h-3 text-amber-400" />
            <span>{runningJob === "premarket" ? "生成中..." : "跑盘前计划"}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleTriggerCron("intraday")}
            disabled={runningJob !== null}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>{runningJob === "intraday" ? "抓拍中..." : "跑5分钟巡检"}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleTriggerCron("postmarket")}
            disabled={runningJob !== null}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{runningJob === "postmarket" ? "选股中..." : "跑盘后选股"}</span>
          </button>
          <button
            type="button"
            onClick={() => void fetchBoard()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="刷新当日看板"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 四合一子导航 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: "premarket", label: "01 盘前全天计划", icon: FileText, ready: Boolean(premarket) },
          {
            id: "intraday",
            label: `02 盘中5分钟播报 (${intraday?.entries?.length || 0})`,
            icon: Radio,
            ready: Boolean(intraday?.entries?.length),
          },
          { id: "postmarket", label: "03 盘后推荐候选池", icon: ListChecks, ready: Boolean(postmarket) },
          {
            id: "anomaly",
            label: `04 异常与AI研判 (${anomaly?.records?.length || 0})`,
            icon: Bot,
            ready: Boolean(anomaly?.records?.length),
          },
        ].map((item) => {
          const Icon = item.icon;
          const active = subTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubTab(item.id as BoardSubTab)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                active
                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-200"
                  : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  item.ready ? "bg-emerald-400" : "bg-slate-700"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* 01 盘前全天计划 */}
      {subTab === "premarket" && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          {!premarket ? (
            <div className="py-10 text-center text-xs text-slate-400 space-y-2">
              <p>当日（{selectedDate}）暂未生成 01 盘前全天计划（交易日 08:35 自动执行）。</p>
              <button
                type="button"
                onClick={() => void handleTriggerCron("premarket")}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold cursor-pointer"
              >
                立即手动生成盘前计划
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                    {premarket.traffic_light.label}
                  </span>
                  <span className="text-slate-400">
                    {premarket.ai_used ? `AI生成 (${premarket.model_used || "LLM"})` : "规则引擎生成"}
                  </span>
                </div>
                <span className="font-mono text-slate-500">
                  生成时间 {new Date(premarket.generated_at).toLocaleString("zh-CN")}
                </span>
              </div>

              <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{premarket.plan_markdown}</ReactMarkdown>
              </div>

              {premarket.news?.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 mb-2">关联消息面快讯摘要</h4>
                  <div className="space-y-1.5">
                    {premarket.news.slice(0, 6).map((n, idx) => (
                      <div key={idx} className="text-xs text-slate-400 flex gap-2">
                        <span className="font-mono text-cyan-400 shrink-0">[{n.time}]</span>
                        <span>{n.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 02 盘中 5 分钟播报 */}
      {subTab === "intraday" && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
          {!intraday?.entries?.length ? (
            <div className="py-10 text-center text-xs text-slate-400 space-y-2">
              <p>当日（{selectedDate}）暂无 5 分钟静默播报记录（盘中交易时段每 5 分钟自动记入）。</p>
              <button
                type="button"
                onClick={() => void handleTriggerCron("intraday")}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold cursor-pointer"
              >
                立即抓拍一次快照
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {intraday.entries.map((entry, idx) => (
                <div
                  key={`${entry.tick_time}-${idx}`}
                  className={`rounded-xl border p-3.5 space-y-2 text-xs ${
                    entry.escalated
                      ? "bg-rose-950/20 border-rose-500/40"
                      : "bg-slate-950/60 border-slate-800"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-bold">
                        {entry.tick_time}
                      </span>
                      <span className="font-semibold text-white">{entry.traffic_light.label}</span>
                      {entry.escalated && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                          已自动唤醒 AI 研判
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      涨 {entry.up_count} / 跌 {entry.down_count} · 涨停 {entry.limit_up_count} · 跌停{" "}
                      {entry.limit_down_count} · 炸板率 {entry.broken_ratio}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{entry.indices_summary}</div>

                  {entry.holdings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {entry.holdings.map((h) => (
                        <div
                          key={h.code}
                          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-slate-100">
                              {h.name}({h.code})
                            </span>
                            <span className="ml-2 font-mono text-slate-300">¥{h.price.toFixed(2)}</span>
                            <span
                              className={`ml-1.5 font-mono ${
                                h.change_pct >= 0 ? "text-rose-400" : "text-emerald-400"
                              }`}
                            >
                              {h.change_pct >= 0 ? "+" : ""}
                              {h.change_pct.toFixed(2)}%
                            </span>
                          </div>
                          <div className="text-right text-[11px] text-slate-400">
                            振幅 {h.amplitude_pct}% / 高回撤 -{h.pullback_from_high_pct}% ·{" "}
                            <span className="text-cyan-300">{h.recommendation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.watchlist.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {entry.watchlist.map((w) => (
                        <span
                          key={w.code}
                          className={`px-2 py-1 rounded-lg border text-[11px] ${
                            w.triggered_signal === "BUY_A" || w.triggered_signal === "BUY_B"
                              ? "bg-rose-500/20 border-rose-500/40 text-rose-200"
                              : "bg-slate-900 border-slate-800 text-slate-300"
                          }`}
                        >
                          {w.name}: {w.price ? `¥${w.price.toFixed(2)}` : "--"} ({w.status_summary})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 03 盘后推荐候选池 */}
      {subTab === "postmarket" && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          {!postmarket ? (
            <div className="py-10 text-center text-xs text-slate-400 space-y-2">
              <p>当日（{selectedDate}）暂未生成 03 盘后推荐候选池（交易日 15:35 自动执行）。</p>
              <button
                type="button"
                onClick={() => void handleTriggerCron("postmarket")}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold cursor-pointer"
              >
                立即执行盘后选股轮动
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-slate-300">
                <span>
                  扫描全市场活跃股 <strong>{postmarket.scanned_count}</strong> 只 → 达标{" "}
                  <strong className="text-cyan-300">{postmarket.qualified_count}</strong> 只 → 今日新入池{" "}
                  <strong className="text-emerald-300">{postmarket.enrolled.length}</strong> 只（当前活跃共{" "}
                  {postmarket.active_pool_count} 只）
                </span>
                <span className="font-mono text-slate-500">
                  {new Date(postmarket.generated_at).toLocaleString("zh-CN")}
                </span>
              </div>

              {postmarket.enrolled.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-slate-200">
                    <thead className="bg-slate-950/70 text-[11px] text-slate-400">
                      <tr>
                        <th className="px-3 py-2">新入池标的</th>
                        <th className="px-3 py-2">板块</th>
                        <th className="px-3 py-2">参考现价</th>
                        <th className="px-3 py-2">低吸区间 (买点A)</th>
                        <th className="px-3 py-2">突破位 (买点B)</th>
                        <th className="px-3 py-2">失效防守线</th>
                        <th className="px-3 py-2">放量 / 涨停基因</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {postmarket.enrolled.map((e) => (
                        <tr key={e.code}>
                          <td className="px-3 py-2 font-bold text-white">
                            {e.name} <span className="font-mono text-slate-400">{e.code}</span>
                          </td>
                          <td className="px-3 py-2">{e.board} · {e.sector}</td>
                          <td className="px-3 py-2 font-mono">¥{e.entry_ref_price.toFixed(2)}</td>
                          <td className="px-3 py-2 font-mono text-cyan-300">
                            {e.buy_low?.toFixed(2)} ~ {e.buy_high?.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 font-mono text-rose-300">¥{e.breakout_price?.toFixed(2)}</td>
                          <td className="px-3 py-2 font-mono text-amber-300">¥{e.invalid_price?.toFixed(2)}</td>
                          <td className="px-3 py-2 font-mono">
                            {e.vol_ratio_5_20 ?? "--"}x / {e.limit_up_count_1y ?? 0}次
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(postmarket.expired_today.length > 0 || postmarket.invalidated_today.length > 0) && (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-300">今日淘汰与过期退出：</div>
                  {[...postmarket.invalidated_today, ...postmarket.expired_today].map((x) => (
                    <div key={x.code} className="text-slate-400">
                      - {x.name}({x.code})：{x.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 04 异常与 AI 研判记录 */}
      {subTab === "anomaly" && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <form onSubmit={handleManualAiAnalyze} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="主动召唤 AI 看盘分析：可留空直接诊断全盘与持仓，或输入具体问题（如：深南电路今天能否低吸？）"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-cyan-500 outline-none"
            />
            <button
              type="submit"
              disabled={runningJob === "manual-ai"}
              className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Bot className="w-4 h-4" />
              <span>{runningJob === "manual-ai" ? "AI 研判中..." : "召唤 AI 立即看盘"}</span>
            </button>
          </form>

          {!anomaly?.records?.length ? (
            <div className="py-10 text-center text-xs text-slate-400">
              当日（{selectedDate}）暂未发生触发大模型唤醒的异常波动或主动研判记录。
            </div>
          ) : (
            <div className="space-y-4">
              {anomaly.records.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-xl bg-slate-950/70 border border-indigo-500/30 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          rec.trigger_type === "auto" ? "text-rose-400" : "text-indigo-400"
                        }`}
                      />
                      <span className="font-bold text-white">
                        {rec.trigger_type === "auto" ? "盘中异动自动唤醒" : "手动深度研判"}
                        {rec.focus_name ? ` · ${rec.focus_name}` : ""}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px]">
                        {rec.sentiment_label}
                      </span>
                      {rec.model_used && (
                        <span className="text-[10px] font-mono text-slate-400">{rec.model_used}</span>
                      )}
                    </div>
                    <span className="font-mono text-slate-500">
                      {new Date(rec.created_at).toLocaleString("zh-CN")}
                    </span>
                  </div>

                  <div className="text-[11px] text-amber-300/90 space-y-0.5">
                    {rec.reasons.map((r, i) => (
                      <div key={i}>• {r}</div>
                    ))}
                  </div>

                  <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed pt-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{rec.analysis_markdown}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
