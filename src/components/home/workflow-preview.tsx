"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Film,
  Layers,
  Wand2,
  FileSpreadsheet,
  Play,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { Reveal } from "@/components/shared/reveal";

const emptySubscribe = () => () => {};

const PIPELINE_STEPS = [
  {
    step: "01",
    name: "设定集与人物卡",
    en: "STORY_BIBLE",
    desc: "全景世界观、三幕式伏笔链与高辨识度人物小传",
    icon: BookOpen,
    accent: "text-purple-400",
    sampleOutput: `{
  "title": "微观时间倒流三秒",
  "worldview": "纳米义体医学与生物记忆回溯",
  "protagonist": "林渊 · 急诊外科主治医师",
  "hook": "每次回溯 3 秒，消耗不可逆神经突触寿命"
}`,
  },
  {
    step: "02",
    name: "长篇连续正文递推",
    en: "PROSE_ENGINE",
    desc: "15字短句白描、去 AI 机械味与剧情冲突递进",
    icon: Wand2,
    accent: "text-cyan-400",
    sampleOutput: `【第一章 暴雨急救室的倒流指针】
心电监护仪尖锐长鸣。血压跌破临界点。
林渊指尖纳米手术刀下压，止血钳滑脱的刹那——
“时间倒流，三秒。”
飞溅的血珠倒退回血管。门外防化服黑影收起第 VII 号原液。`,
  },
  {
    step: "03",
    name: "主角立绘与电影封面",
    en: "VISUAL_ASSETS",
    desc: "融合主人公与核心场景的商业级海报与立绘资产",
    icon: Layers,
    accent: "text-emerald-400",
    sampleOutput: `[FLUX.1-SCHNELL RENDER DISPATCH]
Prompt: "Cyberpunk trauma surgeon inside rain-lashed neon OR, nano scalpel, dramatic rim light, editorial book cover, 8k"
Status: Dual-channel load balanced (Cloudflare + Pollinations)`,
  },
  {
    step: "04",
    name: "专业影视分镜脚本",
    en: "STORYBOARD",
    desc: "景别运镜、灯光色彩与可灵 / Runway 高精度 Prompt",
    icon: Film,
    accent: "text-amber-400",
    sampleOutput: `SHOT_04 // MACRO DOLLY-OUT (24fps, 4K)
Audio: 心跳陡然静止，电流逆向嗡鸣
EN Prompt: "Extreme close-up of crimson blood droplets freezing mid-air and reversing back in slow motion, cold cyan surgical lighting"`,
  },
  {
    step: "05",
    name: "爆款提案与商业包装",
    en: "PITCH_STRATEGY",
    desc: "对标爆款、核心受众痛点与付费卡点结构分析",
    icon: FileSpreadsheet,
    accent: "text-rose-400",
    sampleOutput: `[COMMERCIAL PITCH METRICS]
Benchmarks: 《十日终焉》 × 《边缘行者》
Paywall Hook: 第 3 章手术室时间冻结反杀揭秘幕后财团
Target Audience: 强节奏悬疑科幻 / 短剧影视转化赛道`,
  },
];

export function WorkflowPreview() {
  const [activeStep, setActiveStep] = useState(0);
  const { user } = useAuth();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const currentStep = PIPELINE_STEPS[activeStep];

  return (
    <section className="studio-section bg-[#04060b]">
      <div className="container-shell">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 border-b border-white/10 pb-5">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="tech-tag border-purple-500/35 bg-purple-950/40 text-purple-300">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>SEC_03 // INDUSTRIAL CONTENT PIPELINE</span>
              </div>
              {mounted && user && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-emerald-500/35 bg-emerald-950/40 text-emerald-300 text-[10px] font-mono">
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  <span>WORKSPACE: {user.username}</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
              从一句话灵感，到商业爆款全套数字资产
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              5 阶段工业化内容流水线：内置去 AI 味精修、Rolling Summary 上下文级联、双通道立绘渲染与影视分镜输出。
            </p>
          </div>

          <Link
            href="/workflow"
            className="shimmer-beam inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/20 hover:opacity-95 transition-all shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{mounted && user ? "进入创作者工作台" : "体验创作流水线"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>

        {/* Horizontal 5-Node Schematic Rail */}
        <div className="arch-frame rounded-t-xl overflow-hidden grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
          {PIPELINE_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={cn(
                  "text-left p-4 transition-all cursor-pointer relative group",
                  isSelected ? "bg-purple-500/[0.12]" : "hover:bg-white/[0.03]"
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="workflow-node-bar"
                    className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400"
                    transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  />
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold text-slate-400">
                    STAGE_{item.step}
                  </span>
                  <Icon className={cn("h-4 w-4", item.accent)} />
                </div>
                <p className={cn("text-xs sm:text-sm font-bold", isSelected ? "text-white" : "text-slate-300")}>
                  {item.name}
                </p>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">{item.en}</p>
              </button>
            );
          })}
        </div>

        {/* Split-Pane Studio IDE Preview */}
        <div className="arch-frame rounded-b-xl border-t-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Pane: Active Project Dossier */}
          <div className="lg:col-span-5 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#060913]/90 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                <span className="text-purple-300">DOSSIER // SAMPLE_PROJECT</span>
                <span>ID: WF-2026-01</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                《微观时间倒流三秒》
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                急诊外科医生觉醒时间倒流能力，在医院深处无意撞破跨国药企活体克隆惊天阴谋。
              </p>

              <div className="flex flex-wrap gap-1.5">
                {["都市异能", "电影质感", "微观时间回溯"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded border border-white/12 bg-white/[0.04] text-[11px] font-mono text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>自动生成契合主角人设的电影级封面与立绘</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>支持单章定向微调与多小说云端书架同步</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>导出标准 4K 运镜与视频生成 Prompt 资产</span>
              </div>
            </div>
          </div>

          {/* Right Pane: Live Stage Output Inspector */}
          <div className="lg:col-span-7 flex flex-col bg-[#04060b]">
            <div className="hud-header">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-cyan-300">
                  OUTPUT_STREAM // {currentStep.en}
                </span>
              </div>
              <span>STAGE {currentStep.step} / 05</span>
            </div>

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-4">{currentStep.desc}</p>
                <AnimatePresence mode="wait">
                  <motion.pre
                    key={currentStep.step}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-lg border border-white/10 bg-[#070c18] p-4 sm:p-5 font-mono text-xs sm:text-sm leading-relaxed text-cyan-100 whitespace-pre-wrap overflow-x-auto"
                  >
                    <code>{currentStep.sampleOutput}</code>
                  </motion.pre>
                </AnimatePresence>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-500">SSE REAL-TIME STREAMING READY</span>
                <Link
                  href="/workflow"
                  className="text-cyan-300 hover:text-white font-semibold inline-flex items-center gap-1"
                >
                  <span>LAUNCH WORKBENCH</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
