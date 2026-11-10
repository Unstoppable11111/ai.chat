"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Activity, ArrowRight } from "lucide-react";
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
    date: "2026.08",
    category: "DESIGN & FRONTEND",
    status: "IN PROGRESS",
    progress: 88,
    phase: "PHASE 03 / SYSTEM POLISH",
    notes: "基于深空黑曜石底色、晶体流光玻璃与赛博全息微交互，建立一套世界顶尖水准的科技视觉语言体系。",
  },
  {
    id: "02",
    title: currentlyBuilding[1] || "从设计草图到页面镜头的视觉与代码实验流程",
    date: "2026.08",
    category: "CREATIVE CODING",
    status: "ITERATING",
    progress: 65,
    phase: "PHASE 02 / SHADER LAB",
    notes: "打通 Figma 构思、WebGL / Three.js 着色器试验到 Next.js 生产级渲染的端到端创作流程。",
  },
  {
    id: "03",
    title: currentlyBuilding[2] || "用于追踪内容、产品和实验进展的个人工作台",
    date: "2026.07",
    category: "SYSTEM ARCHITECTURE",
    status: "BUILDING",
    progress: 52,
    phase: "PHASE 02 / HUD CONSOLE",
    notes: "集成实时系统状态、AI 助手调用、动态命令面板与个人进度追踪的微工作台控制台。",
  },
  {
    id: "04",
    title: currentlyBuilding[3] || "面向日志、项目和学习资料的可复用 MDX 内容系统",
    date: "2026.06",
    category: "CONTENT ENGINE",
    status: "SYSTEMIZING",
    progress: 95,
    phase: "PHASE 04 / COMPONENT SYNC",
    notes: "支持代码块高亮、提示词复制、双栏排版与动态目录的模块化知识沉淀与文档引擎。",
  },
];

export function CurrentlyBuilding() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const activeTask = buildingTasks[activeIndex];

  // 自动巡航轮播（用户鼠标移入时暂停）
  useEffect(() => {
    if (reduceMotion || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % buildingTasks.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [isPaused, reduceMotion]);

  return (
    <section 
      className="studio-section relative w-full bg-background overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 背景微发光装饰与网格底纹 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-[radial-gradient(closest-side,rgba(0,240,255,0.06),transparent)]" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-[radial-gradient(closest-side,rgba(168,85,247,0.06),transparent)]" />
      </div>

      <div className="container-shell max-w-7xl mx-auto relative z-10">
        
        {/* 顶部标头与实时状态雷达 */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10 sm:mb-14 md:mb-20">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <p className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-cyan-400 font-semibold">
                LIVE STATUS // DEV WORKBENCH
              </p>
            </div>
            <h2 className="text-[11px] md:text-xs font-medium tracking-[0.3em] uppercase text-slate-400">
              CURRENTLY BUILDING
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-slate-300 border border-white/10 rounded-full px-3.5 py-1.5 bg-[#0d162b]/80 backdrop-blur-md shadow-sm">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>ACTIVE TASK: {activeTask.id} / 04</span>
            </span>
            <span className="text-white/20">|</span>
            <span>AUTO-CYCLE: {isPaused ? "PAUSED" : "ACTIVE"}</span>
          </div>
        </div>

        {/* 主视窗：超大编号 + 当前激活任务详情 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-16 items-start" ref={containerRef}>
          
          {/* 左侧超大编号（带数字切牌动画） */}
          <div className="md:col-span-5 lg:col-span-4 flex items-start select-none">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTask.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -24, filter: "blur(6px)" }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[20vw] sm:text-[18vw] md:text-[15vw] font-light tracking-tighter will-change-transform leading-[0.85] bg-gradient-to-b from-white via-cyan-100 to-slate-700 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(0,240,255,0.2)]"
                >
                  {activeTask.id}
                </motion.div>
              </AnimatePresence>
              
              {/* 编号下标微标签 */}
              <div className="mt-2 flex items-center gap-2 font-mono text-[10px] sm:text-[11px] text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full border border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                <span>{activeTask.phase}</span>
              </div>
            </div>
          </div>

          {/* 右侧核心任务看板 */}
          <div className="md:col-span-7 lg:col-span-8 pt-0 md:pt-4">
            <div className="max-w-2xl">
              
              {/* 任务状态元信息徽章 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`meta-${activeTask.id}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="flex flex-wrap items-center gap-2.5 sm:gap-5 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-400 mb-4 sm:mb-6"
                >
                  <span className="font-mono">{activeTask.date}</span>
                  <span className="text-white/20">/</span>
                  <span className="font-medium text-slate-200">{activeTask.category}</span>
                  <span className="text-white/20">/</span>
                  
                  {/* 实时雷达呼吸徽章 */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono tracking-wider font-semibold shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                    </span>
                    {activeTask.status}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* 动态主标题 */}
              <div className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`content-${activeTask.id}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h3 className="text-xl sm:text-3xl md:text-5xl font-medium tracking-tight text-white leading-[1.2] mb-3 sm:mb-5">
                      {activeTask.title}
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed mb-6 sm:mb-8">
                      {activeTask.notes}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 科技感精度进度仪 */}
              <div className="border-t border-white/10 pt-4 sm:pt-6">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400 uppercase tracking-widest text-[10px]">EXECUTION PROGRESS</span>
                  <span className="text-cyan-400 font-bold tracking-wider">{activeTask.progress}%</span>
                </div>

                {/* 进度条轨道 + 流光扫掠效果 */}
                <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                  <motion.div 
                    className="relative h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 rounded-full shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${activeTask.progress}%` }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* 流光扫掠光束 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse" />
                  </motion.div>
                </div>

                {/* 刻度线标定点 */}
                <div className="flex justify-between text-[9px] font-mono text-slate-500 select-none">
                  <span>00%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 底部 01-04 互动控制台卡片列表 */}
        <div className="mt-12 sm:mt-16 grid gap-2.5 sm:gap-4 grid-cols-2 lg:grid-cols-4 border-t border-white/10 pt-6 sm:pt-8">
          {buildingTasks.map((task, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "group relative flex flex-col justify-between text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md",
                  isActive
                    ? "bg-[#0f172a] border-cyan-400/60 shadow-[0_0_24px_rgba(0,240,255,0.22)] ring-1 ring-cyan-400/30"
                    : "bg-[#0b1120]/70 border-white/10 hover:bg-[#0f172a]/90 hover:border-white/20"
                )}
                aria-selected={isActive}
                role="tab"
              >
                {/* 激活状态指示顶条 */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTaskIndicator"
                    className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 shadow-[0_0_8px_#22d3ee]"
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  />
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <span className={cn(
                      "font-mono text-xs font-bold transition-colors",
                      isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-white"
                    )}>
                      {task.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {task.progress}%
                    </span>
                  </div>

                  <p className={cn(
                    "text-[11px] sm:text-xs md:text-sm leading-snug sm:leading-relaxed line-clamp-2 transition-colors",
                    isActive ? "font-semibold text-white" : "text-slate-300 group-hover:text-white"
                  )}>
                    {task.title}
                  </p>
                </div>

                <div className="mt-3 sm:mt-4 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-slate-400 pt-1.5 sm:pt-2 border-t border-white/10">
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{task.category}</span>
                  <ArrowRight className={cn(
                    "h-3 w-3 transition-transform duration-300",
                    isActive ? "translate-x-1 text-cyan-400" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                  )} />
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
