"use client";

import React from "react";
import { Plus, BookOpen, Clock, Trash2, Layers } from "lucide-react";
import type { WorkflowProject } from "@/types/workflow";

interface NovelShelfProps {
  projects: WorkflowProject[];
  currentProjectId: string | null;
  isRunning?: boolean;
  onSelectProject: (id: string) => void;
  onCreateNew: () => void;
  onReqDeleteProject: (proj: WorkflowProject, e: React.MouseEvent) => void;
  onBlockedAction?: (reason: string) => void;
}

export function NovelShelf({
  projects,
  currentProjectId,
  isRunning = false,
  onSelectProject,
  onCreateNew,
  onReqDeleteProject,
  onBlockedAction,
}: NovelShelfProps) {
  const handleSelect = (id: string) => {
    if (isRunning) {
      onBlockedAction?.("当前正在工业化生产小说，为保障各书世界观与资产绑定不发生混乱，请等待当前书籍生成完毕或先点击「中止流水线」。");
      return;
    }
    onSelectProject(id);
  };

  const handleCreate = () => {
    if (isRunning) {
      onBlockedAction?.("当前正在运行创作流水线，请等待当前全案完成或先中止任务，再创作全新小说。");
      return;
    }
    onCreateNew();
  };

  return (
    <div className="rounded-3xl border border-slate-900/10 bg-white/80 p-5 shadow-xs backdrop-blur-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">我的小说书架库</h2>
            <p className="text-[11px] text-muted-foreground">
              共已工业化生产 {projects.length} 部小说全案，各书参数与人设独立绑定，全书生成完毕后自动精美成册入库
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={isRunning}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-95 shadow-2xs transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>创作全新小说</span>
        </button>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {projects.map((proj) => {
            const isSelected = proj.id === currentProjectId;
            const totalWords = proj.chapters.reduce(
              (acc, c) => acc + (c.polished_content || c.raw_content || "").length,
              0
            );

            return (
              <div
                key={proj.id}
                onClick={() => handleSelect(proj.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-2.5 transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-50/50 shadow-md ring-2 ring-cyan-500/20"
                    : "border-slate-200/90 bg-white hover:border-cyan-400 hover:shadow-xs"
                } ${isRunning ? "hover:border-amber-400" : ""}`}
              >
                {/* 封面图区域 */}
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-900 shadow-inner">
                  {proj.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proj.cover_url}
                      alt={proj.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-cyan-400">
                      <BookOpen className="h-7 w-7 opacity-70 mb-1" />
                      <p className="line-clamp-2 text-xs font-bold text-white">{proj.title}</p>
                    </div>
                  )}

                  {/* 悬浮删除操作 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isRunning) {
                        onBlockedAction?.("流水线正在运行中，暂时无法删除小说。");
                        return;
                      }
                      onReqDeleteProject(proj, e);
                    }}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/60 text-white/80 hover:bg-rose-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    title="删除本小说"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>

                  {/* 底部章节字数徽章 */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6 text-[10px] text-white/90 flex items-center justify-between">
                    <span className="font-mono">{proj.chapters.length} 章</span>
                    <span className="font-mono">{totalWords} 字</span>
                  </div>
                </div>

                {/* 底部信息 */}
                <div className="pt-2 px-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                      {proj.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="rounded bg-slate-100 px-1 py-0.2">
                      {proj.config.genre?.slice(0, 4) || "通用"}
                    </span>
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {proj.createdAt ? new Date(proj.createdAt).toISOString().slice(0, 10) : "刚刚"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            <Layers className="h-5 w-5" />
          </div>
          <div className="space-y-1 max-w-md">
            <p className="text-xs font-bold text-slate-800">暂无已归档小说</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              在下方输入您的初始灵感并点击「启动工业化流水线」，流水线将全自动推演世界观细纲、逐章撰写正文与视频分镜，全部完成后将自动生成电影海报并入库书架。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
