"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Copy,
  Download,
  Check,
  FileText,
  Sparkles,
  BookOpen,
  Wand2,
  Loader2,
  ChevronDown,
  AlertCircle,
  Pencil,
  Edit3,
  X,
} from "lucide-react";
import type { BibleData, ChapterData, WorkflowConfig } from "@/types/workflow";

interface NovelViewerProps {
  bible: BibleData | null;
  chapters: ChapterData[];
  config?: WorkflowConfig;
  streamingText?: string;
  streamingChapter?: number;
  isStreaming?: boolean;
  onUpdateChapter?: (chapterNumber: number, updatedFields: Partial<ChapterData>) => void;
  onUpdateTitle?: (newTitle: string) => void;
  onUpdateChapterTitle?: (chapterNumber: number, newTitle: string) => void;
}

export function NovelViewer({
  bible,
  chapters,
  config,
  streamingText = "",
  streamingChapter = 1,
  isStreaming = false,
  onUpdateChapter,
  onUpdateTitle,
  onUpdateChapterTitle,
}: NovelViewerProps) {
  const [manualChapterIndex, setManualChapterIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"polished" | "raw">("polished");
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 书名手动编辑状态
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  // 章节标题编辑状态
  const [isEditingChapterTitle, setIsEditingChapterTitle] = useState(false);
  const [chapterTitleInput, setChapterTitleInput] = useState("");

  // 章节正文手动编辑状态
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentInput, setContentInput] = useState("");

  // 当处于推流撰写中时，自动追踪流式章节；非推流或手动点击后使用手动索引
  const selectedChapterIndex =
    isStreaming && streamingChapter > 0
      ? streamingChapter - 1
      : manualChapterIndex ?? 0;

  // 打字机流式输出时平滑滚动到底部
  useEffect(() => {
    if (isStreaming && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [streamingText, isStreaming]);

  // 单章根据提示词微调状态
  const [isTuneOpen, setIsTuneOpen] = useState(false);
  const [tuneInstruction, setTuneInstruction] = useState("");
  const [isTuning, setIsTuning] = useState(false);
  const [tuneError, setTuneError] = useState<string | null>(null);

  // 当前所选章节
  const currentChapter = chapters[selectedChapterIndex];

  // 计算当前视窗正文内容
  const isCurrentStreaming = isStreaming && streamingChapter === selectedChapterIndex + 1;
  const currentContent = isCurrentStreaming
    ? streamingText
    : viewMode === "polished" && currentChapter?.polished_content
    ? currentChapter.polished_content
    : currentChapter?.raw_content || "";

  // 章节标题
  const currentTitle =
    currentChapter?.title ||
    bible?.outlines?.[selectedChapterIndex]?.title ||
    `第 ${selectedChapterIndex + 1} 章`;

  const totalWords = chapters.reduce((acc, c) => {
    const text = c.polished_content || c.raw_content || "";
    return acc + text.length;
  }, 0) + (isStreaming ? streamingText.length : 0);

  // 复制文本
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 下载全本 TXT
  const handleDownloadTxt = () => {
    if (!chapters.length && !streamingText) return;
    const bookTitle = bible?.title || "AI_Novel_Draft";
    let fullText = `《${bookTitle}》\n\n`;
    if (bible?.logline) fullText += `【一句话梗概】\n${bible.logline}\n\n`;
    if (bible?.worldview) fullText += `【核心世界观】\n${bible.worldview}\n\n`;

    chapters.forEach((ch) => {
      fullText += `\n=========================\n第 ${ch.chapter_number} 章：${ch.title}\n=========================\n\n`;
      fullText += (ch.polished_content || ch.raw_content) + "\n\n";
    });

    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${bookTitle}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 针对当前章执行提示词专项调优
  const handleTuneChapter = async () => {
    if (!currentChapter || !tuneInstruction.trim() || isTuning) return;

    setIsTuning(true);
    setTuneError(null);

    const targetOutline = bible?.outlines?.find(
      (o) => o.chapter_number === currentChapter.chapter_number
    );

    try {
      const res = await fetch("/api-workflow/chapter-tune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookTitle: bible?.title || "未命名小说",
          worldview: bible?.worldview || "",
          characterCards: bible?.characters || [],
          chapterOutline: targetOutline,
          chapterNumber: currentChapter.chapter_number,
          chapterTitle: currentChapter.title,
          currentContent: currentChapter.polished_content || currentChapter.raw_content,
          userInstruction: tuneInstruction.trim(),
          style: config?.style,
          deAiLevel: config?.deAiLevel,
          apiKey: config?.apiKey,
          baseUrl: config?.baseUrl,
          model: config?.model,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "调优请求失败");
      }

      // 更新当前章节精修正文
      onUpdateChapter?.(currentChapter.chapter_number, {
        polished_content: data.tuned_content,
      });

      setViewMode("polished");
      setTuneInstruction("");
      setIsTuneOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "调优执行失败";
      setTuneError(msg);
    } finally {
      setIsTuning(false);
    }
  };

  const handleSaveTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && onUpdateTitle) {
      onUpdateTitle(trimmed);
    }
    setIsEditingTitle(false);
  };

  const handleSaveChapterTitle = () => {
    const trimmed = chapterTitleInput.trim();
    if (trimmed && currentChapter) {
      onUpdateChapterTitle?.(currentChapter.chapter_number, trimmed);
      onUpdateChapter?.(currentChapter.chapter_number, { title: trimmed });
    }
    setIsEditingChapterTitle(false);
  };

  const handleSaveContent = () => {
    if (!currentChapter) return;
    if (viewMode === "polished" && currentChapter.polished_content) {
      onUpdateChapter?.(currentChapter.chapter_number, { polished_content: contentInput });
    } else {
      onUpdateChapter?.(currentChapter.chapter_number, { raw_content: contentInput });
    }
    setIsEditingContent(false);
  };

  return (
    <div className="flex flex-col h-full rounded-3xl border border-slate-900/10 bg-white/90 p-5 shadow-xs backdrop-blur-md">
      {/* 顶部工具栏与统计 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 my-0.5">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  className="rounded-lg border border-cyan-500 bg-white px-2 py-0.5 text-xs font-bold text-slate-900 focus:outline-hidden"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer"
                  title="保存书名"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                  title="取消"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 group cursor-pointer"
                onClick={() => {
                  setTitleInput(bible?.title || "");
                  setIsEditingTitle(true);
                }}
                title="点击修改书名"
              >
                <h2 className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs group-hover:text-cyan-700 transition-colors">
                  {bible?.title || "小说正文创作视窗"}
                </h2>
                <Pencil className="h-3 w-3 text-slate-400 group-hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground flex items-center gap-2">
              <span>全书累计约 {totalWords} 字</span>
              {currentChapter && <span>· 本章 {currentContent.length} 字</span>}
            </p>
          </div>
        </div>

        {/* 操作胶囊群 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 手动自由修改正文入口 */}
          {currentChapter && !isStreaming && (
            isEditingContent ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSaveContent}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-2xs transition-all cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>保存正文</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingContent(false)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>取消</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setContentInput(currentContent);
                  setIsEditingContent(true);
                }}
                className="flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50/80 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 transition-all cursor-pointer"
                title="手动自由修改本章正文"
              >
                <Edit3 className="h-3.5 w-3.5 text-cyan-600" />
                <span>编辑正文</span>
              </button>
            )
          )}
          {/* 单章按提示词调优入口 */}
          {currentChapter && (
            <button
              type="button"
              onClick={() => setIsTuneOpen(!isTuneOpen)}
              className="flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50/80 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-all cursor-pointer"
            >
              <Wand2 className="h-3 w-3 text-violet-600" />
              <span>本章提示词调优</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isTuneOpen ? "rotate-180" : ""}`} />
            </button>
          )}

          {/* 原文与精修对比切换 */}
          {currentChapter?.polished_content && (
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("polished")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  viewMode === "polished"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="h-3 w-3 text-cyan-600" />
                <span>去AI精修版</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  viewMode === "raw"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>原始初稿</span>
              </button>
            </div>
          )}

          {/* 一键复制当前章 */}
          <button
            type="button"
            onClick={() => handleCopy(currentContent)}
            disabled={!currentContent}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-cyan-500/40 hover:text-cyan-700 transition-all disabled:opacity-40"
            title="复制本章"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">已复制</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>复制</span>
              </>
            )}
          </button>

          {/* 下载 TXT */}
          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={!chapters.length && !streamingText}
            className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-all shadow-2xs disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>导出 TXT</span>
          </button>
        </div>
      </div>

      {/* 单章提示词微调抽屉 */}
      {isTuneOpen && currentChapter && (
        <div className="mt-3 p-3.5 rounded-2xl border border-violet-200 bg-violet-50/50 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
              <Wand2 className="h-3.5 w-3.5 text-violet-600" />
              <span>根据提示词微调当前章节（绑定《{bible?.title}》专属世界观与人设约束）</span>
            </div>
            <span className="text-[10px] text-violet-700 font-mono">
              第 {currentChapter.chapter_number} 章 · {currentChapter.title}
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={tuneInstruction}
              onChange={(e) => setTuneInstruction(e.target.value)}
              placeholder="输入调优指令（如：强化男主反杀时的压迫感；增加周围暴雨细节；把对白拆得更短更凶狠……）"
              disabled={isTuning}
              className="flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:outline-hidden disabled:bg-slate-50"
            />
            <button
              type="button"
              onClick={handleTuneChapter}
              disabled={isTuning || !tuneInstruction.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isTuning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>调优中...</span>
                </>
              ) : (
                <span>立即调优本章</span>
              )}
            </button>
          </div>

          {tuneError && (
            <div className="flex items-center gap-1 text-[11px] text-rose-600">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{tuneError}</span>
            </div>
          )}
        </div>
      )}

      {/* 章节导航 Tab 列表 */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-b border-slate-100 shrink-0 hide-scrollbar">
        {bible?.outlines && bible.outlines.length > 0 ? (
          bible.outlines.map((outline, idx) => {
            const chNum = outline.chapter_number || idx + 1;
            const isSelected = selectedChapterIndex === idx;
            const isThisStreaming = isStreaming && streamingChapter === chNum;
            const existing = chapters.find((c) => c.chapter_number === chNum);

            return (
              <button
                key={chNum}
                type="button"
                onClick={() => setManualChapterIndex(idx)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500/15 text-cyan-800 font-bold border border-cyan-500/30 shadow-2xs"
                    : isThisStreaming
                    ? "bg-amber-50 text-amber-800 border border-amber-300 animate-pulse"
                    : existing
                    ? "text-slate-700 hover:bg-slate-100 border border-transparent"
                    : "text-slate-400 hover:bg-slate-50 border border-transparent opacity-60"
                }`}
              >
                <span>第 {chNum} 章</span>
                <span className="text-[10px] truncate max-w-[85px]">
                  {existing?.title || outline.title}
                </span>
                {isThisStreaming && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-600 animate-ping" />
                )}
              </button>
            );
          })
        ) : chapters.length > 0 ? (
          chapters.map((ch, idx) => {
            const isSelected = selectedChapterIndex === idx;
            return (
              <button
                key={ch.chapter_number}
                type="button"
                onClick={() => setManualChapterIndex(idx)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500/15 text-cyan-800 font-bold border border-cyan-500/30"
                    : "text-slate-600 hover:bg-slate-100 border border-transparent"
                }`}
              >
                <span>第 {ch.chapter_number} 章</span>
                <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[90px]">
                  {ch.title}
                </span>
              </button>
            );
          })
        ) : isStreaming ? (
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-cyan-700 bg-cyan-50 rounded-xl border border-cyan-200">
            <span className="animate-spin inline-block h-2 w-2 rounded-full border-2 border-cyan-600 border-t-transparent"></span>
            <span>正在流水线撰写第 {streamingChapter} 章...</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 py-1">等待启动工作流...</span>
        )}
      </div>

      {/* 正文打字机滚动视窗 */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 overflow-y-auto p-4 md:p-6 min-h-[360px] max-h-[580px] scroll-smooth"
      >
        {currentContent ? (
          <div className="space-y-4">
            {/* 本章标题头 */}
            <div className="space-y-1 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                {isEditingChapterTitle ? (
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <span className="text-base sm:text-lg font-bold text-slate-900 shrink-0">
                      第 {selectedChapterIndex + 1} 章：
                    </span>
                    <input
                      type="text"
                      value={chapterTitleInput}
                      onChange={(e) => setChapterTitleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveChapterTitle();
                        if (e.key === "Escape") setIsEditingChapterTitle(false);
                      }}
                      className="rounded-lg border border-cyan-500 bg-white px-2.5 py-1 text-sm font-bold text-slate-900 focus:outline-hidden flex-1"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveChapterTitle}
                      className="p-1 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer"
                      title="保存章节名"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingChapterTitle(false)}
                      className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                      title="取消"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 group cursor-pointer"
                    onClick={() => {
                      setChapterTitleInput(currentTitle);
                      setIsEditingChapterTitle(true);
                    }}
                    title="点击修改章节标题"
                  >
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                      第 {selectedChapterIndex + 1} 章：{currentTitle}
                    </h3>
                    <Pencil className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                {isCurrentStreaming && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 animate-ping" />
                    SSE 工业打字机推流中 ({streamingText.length} 字)
                  </span>
                )}
              </div>
              {viewMode === "polished" && currentChapter?.polished_content && !isCurrentStreaming && (
                <p className="text-[11px] text-violet-700 bg-violet-50 inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono">
                  <Sparkles className="h-3 w-3" />
                  已应用文学精修版
                </p>
              )}
            </div>

            {/* 正文段落渲染 / 手动自由编辑 */}
            {isEditingContent ? (
              <div className="space-y-2.5">
                <textarea
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  className="w-full h-[450px] p-4 rounded-2xl border border-cyan-400 bg-white text-sm sm:text-base leading-relaxed text-slate-800 focus:outline-hidden font-sans tracking-wide resize-y shadow-inner"
                  placeholder="在此自由修改、润色或增删章节正文内容..."
                />
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>当前字数：{contentInput.length} 字</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingContent(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      放弃修改
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveContent}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 cursor-pointer shadow-xs"
                    >
                      保存正文
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm sm:text-base leading-relaxed sm:leading-loose text-slate-800 whitespace-pre-wrap font-sans tracking-wide">
                {currentContent}
                {isCurrentStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-cyan-600 animate-pulse align-middle rounded-xs" />
                )}
              </div>
            )}
          </div>
        ) : (
          /* 空状态引导 */
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">正文打字机就绪</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                在左侧输入故事设定并启动工业化工作流，小说正文将以 SSE 流式长连接实时呈现，并支持单章按提示词定向微调。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
