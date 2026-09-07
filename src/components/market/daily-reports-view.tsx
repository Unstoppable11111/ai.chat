"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  RefreshCw,
  Calendar,
  Sparkles,
  ChevronRight,
  FileText,
  Clock,
  Globe2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QuantDailyReport } from "@/lib/report-db";

interface DailyReportsViewProps {
  showToast?: (text: string, type?: "info" | "success" | "warning") => void;
}

export function DailyReportsView({ showToast }: DailyReportsViewProps) {
  const [reportType, setReportType] = useState<"morning" | "closing">("morning");
  const [report, setReport] = useState<QuantDailyReport | null>(null);
  const [history, setHistory] = useState<QuantDailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // 加载当前类型的研报
  useEffect(() => {
    let ignore = false;
    async function loadReport() {
      setLoading(true);
      try {
        const res = await fetch(`/api-market/reports?type=${reportType}`);
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.success) {
            setReport(json.latest || null);
            setHistory(json.history || []);
          }
        }
      } catch (err) {
        console.error("加载研报失败:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadReport();
    return () => {
      ignore = true;
    };
  }, [reportType]);

  // 手动触发重新生成
  const handleRegenerate = async () => {
    setGenerating(true);
    showToast?.(
      reportType === "morning"
        ? "正在拉取彭博/路透最新要闻并由 AI 提炼全球早报..."
        : "正在汇算 A股全天收盘数据并由 AI 提炼收盘复盘...",
      "info"
    );
    try {
      const res = await fetch("/api-market/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: reportType }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.report) {
          setReport(json.report);
          setHistory((prev) => [json.report, ...prev.filter((p) => p.id !== json.report.id)]);
          showToast?.("AI 量化研报已生成并持久化归档！", "success");
        }
      }
    } catch {
      showToast?.("生成研报异常，请重试", "warning");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部报告类型选择器与控制器 */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/60 w-fit">
          <button
            onClick={() => setReportType("morning")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              reportType === "morning"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sun className="w-4 h-4" />
            08:30 晨间全球内参 (彭博/路透)
          </button>
          <button
            onClick={() => setReportType("closing")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              reportType === "closing"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Moon className="w-4 h-4" />
            17:00 全景收盘复盘 (A股全景)
          </button>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin text-cyan-400" : ""}`} />
          {generating ? "AI 正在实时提炼研报..." : "手动触发生成最新研报"}
        </button>
      </div>

      {/* 研报正文展示卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Sparkles className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
              <p className="text-sm">正在加载量化研报内容...</p>
            </div>
          ) : report ? (
            <>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>报告日期: {report.report_date}</span>
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>生成时间: {new Date(report.created_at).toLocaleTimeString("zh-CN")}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {report.title}
                </h2>
              </div>

              {/* 核心摘要框 */}
              {report.summary && (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs sm:text-sm text-cyan-200/90 leading-relaxed">
                  <span className="font-bold text-cyan-400 mr-2">【AI 核心结论摘要】</span>
                  {report.summary}
                </div>
              )}

              {/* Markdown 正文 */}
              <div className="prose prose-invert prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-300 space-y-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content_md}</ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Globe2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm">暂无当前日期的研报数据</p>
              <button
                onClick={handleRegenerate}
                className="text-xs px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium"
              >
                立即生成今日研报
              </button>
            </div>
          )}
        </div>

        {/* 右侧历史归档侧边栏 */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              历史研报归档
            </span>
            <span className="text-[10px] text-slate-500">最近 {history.length} 期</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => setReport(h)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  report?.id === h.id
                    ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                    : "bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                <div className="truncate mr-2">
                  <div className="text-[11px] font-mono text-slate-400">{h.report_date}</div>
                  <div className="text-xs font-medium truncate mt-0.5">{h.title}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>
            ))}
            {history.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-500">暂无历史记录</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
