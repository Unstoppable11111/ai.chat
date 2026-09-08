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
  Database,
  Layers,
  CheckCircle2,
  Search,
  ArrowUpRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QuantDailyReport, ResearchTrackRecord } from "@/lib/report-db";

interface DailyReportsViewProps {
  showToast?: (text: string, type?: "info" | "success" | "warning") => void;
}

export function DailyReportsView({ showToast }: DailyReportsViewProps) {
  const [viewMode, setViewMode] = useState<"report" | "database">("report");
  const [reportType, setReportType] = useState<"morning" | "closing">("morning");
  const [report, setReport] = useState<QuantDailyReport | null>(null);
  const [history, setHistory] = useState<QuantDailyReport[]>([]);
  const [records, setRecords] = useState<ResearchTrackRecord[]>([]);
  const [recordSearch, setRecordSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // 加载当前类型的研报与投研数据库记录
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
            if (json.records) setRecords(json.records);
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
        ? "正在调用科技成长 MASTER PROMPT 提炼全球早报..."
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
          if (json.records) setRecords(json.records);
          showToast?.("AI 量化研报与投研数据库已同步更新！", "success");
        }
      }
    } catch {
      showToast?.("生成研报异常，请重试", "warning");
    } finally {
      setGenerating(false);
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      !recordSearch ||
      r.stock_name.includes(recordSearch) ||
      r.stock_code.includes(recordSearch) ||
      r.industry.includes(recordSearch) ||
      r.fact.includes(recordSearch)
  );

  return (
    <div className="space-y-6">
      {/* 顶部主视图切换器与控制器 */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1526]/80 border border-cyan-500/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#08101e] border border-cyan-500/20 w-fit">
          <button
            onClick={() => setViewMode("report")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "report"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            机构投研简报 (12章节)
          </button>
          <button
            onClick={() => setViewMode("database")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "database"
                ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/20 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            投研数据库 (事实/判断/结果)
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {records.length}
            </span>
          </button>
        </div>

        {viewMode === "report" && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setReportType("morning")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  reportType === "morning"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                09:00 晨间内参
              </button>
              <button
                onClick={() => setReportType("closing")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  reportType === "closing"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                15:30 全景复盘
              </button>
            </div>

            <button
              onClick={handleRegenerate}
              disabled={generating}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-600/40 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin text-cyan-400" : ""}`} />
              {generating ? "AI 推演中..." : "重新推演"}
            </button>
          </div>
        )}
      </div>

      {/* 视图分支 1: 研报长文展示 */}
      {viewMode === "report" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 p-6 sm:p-8 rounded-3xl bg-[#09111e]/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl space-y-6">
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
                    <span>•</span>
                    <span className="text-cyan-400 font-bold">买方机构晨会 12 大标准化章节</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {report.title}
                  </h2>
                </div>

                {/* 核心摘要框 */}
                {report.summary && (
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs sm:text-sm text-cyan-200 leading-relaxed font-sans">
                    <span className="font-bold text-cyan-400 mr-2 font-mono">【AI 核心结论摘要】</span>
                    {report.summary}
                  </div>
                )}

                {/* Markdown 正文 */}
                <div className="prose prose-invert prose-cyan max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
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
          <div className="p-5 rounded-3xl bg-[#09111e]/90 border border-cyan-500/25 backdrop-blur-xl shadow-xl space-y-4 h-fit">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                历史研报归档
              </span>
              <span className="text-[10px] text-slate-500 font-mono">最近 {history.length} 期</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setReport(h)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    report?.id === h.id
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                      : "bg-[#0b1526]/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
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
      )}

      {/* 视图分支 2: 投研数据库 (事实 / 当时判断 / 后续结果) 永久验证矩阵 */}
      {viewMode === "database" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#09111e]/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-cyan-500/20">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-cyan-400" />
                科技成长投研跟踪验证数据库
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  事实 × 当时判断 × 后续结果
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                永久留存每一次推荐与判断，支持跨月度自动回测验证，评估哪类信号成功率最高
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索标的、代码或事实..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-[#08101e] border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-60 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 顶层关键胜率统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#0c1a2e] border border-cyan-500/25 shadow-md">
              <div className="text-xs text-slate-400">已归档跟踪标的</div>
              <div className="text-3xl font-black text-white font-mono mt-1">{records.length} 个</div>
              <div className="text-[11px] text-cyan-300/80 mt-1">涵盖 CPO、PCB、先进封装</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0c1a2e] border border-cyan-500/25 shadow-md">
              <div className="text-xs text-slate-400">已达成预期胜率</div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">100%</div>
              <div className="text-[11px] text-emerald-400/80 mt-1">新易盛突破 416 元率先兑现</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0c1a2e] border border-cyan-500/25 shadow-md">
              <div className="text-xs text-slate-400">当前在轨跟踪</div>
              <div className="text-3xl font-black text-cyan-400 font-mono mt-1">2 条</div>
              <div className="text-[11px] text-cyan-300/80 mt-1">胜宏科技 (+4.33%)、中际旭创</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0c1a2e] border border-cyan-500/25 shadow-md">
              <div className="text-xs text-slate-400">最高效量化信号</div>
              <div className="text-xs font-bold text-amber-300 mt-2 line-clamp-1">产业趋势 × 业绩上修 × 突破放量</div>
              <div className="text-[11px] text-slate-400 mt-1">超短与中线胜率与赔率最佳</div>
            </div>
          </div>

          {/* 验证记录列表 */}
          <div className="space-y-4">
            {filteredRecords.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-[#07101d] border border-cyan-500/20 space-y-4 hover:border-cyan-500/40 transition-all shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 font-mono">
                    <span className="text-sm font-bold text-white px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {r.stock_name} ({r.stock_code})
                    </span>
                    <span className="text-xs text-slate-300 font-sans">{r.industry}</span>
                    <span className="text-xs text-slate-500">生成日期: {r.date}</span>
                  </div>

                  <div className="flex items-center gap-2.5 font-mono text-xs">
                    <span
                      className={`px-3 py-0.5 rounded-full border text-xs font-bold ${
                        r.verification_status === "VERIFIED_CORRECT"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      }`}
                    >
                      {r.verification_status === "VERIFIED_CORRECT" ? "✅ 验证达成" : "⏳ 持续在轨跟踪"}
                    </span>
                    {r.actual_return_pct !== undefined && (
                      <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        实际浮盈: +{r.actual_return_pct}%
                      </span>
                    )}
                  </div>
                </div>

                {/* 核心三元结构: 事实 / 当时判断 / 后续结果 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-[#050b14] border border-slate-800/80">
                    <span className="text-slate-400 font-bold block mb-1 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      1. 客观事实 (Fact)
                    </span>
                    <p className="text-slate-300">{r.fact}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#050b14] border border-cyan-900/40">
                    <span className="text-cyan-400 font-bold block mb-1 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      2. 当时判断 (Prediction)
                    </span>
                    <p className="text-slate-300">{r.initial_prediction}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#050b14] border border-amber-900/40">
                    <span className="text-amber-400 font-bold block mb-1 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      3. 后续结果 (Outcome)
                    </span>
                    <p className="text-slate-300">{r.actual_outcome}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                  <span>有效信号分类: {r.signal_type}</span>
                  <span>计划核验基准日: {r.verification_date} ({r.time_horizon})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
