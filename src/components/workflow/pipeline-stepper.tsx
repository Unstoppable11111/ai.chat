"use client";

import React from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  BookOpen,
  FileText,
  Clapperboard,
  Scissors,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";

export type StepStatus = "idle" | "running" | "completed" | "error";

export interface StepItem {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  detail?: string;
}

interface PipelineStepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  onRetry?: () => void;
  isRunning: boolean;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  step_1_bible: BookOpen,
  step_2_chapters: FileText,
  step_3_video_prompts: Clapperboard,
  step_4_polish: Scissors,
  step_5_pitch: FileSpreadsheet,
};

export function PipelineStepper({
  steps,
  currentStepIndex,
  onRetry,
  isRunning,
}: PipelineStepperProps) {
  return (
    <div className="rounded-3xl border border-slate-900/10 bg-white/80 p-5 shadow-xs ">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-900">工业化流水线节点</h2>
            <p className="text-[11px] text-muted-foreground">五大标准生产环节自动化接力</p>
          </div>
        </div>
        {steps.some((s) => s.status === "error") && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>重试</span>
          </button>
        )}
      </div>

      <div className="relative mt-4 space-y-4">
        {/* 连接竖线 */}
        <div className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-slate-100 -z-0" />

        {steps.map((step, idx) => {
          const Icon = STEP_ICONS[step.id] || Circle;
          const isCurrent = idx === currentStepIndex && step.status === "running";

          return (
            <div
              key={step.id}
              className={`relative z-10 flex items-start gap-3 group transition-transform ${
                isCurrent ? "scale-[1.01]" : ""
              }`}
            >
              {/* 状态图标胶囊 */}
              <div className="shrink-0 pt-0.5">
                {step.status === "completed" ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xs">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : step.status === "running" ? (
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-cyan-400 opacity-30"></span>
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : step.status === "error" ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-xs">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-400">
                    <Icon className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* 步骤文本 */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-xs font-bold transition-colors ${
                      step.status === "running"
                        ? "text-cyan-700 font-extrabold"
                        : step.status === "completed"
                        ? "text-slate-900"
                        : step.status === "error"
                        ? "text-rose-600"
                        : "text-slate-500"
                    }`}
                  >
                    {step.name}
                  </p>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      step.status === "completed"
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : step.status === "running"
                        ? "bg-cyan-50 text-cyan-700 animate-pulse font-semibold"
                        : step.status === "error"
                        ? "bg-rose-50 text-rose-700 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {step.status === "completed"
                      ? "DONE"
                      : step.status === "running"
                      ? "RUNNING"
                      : step.status === "error"
                      ? "FAIL"
                      : "WAIT"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {step.description}
                </p>

                {/* 运行中的实时详细进度反馈 */}
                {step.detail && step.status === "running" && (
                  <div className="mt-1.5 rounded-xl border border-cyan-500/20 bg-cyan-50/60 px-2.5 py-1 text-[11px] text-cyan-800 animate-in fade-in duration-200">
                    <p className="truncate font-mono">{step.detail}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
