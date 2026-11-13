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

export const VideoPromptBoard = React.memo(function VideoPromptBoard({ chapters }: VideoPromptBoardProps) {
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
    <div className="arch-frame flex flex-col h-full bg-[#060a14] p-5 shadow-2xl">
      {/* 顶部标题与批量复制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-blue-500/30 bg-blue-500/15 text-blue-400">
            <Clapperboard className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              电影级 AI 视频分镜提示词看板
            </h2>
            <p className="text-[11px] text-slate-400">
              适配 可灵 Kling · Runway Gen-3 · Midjourney · 4K/24fps 标准
            </p>
          </div>
        </div>

        {allPromptsCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              共提炼 {allPromptsCount} 个高潮镜头
            </span>
            <button
              type="button"
              onClick={handleCopyAllChapterEn}
              className="flex items-center gap-1.5 rounded-sm border border-blue-500/30 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/25 transition-colors cursor-pointer"
            >
              {copiedKey === "all_chapter_en" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
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
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-b border-white/10 shrink-0 hide-scrollbar">
          {chapters.map((ch, idx) => {
            const isSelected = selectedChapterIndex === idx;
            const promptCount = ch.video_prompts?.length || 0;
            return (
              <button
                key={ch.chapter_number}
                type="button"
                onClick={() => setSelectedChapterIndex(idx)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-blue-500/20 text-blue-200 font-bold border border-blue-500/40"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white border border-transparent"
                }`}
              >
                <span>第 {ch.chapter_number} 章镜头</span>
                <span className="rounded-sm bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-mono text-blue-300">
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
                  className="rounded-sm border border-white/10 bg-[#04060b]/80 p-4 hover:border-cyan-500/30 transition-colors space-y-3.5"
                >
                  {/* 卡片头部：镜头序号、标题与景别 */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-cyan-500/30 bg-cyan-500/15 text-[11px] font-mono font-bold text-cyan-300">
                        {pIdx + 1}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        {item.scene_title}
                      </h3>
                    </div>

                    {/* 景别运镜 Badge */}
                    <div className="inline-flex items-center gap-1.5 rounded-sm border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-[11px] font-medium text-blue-300">
                      <Camera className="h-3 w-3 text-blue-400" />
                      <span>{item.shot_type}</span>
                    </div>
                  </div>

                  {/* 中文画面描述 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <Film className="h-3.5 w-3.5 text-cyan-400" />
                      <span>画面物理细节与光影调度</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-200 bg-[#060a14] p-2.5 rounded-sm border border-white/10">
                      {item.visual_description}
                    </p>
                  </div>

                  {/* 英文提示词 Prompt 区域 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-300">
                        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                        <span>AI 视频生成 Prompt (English)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.ai_prompt_en, itemKey)}
                        className="flex items-center gap-1 text-[11px] font-medium text-violet-300 hover:text-white border border-violet-500/30 bg-violet-500/15 hover:bg-violet-500/25 px-2 py-0.5 rounded-sm transition-colors cursor-pointer"
                      >
                        {copiedKey === itemKey ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-300">已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>复制英文 Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="rounded-sm border border-violet-500/25 bg-[#060a14] p-2.5">
                      <p className="text-xs font-mono text-violet-200 leading-relaxed break-words">
                        {item.ai_prompt_en}
                      </p>
                    </div>
                  </div>

                  {/* 氛围音效建议 */}
                  <div className="flex items-center gap-2 rounded-sm bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-200">
                    <Volume2 className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span className="font-semibold shrink-0">声音线索：</span>
                    <span className="truncate">{item.audio_cue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-blue-500/30 bg-blue-500/15 text-blue-400">
              <Clapperboard className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-white">电影分镜就绪</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                当正文撰写完成后，流水线将自动提取每章节 3~4 个关键视觉高潮镜头，生成适配 Kling、Runway Gen-3 的 4K 提示词。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
