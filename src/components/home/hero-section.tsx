"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Compass,
  Cpu,
  Database,
  Film,
  FlaskConical,
  Hand,
  Layers,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/ui/magnetic-button";

const LIVE_MODULES = [
  {
    id: "MOD_01",
    code: "QUANT_ARENA",
    title: "A股量化实盘推演中心",
    metric: "3 ENGINES // T+1 LIVE",
    status: "STREAMING",
    statusColor: "text-emerald-400 border-emerald-500/40 bg-emerald-950/50",
    summary: "多源交叉行情校验、5分钟微观推演与三大基准策略净值矩阵实时追踪。",
    href: "/market",
    cta: "进入量化竞技场",
    icon: TrendingUp,
    accent: "text-emerald-400",
    specs: [
      { k: "STRATEGIES", v: "激进 / 均衡 / 防御" },
      { k: "RISK CONTROL", v: "动态回撤保护" },
    ],
  },
  {
    id: "MOD_02",
    code: "RAG_KNOWLEDGE",
    title: "混合向量检索与白皮书库",
    metric: "65+ TECH WHITEPAPERS",
    status: "INDEXED",
    statusColor: "text-cyan-300 border-cyan-500/40 bg-cyan-950/50",
    summary: "Parent-Child 语义切分 + BM25/Dense RRF 倒数排名融合，全站文章精确溯源。",
    href: "/build-log",
    cta: "查阅技术白皮书",
    icon: Database,
    accent: "text-cyan-400",
    specs: [
      { k: "RETRIEVAL", v: "BM25 + Vector RRF" },
      { k: "CITATION", v: "Slug / Section 溯源" },
    ],
  },
  {
    id: "MOD_03",
    code: "AI_WORKFLOW",
    title: "工业级小说与分镜生产线",
    metric: "5-STAGE PIPELINE",
    status: "READY",
    statusColor: "text-purple-300 border-purple-500/40 bg-purple-950/50",
    summary: "从故事圣经、连续正文去 AI 味精修、电影级立绘封面到可灵/Runway 视频分镜 Prompt。",
    href: "/workflow",
    cta: "启动创作流水线",
    icon: Film,
    accent: "text-purple-400",
    specs: [
      { k: "CONTINUITY", v: "Rolling Summary 级联" },
      { k: "ASSETS", v: "FLUX 双通道渲染" },
    ],
  },
  {
    id: "MOD_04",
    code: "SPATIAL_LABS",
    title: "WebGL 与前沿交互实验室",
    metric: "09 PLAYABLE SANDBOXES",
    status: "ONLINE",
    statusColor: "text-amber-300 border-amber-500/40 bg-amber-950/50",
    summary: "包含天纪紫微斗数、Cesium 3D 上帝之眼、Navier-Stokes 霓虹流体、AI 小镇与手势粒子。",
    href: "/experiments",
    cta: "打开极客工坊",
    icon: FlaskConical,
    accent: "text-amber-400",
    specs: [
      { k: "GRAPHICS", v: "Three.js / Cesium / GLSL" },
      { k: "ASTRO", v: "iztro + 真太阳时排盘" },
    ],
  },
];

const QUICK_SYSTEMS = [
  { label: "AI 贾维斯", sub: "RAG Memory Chat", href: "/chat", icon: Bot, tone: "text-cyan-400" },
  { label: "量化投研", sub: "A-Share Arena", href: "/market", icon: TrendingUp, tone: "text-emerald-400" },
  { label: "创作工作流", sub: "Novel & Storyboard", href: "/workflow", icon: Layers, tone: "text-purple-400" },
  { label: "天纪紫微", sub: "Ziwei Astro Studio", href: "/experiments/ziwei", icon: Compass, tone: "text-amber-400" },
  { label: "3D 手势空间", sub: "Vision Particles", href: "/gesture", icon: Hand, tone: "text-sky-400" },
  { label: "精选项目", sub: "Architecture", href: "/projects", icon: Terminal, tone: "text-slate-200" },
];

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeItem = LIVE_MODULES[selectedIdx];
  const ActiveIcon = activeItem.icon;

  return (
    <section className="relative w-full overflow-hidden border-b border-white/[0.08] bg-[#04060b] pt-6 pb-14 sm:pt-10 sm:pb-20">
      {/* Exposed Blueprint Subgrid Backdrop */}
      <div
        aria-hidden="true"
        className="blueprint-subgrid pointer-events-none absolute inset-0 opacity-65"
        style={{
          maskImage: "radial-gradient(ellipse at 50% 35%, black 30%, transparent 82%)",
        }}
      />

      <div className="container-shell relative z-10">
        {/* Top Architectural Coordinate Rail */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded border border-emerald-500/35 bg-emerald-950/40 px-2.5 py-1 text-emerald-300 font-semibold">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span>STUDIO OS v3.0 // ACTIVE</span>
            </span>
            <span className="hidden sm:inline text-slate-500">NODE: SHENZHEN // 22.54°N 114.05°E</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>ARCHITECTURE · RAG · QUANT · WEBGL</span>
            <span className="hidden md:inline text-cyan-400">[ 2026 RELEASE ]</span>
          </div>
        </div>

        {/* Main 12-Column Asymmetric Command Center */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left 7 Columns: Editorial Display & Core Command Actions */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-white/10 bg-[#070b16]/90 p-6 sm:p-8 lg:p-10 relative overflow-hidden"
          >
            {/* Subtle corner crosshair markers */}
            <span className="pointer-events-none absolute top-2.5 left-3 font-mono text-[10px] text-white/20">+</span>
            <span className="pointer-events-none absolute top-2.5 right-3 font-mono text-[10px] text-white/20">+</span>

            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded border border-cyan-500/30 bg-cyan-950/35 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                <span>FULL-STACK AI ENGINEERING STUDIO</span>
              </div>

              <h1 className="font-bold tracking-tighter text-white uppercase leading-[0.94] text-[12vw] sm:text-6xl xl:text-7xl">
                CHEN TECH
                <span className="block text-gradient-cyan mt-1">STUDIO OS</span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-300">
                以<span className="text-white font-semibold">高精度 RAG 知识库引擎</span>为中枢，融合
                <span className="text-emerald-300 font-medium"> A股实盘量化竞技场</span>、
                <span className="text-purple-300 font-medium"> 工业级 AI 小说与分镜流水线</span>及
                <span className="text-cyan-300 font-medium"> 9 款前沿交互实验</span>，打造可运行、可溯源的个人数字工程基地。
              </p>

              {/* Primary CTA Command Matrix */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <MagneticButton strength={0.2}>
                  <Link
                    href="/chat"
                    className="shimmer-beam inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(0,240,255,0.28)] hover:bg-cyan-300 transition-all"
                  >
                    <Bot className="h-4 w-4" />
                    <span>唤醒 JARVIS 助手</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </MagneticButton>

                <Link
                  href="/workflow"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-xs sm:text-sm font-semibold text-white hover:border-purple-400/50 hover:bg-purple-500/10 transition-all"
                >
                  <Film className="h-4 w-4 text-purple-400" />
                  <span>创作工作流</span>
                </Link>

                <Link
                  href="/experiments"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-xs sm:text-sm font-semibold text-slate-200 hover:border-cyan-400/50 hover:text-cyan-300 transition-all"
                >
                  <FlaskConical className="h-4 w-4 text-cyan-400" />
                  <span>极客实验室 (09)</span>
                </Link>
              </div>
            </div>

            {/* Bottom Exposed Quick-Access Strip */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <span>DIRECT SYSTEM ACCESS // 快速通道</span>
                <span>06 ENDPOINTS</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_SYSTEMS.map((sys) => {
                  const Icon = sys.icon;
                  return (
                    <Link
                      key={sys.href}
                      href={sys.href}
                      className="group flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#04060b]/70 px-3 py-2.5 hover:border-cyan-400/40 hover:bg-white/[0.04] transition-all"
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", sys.tone)} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate">
                          {sys.label}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 truncate">{sys.sub}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Right 5 Columns: Interactive Studio OS Live Telemetry Deck */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 arch-frame rounded-xl flex flex-col overflow-hidden"
          >
            <div className="hud-header">
              <span className="text-cyan-400">TELEMETRY // LIVE MATRIX</span>
              <span>{activeItem.id}</span>
            </div>

            {/* 4-Cell Module Selector Grid */}
            <div className="grid grid-cols-2 border-b border-white/[0.08] bg-[#04060b]/50">
              {LIVE_MODULES.map((entry, idx) => {
                const EntryIcon = entry.icon;
                const isSelected = idx === selectedIdx;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={cn(
                      "flex flex-col items-start gap-1.5 p-3.5 text-left border-b border-r border-white/[0.07] transition-all cursor-pointer",
                      isSelected
                        ? "bg-cyan-500/12 border-b-cyan-400/50"
                        : "hover:bg-white/[0.03]"
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500">{entry.id}</span>
                      <EntryIcon className={cn("h-3.5 w-3.5", entry.accent)} />
                    </div>
                    <p
                      className={cn(
                        "font-mono text-[11px] font-bold tracking-wider truncate w-full",
                        isSelected ? "text-white" : "text-slate-300"
                      )}
                    >
                      {entry.code}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Module Detail Viewport */}
            <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                      activeItem.statusColor
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    <span>{activeItem.status}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{activeItem.metric}</span>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04]">
                    <ActiveIcon className={cn("h-5 w-5", activeItem.accent)} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white leading-tight">
                      {activeItem.title}
                    </h2>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      ENDPOINT: {activeItem.href}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-slate-300 mt-3">
                  {activeItem.summary}
                </p>

                {/* Exposed Technical Specs Table */}
                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                  {activeItem.specs.map((spec) => (
                    <div
                      key={spec.k}
                      className="rounded-lg border border-white/[0.08] bg-[#04060b]/70 p-2.5"
                    >
                      <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                        {spec.k}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-white truncate">{spec.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="font-mono text-[10px] text-slate-500">
                  SYS_INDEX: 0{selectedIdx + 1} / 04
                </div>
                <Link
                  href={activeItem.href}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-950/50 px-3.5 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 transition-all"
                >
                  <span>{activeItem.cta}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
