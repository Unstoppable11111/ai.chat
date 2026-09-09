"use client";

import { useEffect, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import type { QuantDailyReport } from "@/lib/report-db";

export function MorningBriefingHero({ onOpenReportTab, showToast }: {
  onOpenReportTab?: () => void;
  showToast?: (text: string, type?: "info" | "success" | "warning") => void;
}) {
  const [report, setReport] = useState<QuantDailyReport | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api-market/reports?type=morning", { signal: controller.signal })
      .then(async res => { if (!res.ok) throw new Error("持仓快照暂时不可用"); return res.json(); })
      .then(data => setReport(data.latest || null))
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, []);
  async function save() {
    setPending(true); setError("");
    try {
      const res = await fetch("/api-market/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({type:"morning"}) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "保存失败，请重试");
      setReport(data.report); showToast?.("持仓快照已保存", "success");
    } catch (err) { setError(err instanceof Error ? err.message : "保存失败"); }
    finally { setPending(false); }
  }
  return <section className="flex flex-col gap-4 border-y border-cyan-500/25 bg-[#0a172a]/80 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0 space-y-2"><h2 className="text-base font-semibold text-cyan-100">账户持仓快照</h2>
      <p className="text-sm leading-relaxed text-slate-300">{report?.summary || "尚未保存持仓快照"}</p>
      {report && <p className="text-xs text-slate-400">保存日期：{report.report_date}</p>}
      {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
    </div>
    <div className="flex shrink-0 flex-wrap gap-2">
      <button onClick={onOpenReportTab} className="flex items-center gap-2 rounded-lg border border-cyan-700 px-3 py-2 text-xs text-cyan-200"><FileText size={16}/>历史记录</button>
      <button onClick={save} disabled={pending} className="flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-xs text-white disabled:opacity-50"><RefreshCw size={16} className={pending ? "animate-spin" : ""}/>{pending ? "保存中" : "保存当前快照"}</button>
    </div>
  </section>;
}
