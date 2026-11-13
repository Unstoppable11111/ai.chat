"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Activity, ArrowRight, Pause, Play } from "lucide-react";
import { currentlyBuilding } from "@/data/site";
import { cn } from "@/lib/utils";

interface BuildingTask {
  id: string;
  title: string;
  date: string;
  category: string;
  status: string;
  progress: number;
  phase: string;
  notes: string;
}

const buildingTasks: BuildingTask[] = [
  {
    id: "01",
    title: currentlyBuilding[0] || "一套适用于个人项目展示页的星际深空曜石科技体系",
    date: "2026.11",
    category: "DESIGN & ARCHITECTURE",
    status: "IN PROGRESS",
    progress: 92,
    phase: "PHASE 03 // ARCHITECTURAL OS",
    notes: "采用 Swiss Modernism 2.0 精密网格、Bento Telemetry 视窗与深空黑曜石高对比材质，重构全站视觉秩序。",
  },
  {
    id: "02",
    title: currentlyBuilding[1] || "从设计草图到页面镜头的视觉与代码实验流程",
    date: "2026.10",
    category: "CREATIVE CODING",
    status: "ITERATING",
    progress: 74,
    phase: "PHASE 02 // SHADER LAB",
    notes: "打通概念构思、WebGL / Three.js 着色器试验到 Next.js 生产级渲染的端到端图形学创作流程。",
  },
  {
    id: "03",
    title: currentlyBuilding[2] || "用于追踪内容、产品和实验进展的个人工作台",
    date: "2026.09",
    category: "SYSTEM WORKBENCH",
    status: "BUILDING",
    progress: 68,
    phase: "PHASE 02 // HUD CONSOLE",
    notes: "集成实时量化推演、AI 助手调用、动态命令面板与云端多小说创作书架的高效工作台。",
  },
  {
    id: "04",
    title: currentlyBuilding[3] || "面向日志、项目和学习资料的可复用 MDX 内容系统",
    date: "2026.08",
    category: "RAG CONTENT ENGINE",
    status: "OPERATIONAL",
    progress: 96,
    phase: "PHASE 04 // VECTOR SYNC",
    notes: "支持代码块高亮、Parent-Child 语义分块、双栏目录与精确到章节级溯源的知识沉淀底座。",
  },
];

export function CurrentlyBuilding() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  const activeTask = buildingTasks[activeIndex];
  const filledSegments = Math.round((activeTask.progress / 100) * 20);

  useEffect(() => {
    if (reduceMotion || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % buildingTasks.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isPaused, reduceMotion]);

  return (
    <section
      className="studio-section bg-[#04060b]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container-shell">
        {/* Exposed Architectural Section Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="tech-tag mb-2.5">
              <Activity className="h-3 w-3 text-cyan-400" />
              <span>SEC_01 // SPRINT BLUEPRINT MATRIX</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              当前演进蓝图 · Engineering Roadmap
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="h-3 w-3 text-cyan-400" /> : <Pause className="h-3 w-3 text-emerald-400" />}
            <span>{isPaused ? "CYCLE: PAUSED" : "CYCLE: AUTO"}</span>
          </button>
        </div>

        {/* Exposed Hairline Split Blueprint */}
        <div className="arch-frame rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left 5 Columns: Vertical Blueprint Selector Rail */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-white/[0.08] divide-y divide-white/[0.07] bg-[#060913]/80">
            {buildingTasks.map((task, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "group w-full text-left p-5 transition-all cursor-pointer flex items-start gap-4 relative",
                    isActive ? "bg-cyan-500/[0.09]" : "hover:bg-white/[0.03]"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_12px_#00f0ff]" />
                  )}
                  <span
                    className={cn(
                      "font-mono text-2xl font-bold leading-none tabular-nums",
                      isActive ? "text-cyan-400" : "text-slate-600 group-hover:text-slate-400"
                    )}
                  >
                    {task.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1.5 font-mono text-[10px]">
                      <span className="text-slate-400 uppercase tracking-wider">{task.category}</span>
                      <span className={isActive ? "text-cyan-300 font-bold" : "text-slate-500"}>
                        {task.progress}%
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm font-semibold leading-snug line-clamp-2",
                        isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                      )}
                    >
                      {task.title}
                    </p>
                  </div>
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 shrink-0 mt-1 transition-transform",
                      isActive
                        ? "text-cyan-400 translate-x-0.5"
                        : "text-slate-600 opacity-0 group-hover:opacity-100"
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Right 7 Columns: Active Technical Spec Sheet */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-[#080d1a]/60">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTask.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 font-mono text-[11px]">
                  <span className="text-cyan-300 font-semibold">{activeTask.phase}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{activeTask.date}</span>
                    <span className="rounded border border-cyan-500/40 bg-cyan-950/50 px-2 py-0.5 text-[10px] text-cyan-300">
                      {activeTask.status}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
                    SPECIFICATION // TASK_{activeTask.id}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                    {activeTask.title}
                  </h3>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
                    {activeTask.notes}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Segmented LED Telemetry Bar */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between font-mono text-xs mb-3">
                <span className="text-slate-400 uppercase tracking-wider">COMPLETION TELEMETRY</span>
                <span className="text-cyan-400 font-bold tabular-nums">{activeTask.progress}.0%</span>
              </div>
              <div className="grid grid-cols-20 gap-1">
                {Array.from({ length: 20 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-2.5 rounded-[2px] transition-all duration-300",
                      idx < filledSegments
                        ? "bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.45)]"
                        : "bg-white/[0.07]"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
