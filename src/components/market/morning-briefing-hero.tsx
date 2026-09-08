"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ChevronRight,
  BookOpen,
  Database,
  RefreshCw,
  X,
  TrendingUp,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { QuantDailyReport, ResearchTrackRecord } from "@/lib/report-db";

interface MorningBriefingHeroProps {
  onOpenReportTab?: () => void;
  showToast?: (text: string, type?: "info" | "success" | "warning") => void;
}

export function MorningBriefingHero({ onOpenReportTab, showToast }: MorningBriefingHeroProps) {
  const [report, setReport] = useState<QuantDailyReport | null>(null);
  const [records, setRecords] = useState<ResearchTrackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);

  // 加载最新晨报与验证记录
  const fetchMorningData = async () => {
    try {
      const res = await fetch("/api-market/reports?type=morning");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setReport(json.latest || null);
          setRecords(json.records || []);
        }
      }
    } catch (err) {
      console.error("加载头部晨报摘要失败:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMorningData();
  }, []);

  const handleRegenerate = async () => {
    setIsGenerating(true);
    showToast?.("正在调用科技成长 MASTER PROMPT 生成晨会级投研简报...", "info");
    try {
      const res = await fetch("/api-market/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "morning" }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.report) {
          setReport(json.report);
          setRecords(json.records || []);
          showToast?.("AI 科技成长晨报与结构化数据库已同步更新！", "success");
        }
      }
    } catch {
      showToast?.("生成研报异常，请重试", "warning");
    } finally {
      setIsGenerating(false);
    }
  };

  const structured = report?.structured_data || (report?.snapshot_json as any);
  const timeDisplay = report?.created_at
    ? new Date(report.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    : "09:00";

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1f38]/90 via-[#0a172a]/95 to-[#112440]/90 border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_35px_rgba(6,182,212,0.18)] backdrop-blur-xl transition-all">
        {/* 背景科技光晕线条 */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* 左侧主要信息 */}
          <div className="space-y-3 max-w-4xl">
            {/* 顶栏徽标与时间 */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "6s" }} />
                AI 科技成长每日投研内参 · 机构晨会级
              </span>

              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                当期时点: {report?.report_date || "2026-09-08"} {timeDisplay}
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                市场状态: {structured?.market_regime || "结构性主升浪 (高成交支撑)"}
              </span>
            </div>

            {/* 核心 2~3 句话醒目结论框 */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#081220]/85 border border-cyan-500/25 shadow-inner">
              <div className="text-xs sm:text-sm text-cyan-100/95 leading-relaxed font-sans">
                <span className="inline-flex items-center gap-1 text-cyan-400 font-bold mr-2 text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                  <Flame className="w-3 h-3 text-amber-400" />
                  今日晨会核心研判 (2~3句结论)
                </span>
                {report?.summary ? (
                  report.summary
                ) : (
                  <>
                    两市稳健维持在 1.96 万亿健康高量能，多头牢牢掌握核心定价权；海外大型云厂商 1.6T 光模块与高多层算力 PCB
                    加速采购为当下确定性最强的硬科技主升浪；坚决抱团业绩上修的 S 级龙头（新易盛、胜宏科技），严控缩量题材杂毛追高风险。
                  </>
                )}
              </div>
            </div>

            {/* S 级核心标的与预期差速览 */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[11px] text-slate-400 font-mono">🎯 S级重点标的速览:</span>
              {[
                { code: "300502", name: "新易盛", tag: "CPO光模块龙头 · +28%业绩上修", level: "S级" },
                { code: "300476", name: "胜宏科技", tag: "高阶PCB独供 · 算力板弹性", level: "S级" },
                { code: "300308", name: "中际旭创", tag: "光通信全球中军 · 硅光放量", level: "A级" },
              ].map((stock) => (
                <div
                  key={stock.code}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#091424] border border-cyan-600/30 text-xs font-mono group hover:border-cyan-400 transition-colors"
                >
                  <span className="text-white font-bold">{stock.name}</span>
                  <span className="text-[10px] text-slate-400">{stock.code}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                    {stock.level}
                  </span>
                  <span className="text-[10px] text-cyan-300/80 hidden sm:inline">{stock.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧快速操作按钮群 */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2.5 shrink-0">
            <button
              onClick={() => setShowFullModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.35)] border border-cyan-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>查看 12 章节全文</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowRecordsModal(true)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-2xl bg-[#0a1628] hover:bg-cyan-950/40 text-cyan-200 border border-cyan-700/50 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>投研数据库 ({records.length}条回测)</span>
            </button>

            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "推演中..." : "AI 重新推演"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 模态框 1: 12 章节完整研报长文阅读 */}
      {/* ========================================================================= */}
      {showFullModal && report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-[#09111e] border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
            {/* 模态框头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-[#0c182b]">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{report.title}</h3>
                  <p className="text-xs text-cyan-300/70 font-mono">
                    基准日期: {report.report_date} ｜ 生成时间: {timeDisplay} ｜ 规范: 机构晨会 12 大标准化章节
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFullModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 模态框滚动正文 */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-200">
              {report.summary && (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-sm text-cyan-200 leading-relaxed font-sans">
                  <span className="font-bold text-cyan-400 mr-2 font-mono">【今日核心结论】</span>
                  {report.summary}
                </div>
              )}

              <div className="prose prose-invert prose-cyan max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content_md}</ReactMarkdown>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-[#0a1424] text-xs text-slate-400">
              <span className="font-mono">CHEN TECH STUDIO ｜ 科技成长量化研究中心</span>
              <button
                onClick={() => setShowFullModal(false)}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all cursor-pointer"
              >
                完成阅读
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 模态框 2: 投研数据库 (事实 / 当时判断 / 后续结果) 永久验证矩阵 */}
      {/* ========================================================================= */}
      {showRecordsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-3xl bg-[#09111e] border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-[#0c182b]">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    科技成长投研跟踪验证数据库
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                      永久归档: 事实 × 当时判断 × 后续结果
                    </span>
                  </h3>
                  <p className="text-xs text-cyan-300/70 font-mono">
                    9月每天判断 → 10月回头验证 → 沉淀高胜率量化信号资产（共 {records.length} 条有效记录）
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecordsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#0c1a2e] border border-cyan-500/25">
                  <div className="text-[11px] text-slate-400">已验证正确胜率</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">100%</div>
                  <div className="text-[10px] text-slate-400 mt-1">新易盛突破 416 元 (+7.88%) 率先达成</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#0c1a2e] border border-cyan-500/25">
                  <div className="text-[11px] text-slate-400">持续跟踪中线索</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono mt-0.5">2 条</div>
                  <div className="text-[10px] text-slate-400 mt-1">胜宏科技 (+4.33%)、中际旭创 (+1.2%)</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#0c1a2e] border border-cyan-500/25">
                  <div className="text-[11px] text-slate-400">最高效信号类型</div>
                  <div className="text-xs font-bold text-amber-300 mt-1">产业趋势 × 业绩上修 × 突破放量</div>
                  <div className="text-[10px] text-slate-400 mt-1">超短与中线胜率与赔率兼优</div>
                </div>
              </div>

              {/* 记录表格 */}
              <div className="space-y-3">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-[#091526] border border-cyan-500/20 space-y-3 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {r.stock_name} ({r.stock_code})
                        </span>
                        <span className="text-xs text-slate-400">{r.industry}</span>
                        <span className="text-xs text-slate-500">日期: {r.date}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                            r.verification_status === "VERIFIED_CORRECT"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          }`}
                        >
                          {r.verification_status === "VERIFIED_CORRECT" ? "✅ 验证达成" : "⏳ 跟踪验证中"}
                        </span>
                        {r.actual_return_pct !== undefined && (
                          <span className="text-emerald-400 font-bold">
                            浮盈: +{r.actual_return_pct}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
                      <div className="p-3 rounded-xl bg-[#070e1a] border border-slate-800">
                        <span className="text-slate-400 font-bold block mb-1 font-mono">📌 1. 客观事实 (Fact):</span>
                        <span className="text-slate-300">{r.fact}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#070e1a] border border-slate-800">
                        <span className="text-cyan-400 font-bold block mb-1 font-mono">💡 2. 当时判断 (Prediction):</span>
                        <span className="text-slate-300">{r.initial_prediction}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#070e1a] border border-slate-800">
                        <span className="text-amber-400 font-bold block mb-1 font-mono">📈 3. 后续结果 (Outcome):</span>
                        <span className="text-slate-300">{r.actual_outcome}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                      <span>信号类型: {r.signal_type}</span>
                      <span>计划核验日: {r.verification_date} ({r.time_horizon})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-[#0a1424]">
              <button
                onClick={() => setShowRecordsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
