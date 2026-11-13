"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Target,
  Trophy,
  Sparkles,
  BookmarkCheck,
  UserCheck,
  Copy,
  Check,
} from "lucide-react";
import type { PitchNoteData } from "@/types/workflow";

interface PitchCardProps {
  pitch: PitchNoteData | null;
}

export const PitchCard = React.memo(function PitchCard({ pitch }: PitchCardProps) {
  const [copied, setCopied] = useState(false);

  if (!pitch) {
    return (
      <div className="arch-frame flex flex-col items-center justify-center bg-[#060a14] p-8 text-center min-h-[260px] shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 mb-3">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <p className="font-mono text-sm font-semibold text-white">商业投稿包装看板就绪</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          全案生成完毕后，将自动梳理受众画像、平台对标爆款、付费卡点与核心人设反差，生成面向平台编辑的投稿信。
        </p>
      </div>
    );
  }

  // 一键复制完整的投稿信格式
  const handleCopyPitchNote = () => {
    const text = `【商业投稿提案：《${pitch.title}》】\n\n` +
      `一句话简介：${pitch.logline}\n` +
      `目标受众圈层：${pitch.target_audience}\n` +
      `对标爆款竞品：${pitch.benchmarks}\n\n` +
      `【核心差异化卖点 USP】\n` +
      pitch.selling_points.map((p, i) => `${i + 1}. ${p}`).join("\n") +
      `\n\n【章节付费/留存卡点】\n` +
      pitch.retention_hooks.map((h, i) => `${i + 1}. ${h}`).join("\n") +
      `\n\n【核心人物人设反差】\n${pitch.character_highlights}\n\n` +
      `【精华故事梗概】\n${pitch.synopsis}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="arch-frame bg-[#060a14] p-5 shadow-2xl space-y-4">
      {/* 头部 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">商业投稿与卖点包装 (Pitch Note)</h2>
            <p className="text-[11px] text-muted-foreground">面向网文编辑 · 短剧制片 · IP 商业化评估</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyPitchNote}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>已复制投稿信</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>一键复制投稿信</span>
            </>
          )}
        </button>
      </div>

      {/* 核心卡点与对标信息 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-sm border border-white/10 bg-[#04060b]/80 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Target className="h-3.5 w-3.5 text-cyan-600" />
            <span>核心受众画像</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{pitch.target_audience}</p>
        </div>

        <div className="rounded-sm border border-white/10 bg-[#04060b]/80 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Trophy className="h-3.5 w-3.5 text-amber-600" />
            <span>对标市场头部竞品</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{pitch.benchmarks}</p>
        </div>
      </div>

      {/* 核心卖点与留存卡点 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-sm border border-white/10 bg-[#04060b]/80 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            <span>差异化核心卖点 (USP)</span>
          </div>
          <ul className="space-y-1.5">
            {pitch.selling_points.map((p, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700 mt-0.5">
                  {idx + 1}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-sm border border-white/10 bg-[#04060b]/80 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>情绪曲线与付费卡点</span>
          </div>
          <ul className="space-y-1.5">
            {pitch.retention_hooks.map((h, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 mt-0.5">
                  {idx + 1}
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 核心人设反差 */}
      <div className="rounded-sm border border-white/10 bg-[#04060b]/80 p-3.5 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <UserCheck className="h-3.5 w-3.5 text-blue-600" />
          <span>核心人设反差与人物张力</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{pitch.character_highlights}</p>
      </div>

      {/* 故事梗概 */}
      <div className="rounded-sm border border-white/10 bg-[#04060b]/80 p-3.5 space-y-1.5">
        <p className="text-xs font-bold text-white">500 字精华投稿梗概</p>
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{pitch.synopsis}</p>
      </div>
    </div>
  );
});
