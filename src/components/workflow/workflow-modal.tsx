"use client";

import React from "react";
import {
  AlertTriangle,
  Sparkles,
  BookOpen,
  Layers,
  X,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import type { WorkflowProject } from "@/types/workflow";

export type ModalState =
  | { type: "idle" }
  | {
      type: "confirm_delete";
      project: WorkflowProject;
    }
  | {
      type: "busy_block";
      message: string;
    }
  | {
      type: "book_published";
      project: WorkflowProject;
    }
  | {
      type: "queue_busy";
      message?: string;
    };

interface WorkflowModalProps {
  state: ModalState;
  onClose: () => void;
  onConfirmDelete?: (projectId: string) => void;
  onViewBook?: (projectId: string) => void;
  onGoAssets?: () => void;
}

export function WorkflowModal({
  state,
  onClose,
  onConfirmDelete,
  onViewBook,
  onGoAssets,
}: WorkflowModalProps) {
  if (state.type === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 1. 删除确认弹窗 */}
        {state.type === "confirm_delete" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">确认删除该小说？</h3>
                <p className="text-xs text-muted-foreground">该操作将永久从云端移除</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-600 leading-relaxed space-y-1.5">
              <p className="font-semibold text-slate-800">
                《{state.project.title}》
              </p>
              <p className="text-rose-600/90 text-[11px]">
                删除后，该书绑定的世界观细纲 Bible、全部 {state.project.chapters.length} 章节正文、分镜提示词及已生成的视觉资产将被彻底清理，不可撤销。
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirmDelete?.(state.project.id);
                  onClose();
                }}
                className="flex-1 rounded-2xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                确认彻底删除
              </button>
            </div>
          </div>
        )}

        {/* 2. 任务运行中拦截弹窗 */}
        {state.type === "busy_block" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">工业流水线运行中</h3>
                <p className="text-xs text-muted-foreground">当前操作已安全锁定</p>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
              {state.message}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
              >
                我知道了，继续等待
              </button>
            </div>
          </div>
        )}

        {/* 3. 排队繁忙 / 请求频繁 / 冷却保护弹窗 */}
        {state.type === "queue_busy" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {state.message?.includes("冷却") ? "生图通道冷却保护生效中" : "生图请求过于频繁"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {state.message?.includes("冷却")
                    ? "检测到超时或并发上限，暂停生图保护上游"
                    : "算力队列繁忙，已自动为您停止等待"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-200/60 text-xs text-amber-900 leading-relaxed space-y-1.5">
              <p className="font-semibold text-slate-800">
                {state.message || "当前绘图请求过多或上游算力节点正在排队。"}
              </p>
              <p className="text-slate-600 text-[11px]">
                {state.message?.includes("冷却")
                  ? "为防止接口频繁超频导致上游账号被限制，系统执行阶梯退避策略（首次暂停5分钟，若仍超频延长至30分钟）。冷却倒计时结束后将自动恢复。"
                  : "为防止页面长时间挂起卡死，系统已立即中断排队。您可以稍后再试，或在左上角【工作流参数与引擎配置】中填入自己的 API Key 享受独占高速出图。"}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
              >
                我知道了，等待冷却结束
              </button>
            </div>
          </div>
        )}

        {/* 4. 全案精美成册入库庆祝弹窗 */}
        {state.type === "book_published" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
              <Sparkles className="h-4 w-4" />
              <span>工业化全案成册 · 已成功归档入库</span>
            </div>

            {/* 封面与核心元数据 */}
            <div className="flex gap-4 items-start pt-1">
              <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-900 shadow-md border border-slate-200/80">
                {state.project.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.project.cover_url}
                    alt={state.project.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-cyan-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  《{state.project.title}》
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                    {state.project.config?.genre || "都市异能"}
                  </span>
                  <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                    {state.project.chapters.length} 章完整
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {state.project.bible?.logline || "高概念商业故事全案已就绪。"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>已自动绑定并持久化到您的个人账户</span>
                </div>
              </div>
            </div>

            {/* 快速动作入口 */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onViewBook?.(state.project.id);
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 py-2.5 text-xs font-bold text-white hover:opacity-95 shadow-sm transition-opacity cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>立即阅读正文</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onGoAssets?.();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-purple-600" />
                <span>生成人物立绘</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
