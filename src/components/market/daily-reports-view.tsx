"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { QuantDailyReport } from "@/lib/report-db";

export function DailyReportsView({ showToast }: { showToast?: (text: string, type?: "info" | "success" | "warning") => void }) {
  const [type, setType] = useState<"morning" | "closing">("morning");
  const [history, setHistory] = useState<QuantDailyReport[]>([]);
  const [report, setReport] = useState<QuantDailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => { setLoading(true); setError(""); });
    fetch(`/api-market/reports?type=${type}`, { signal: controller.signal })
      .then(async res => { if (!res.ok) throw new Error("历史记录加载失败"); return res.json(); })
      .then(data => { setHistory(data.history || []); setReport(data.latest || null); })
      .catch(err => { if (!controller.signal.aborted) { setError(err.message); setHistory([]); setReport(null); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [type]);
  async function save() {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api-market/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({type}) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "保存失败，请重试");
      setReport(data.report); setHistory(prev => [data.report, ...prev.filter(item => item.id !== data.report.id)]);
      showToast?.("持仓快照已保存", "success");
    } catch (err) { setError(err instanceof Error ? err.message : "保存失败"); }
    finally { setSaving(false); }
  }
  return <section className="space-y-5 text-slate-200">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-4">
      <h2 className="text-lg font-semibold">持仓快照历史</h2>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="快照类型" className="flex rounded-lg border border-slate-700 p-1">{(["morning", "closing"] as const).map(value => <button key={value} disabled={saving} aria-pressed={type === value} onClick={() => setType(value)} className={`rounded px-3 py-2 text-xs ${type === value ? "bg-cyan-700 text-white" : "text-slate-300"}`}>{value === "morning" ? "早间记录" : "收盘记录"}</button>)}</div>
        <button disabled={saving || loading} onClick={save} className="flex items-center gap-2 rounded-lg border border-cyan-700 px-3 py-2 text-xs disabled:opacity-50"><RefreshCw size={16} className={saving ? "animate-spin" : ""}/>{saving ? "保存中" : "保存当前快照"}</button>
      </div>
    </div>
    {error && <p role="alert" className="text-amber-300">{error}</p>}
    {loading ? <p role="status">正在加载记录</p> : <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
      <nav aria-label="历史快照" className="flex flex-col gap-2">{history.map(item => <button key={item.id} aria-current={report?.id === item.id ? "true" : undefined} onClick={() => setReport(item)} className={`rounded-lg border px-3 py-2 text-left text-sm ${report?.id === item.id ? "border-cyan-500 text-cyan-200" : "border-slate-700"}`}>{item.report_date}</button>)}</nav>
      <div className="min-w-0 overflow-x-auto prose prose-invert max-w-none">{report ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content_md}</ReactMarkdown> : <p>暂无已保存的持仓快照</p>}</div>
    </div>}
  </section>;
}
