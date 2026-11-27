"use client";

import React from "react";
import { motion } from "motion/react";
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
    <div className="rounded-3xl border border-[#E4E4E8] bg-[#FFFFFF]/95 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E8]">
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#33DD18] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#184120]"></span>
            </span>
          )}
          <div>
            <h2 className="text-sm font-bold text-[#042328]">工业化流水线节点</h2>
            <p className="text-[11px] text-[#5C6873]">五大标准生产环节自动化接力</p>
          </div>
        </div>
        {steps.some((s) => s.status === "error") && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 rounded-xl bg-[#D71018]/[0.07] px-2.5 py-1 text-xs font-medium text-[#D71018] hover:bg-[#D71018]/12 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>重试</span>
          </button>
        )}
      </div>

      <div className="relative mt-4 space-y-4">
        {/* 连接竖线与动态进度填充 */}
        <div className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-[#E4E4E8] -z-0 overflow-hidden rounded-full">
          <motion.div
            className="w-full bg-gradient-to-b from-[#042328] via-[#184120] to-[#33DD18] origin-top"
            initial={{ height: "0%" }}
            animate={{
              height: `${Math.min(
                100,
                Math.round(
                  (steps.filter((s) => s.status === "completed").length / Math.max(1, steps.length - 1)) * 100
                )
              )}%`,
            }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

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
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#184120] text-[#FFFFF2] shadow-xs">
                    <CheckCircle2 className="h-5 w-5 text-[#33DD18]" />
                  </div>
                ) : step.status === "running" ? (
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#042328] to-[#263844] text-[#E1F209] shadow-md">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-[#33DD18] opacity-25"></span>
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : step.status === "error" ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#D71018] text-[#FFFFFF] shadow-xs">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#E4E4E8] bg-[#F8F8F4] text-[#5C6873]">
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
                        ? "text-[#042328] font-extrabold"
                        : step.status === "completed"
                        ? "text-[#184120]"
                        : step.status === "error"
                        ? "text-[#D71018]"
                        : "text-[#5C6873]"
                    }`}
                  >
                    {step.name}
                  </p>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      step.status === "completed"
                        ? "bg-[#E0E7D9]/75 text-[#184120] font-semibold"
                        : step.status === "running"
                        ? "bg-[#F2F7F9] text-[#263844] border border-[#263844]/20 animate-pulse font-semibold"
                        : step.status === "error"
                        ? "bg-[#D71018]/[0.07] text-[#D71018] font-semibold"
                        : "text-[#5C6873]"
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
                <p className="text-[11px] text-[#5C6873] mt-0.5 line-clamp-1">
                  {step.description}
                </p>

                {/* 运行中的实时详细进度反馈 */}
                {step.detail && step.status === "running" && (
                  <div className="mt-1.5 rounded-xl border border-[#263844]/20 bg-[#F2F7F9] px-2.5 py-1 text-[11px] text-[#263844] animate-in fade-in duration-200">
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
