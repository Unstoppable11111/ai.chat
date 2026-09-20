"use client";

import React, { useState } from "react";
import {
  Clapperboard,
  Volume2,
  Copy,
  Check,
  Sparkles,
  Camera,
  Film,
} from "lucide-react";
import type { ChapterData } from "@/types/workflow";

interface VideoPromptBoardProps {
  chapters: ChapterData[];
}

export function VideoPromptBoard({ chapters }: VideoPromptBoardProps) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeChapter = chapters[selectedChapterIndex] || chapters[0];
  const allPromptsCount = chapters.reduce(
    (acc, c) => acc + (c.video_prompts?.length || 0),
    0
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 复制当前章节全部英文 Prompt
  const handleCopyAllChapterEn = () => {
    if (!activeChapter?.video_prompts?.length) return;
    const allEn = activeChapter.video_prompts
      .map((p, i) => `// Shot ${i + 1}: ${p.scene_title}\n${p.ai_prompt_en}`)
      .join("\n\n");
    handleCopy(allEn, "all_chapter_en");
  };

  return (
    <div className="flex flex-col h-full rounded-3xl border border-slate-900/10 bg-white/90 p-5 shadow-xs backdrop-blur-md">
      {/* 顶部标题与批量复制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700">
            <Clapperboard className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              电影级 AI 视频分镜提示词看板
            </h2>
            <p className="text-[11px] text-muted-foreground">
              适配 可灵 Kling · Runway Gen-3 · Midjourney · 4K/24fps 标准
            </p>
          </div>
        </div>

        {allPromptsCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">
              共提炼 {allPromptsCount} 个高潮镜头
            </span>
            <button
              type="button"
              onClick={handleCopyAllChapterEn}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {copiedKey === "all_chapter_en" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>已批量复制本章 Prompts</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>一键导出本章英文 Prompts</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 章节导航 Tab */}
      {chapters.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-b border-slate-100 shrink-0 hide-scrollbar">
          {chapters.map((ch, idx) => {
            const isSelected = selectedChapterIndex === idx;
            const promptCount = ch.video_prompts?.length || 0;
            return (
              <button
                key={ch.chapter_number}
                type="button"
                onClick={() => setSelectedChapterIndex(idx)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-blue-500/15 text-blue-800 font-bold border border-blue-500/30"
                    : "text-slate-600 hover:bg-slate-100 border border-transparent"
                }`}
              >
                <span>第 {ch.chapter_number} 章镜头</span>
                <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-mono text-blue-800">
                  {promptCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 分镜卡片滚动列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-[360px] max-h-[580px]">
        {activeChapter?.video_prompts && activeChapter.video_prompts.length > 0 ? (
          <div className="space-y-4">
            {activeChapter.video_prompts.map((item, pIdx) => {
              const itemKey = `ch_${activeChapter.chapter_number}_shot_${pIdx}`;
              return (
                <div
                  key={pIdx}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-3.5"
                >
                  {/* 卡片头部：镜头序号、标题与景别 */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-mono font-bold text-white">
                        {pIdx + 1}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        {item.scene_title}
                      </h3>
                    </div>

                    {/* 景别运镜 Badge */}
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                      <Camera className="h-3 w-3 text-blue-600" />
                      <span>{item.shot_type}</span>
                    </div>
                  </div>

                  {/* 中文画面描述 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <Film className="h-3.5 w-3.5 text-cyan-600" />
                      <span>画面物理细节与光影调度</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-700 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      {item.visual_description}
                    </p>
                  </div>

                  {/* 英文提示词 Prompt 区域 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700">
                        <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                        <span>AI 视频生成 Prompt (English)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.ai_prompt_en, itemKey)}
                        className="flex items-center gap-1 text-[11px] font-medium text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedKey === itemKey ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700">已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>复制英文 Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-2.5">
                      <p className="text-xs font-mono text-violet-950 leading-relaxed break-words">
                        {item.ai_prompt_en}
                      </p>
                    </div>
                  </div>

                  {/* 氛围音效建议 */}
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50/70 border border-amber-200/60 px-3 py-2 text-xs text-amber-900">
                    <Volume2 className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span className="font-semibold shrink-0">声音线索：</span>
                    <span className="truncate">{item.audio_cue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-400">
              <Clapperboard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">电影分镜就绪</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                当正文撰写完成后，流水线将自动提取每章节 3~4 个关键视觉高潮镜头，生成适配 Kling、Runway Gen-3 的 4K 提示词。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
