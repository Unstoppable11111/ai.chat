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
    title: currentlyBuilding[0] || "一套适用于个人项目展示页的轻亮视觉语言系统",
    date: "2026.08",
    category: "DESIGN & FRONTEND",
    status: "IN PROGRESS",
    progress: 82,
    phase: "PHASE 03 / SYSTEM POLISH",
    notes: "基于浅色珍珠底色、克制发光与极简网格排版，建立一套统一自洽的个人技术视觉语言体系。",
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
    progress: 48,
    phase: "PHASE 02 / HUD CONSOLE",
    notes: "集成实时系统状态、AI 助手调用、动态命令面板与个人进度追踪的微工作台控制台。",
  },
  {
    id: "04",
    title: currentlyBuilding[3] || "面向日志、项目和学习资料的可复用 MDX 内容系统",
    date: "2026.06",
    category: "CONTENT ENGINE",
    status: "SYSTEMIZING",
    progress: 92,
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
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-brand-cyan/[0.025] blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-brand-violet/[0.025] blur-[120px] rounded-full" />
      </div>

      <div className="container-shell max-w-7xl mx-auto relative z-10">
        
        {/* 顶部标头与实时状态雷达 */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-14 md:mb-20">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-brand-cyan animate-ping" />
              <p className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-brand-cyan">
                LIVE STATUS // DEV WORKBENCH
              </p>
            </div>
            <h2 className="text-[11px] md:text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
              CURRENTLY BUILDING
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-muted-foreground border border-slate-900/10 rounded-full px-3.5 py-1.5 bg-white/60 backdrop-blur-xs">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <Activity className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
              <span>ACTIVE TASK: {activeTask.id} / 04</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>AUTO-CYCLE: {isPaused ? "PAUSED" : "ACTIVE"}</span>
          </div>
        </div>

        {/* 主视窗：超大编号 + 当前激活任务详情 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start" ref={containerRef}>
          
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
                  className="text-[26vw] md:text-[15vw] font-light tracking-tighter text-foreground will-change-transform leading-[0.8] bg-gradient-to-b from-foreground via-foreground to-foreground/35 bg-clip-text text-transparent"
                >
                  {activeTask.id}
                </motion.div>
              </AnimatePresence>
              
              {/* 编号下标微标签 */}
              <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full border border-brand-cyan/60" />
                <span>{activeTask.phase}</span>
              </div>
            </div>
          </div>

          {/* 右侧核心任务看板 */}
          <div className="md:col-span-7 lg:col-span-8 pt-2 md:pt-6">
            <div className="max-w-2xl">
              
              {/* 任务状态元信息徽章 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`meta-${activeTask.id}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="flex flex-wrap items-center gap-3 sm:gap-5 text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6"
                >
                  <span className="font-mono">{activeTask.date}</span>
                  <span className="text-slate-300">/</span>
                  <span className="font-medium text-foreground/80">{activeTask.category}</span>
                  <span className="text-slate-300">/</span>
                  
                  {/* 实时雷达呼吸徽章 */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-mono tracking-wider font-semibold">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-cyan" />
                    </span>
                    {activeTask.status}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* 动态主标题 */}
              <div className="min-h-[120px] md:min-h-[140px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`content-${activeTask.id}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h3 className="text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.15] mb-5">
                      {activeTask.title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">
                      {activeTask.notes}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 科技感精度进度仪 */}
              <div className="border-t border-slate-900/10 pt-6">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-muted-foreground uppercase tracking-widest text-[10px]">EXECUTION PROGRESS</span>
                  <span className="text-brand-cyan font-bold tracking-wider">{activeTask.progress}%</span>
                </div>

                {/* 进度条轨道 + 流光扫掠效果 */}
                <div className="relative w-full h-1.5 bg-slate-900/8 rounded-full overflow-hidden mb-2">
                  <motion.div 
                    className="relative h-full bg-gradient-to-r from-brand-cyan via-brand-cyan to-brand-violet rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${activeTask.progress}%` }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* 流光扫掠光束 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
                  </motion.div>
                </div>

                {/* 刻度线标定点 */}
                <div className="flex justify-between text-[9px] font-mono text-slate-400 select-none">
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
        <div className="mt-16 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-900/10 pt-8">
          {buildingTasks.map((task, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "group relative flex flex-col justify-between text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden",
                  isActive
                    ? "bg-white border-brand-cyan/40 shadow-sm shadow-brand-cyan/5 ring-1 ring-brand-cyan/20"
                    : "bg-white/40 border-slate-900/8 hover:bg-white hover:border-slate-900/15 hover:shadow-xs"
                )}
                aria-selected={isActive}
                role="tab"
              >
                {/* 激活状态指示顶条 */}
                {isActive && (
                  <motion.div 
                    layoutId="activeTaskIndicator"
                    className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-brand-cyan to-brand-violet"
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  />
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={cn(
                      "font-mono text-xs font-bold transition-colors",
                      isActive ? "text-brand-cyan" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {task.id}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      {task.progress}%
                    </span>
                  </div>

                  <p className={cn(
                    "text-xs md:text-sm leading-relaxed line-clamp-2 transition-colors",
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {task.title}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-2 border-t border-slate-900/5">
                  <span className="truncate max-w-[120px]">{task.category}</span>
                  <ArrowRight className={cn(
                    "h-3 w-3 transition-transform duration-300",
                    isActive ? "translate-x-1 text-brand-cyan" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
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
