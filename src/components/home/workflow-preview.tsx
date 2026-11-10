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
  Zap,
  Play,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Reveal } from "@/components/shared/reveal";

const emptySubscribe = () => () => {};

const PIPELINE_STEPS = [
  {
    step: "01",
    name: "设定集与人物卡",
    en: "Story Bible & Cards",
    desc: "全景世界观、三幕式伏笔链与高辨识度人物小传",
    icon: BookOpen,
    accent: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  },
  {
    step: "02",
    name: "长篇连续正文递推",
    en: "Context Cascading Engine",
    desc: "15字短句白描、去AI机械味与剧情冲突递进",
    icon: Wand2,
    accent: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  },
  {
    step: "03",
    name: "主角立绘与电影封面",
    en: "Cinematic Visuals",
    desc: "融合主人公与核心场景的商业级海报与立绘资产",
    icon: Layers,
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  {
    step: "04",
    name: "专业影视分镜脚本",
    en: "AI Video Storyboard",
    desc: "景别运镜、灯光色彩与可灵/Runway高精度Prompt",
    icon: Film,
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  {
    step: "05",
    name: "爆款提案与商业包装",
    en: "Pitch Note & Strategy",
    desc: "对标爆款、核心受众痛点与付费卡点结构分析",
    icon: FileSpreadsheet,
    accent: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
];

export function WorkflowPreview() {
  const [activeStep, setActiveStep] = useState(0);
  const { user } = useAuth();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  return (
    <section className="container-shell py-12 md:py-20 relative overflow-hidden">
      {/* 渐变装饰背景 */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(closest-side,rgba(168,85,247,0.1),transparent)] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[450px] h-[450px] bg-[radial-gradient(closest-side,rgba(0,240,255,0.08),transparent)] pointer-events-none" />

      {/* 头部标题与行动引导 */}
      <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative z-10">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/35 text-purple-300 text-xs font-semibold shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>工业级内容生产线 · 自动化小说 & AI 视频分镜工作流</span>
            </div>
            {mounted && user && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-medium shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span>创作者已就绪: {user.username}</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            从一句话灵感，到商业爆款全套数字资产
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            告别传统网文作坊与断章瓶颈。内置去 AI 味文笔精修、自动连续上下文级联、多小说书架与人物立绘，开启电影级工业化创作纪元。
          </p>
        </div>

        <Link
          href="/workflow"
          className="shimmer-beam inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all shrink-0 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{mounted && user ? "进入专属创作者工作台" : "立即体验工业化工作流"}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Reveal>

      {/* 五大标准生产环节卡片流 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10 relative z-10">
        {PIPELINE_STEPS.map((item, idx) => {
          const Icon = item.icon;
          const isSelected = activeStep === idx;
          return (
            <Reveal key={item.step} delay={idx * 0.06}>
              <div
                onClick={() => setActiveStep(idx)}
                className={`group h-full p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden backdrop-blur-md ${
                  isSelected
                    ? "bg-[#0f172a] border-purple-400/60 shadow-[0_0_24px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/30 -translate-y-1.5"
                    : "bg-[#0b1222]/80 border-white/10 hover:bg-[#0f172a] hover:border-white/20 hover:-translate-y-1"
                }`}
              >
                {/* 顶部环节标号与图标 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-black text-slate-400 group-hover:text-purple-300 transition-colors">
                    {item.step}
                  </span>
                  <div className={`p-2 rounded-xl border ${item.accent} group-hover:scale-110 transition-transform shadow-sm`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* 标题与描述 */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">{item.en}</p>
                  <p className="text-xs text-slate-300 leading-relaxed mt-2">{item.desc}</p>
                </div>

                {/* 底部活跃弹簧指示条 */}
                <div className="mt-4 h-1 w-full rounded-full bg-white/10 overflow-hidden relative">
                  {isSelected && (
                    <motion.div
                      layoutId="workflow-preview-step-bar"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 shadow-[0_0_8px_#c084fc]"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* 实时工作流动态视窗预览 (Interactive Showcase) */}
      <Reveal delay={0.12} className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c1324] via-[#090e1a] to-[#120f29] p-6 sm:p-8 text-white shadow-[0_24px_72px_rgba(0,0,0,0.85)] relative overflow-hidden z-10 backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 左侧：示例小说卡片与视觉资产 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-xs text-cyan-300 font-mono shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>当前孵化范例 · 赛博高能都市</span>
            </div>

            <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              《微观时间倒流三秒》
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              急诊外科医生觉醒时间倒流能力，在医院深处无意撞破跨国药企活体克隆惊天阴谋。
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-[11px] font-medium border border-cyan-500/30">
                都市异能
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-[11px] font-medium border border-purple-500/30">
                电影质感
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-500/30">
                微观时间回溯
              </span>
            </div>

            {/* 核心亮点 checklist */}
            <div className="space-y-2 pt-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>自动生成契合主角人设与主场景的电影级封面</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>支持单章定向微调与角色立绘资产按需生成</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>个人专属书架多小说并行绑定与云端持久化</span>
              </div>
            </div>
          </div>

          {/* 右侧：高科技打字机视窗模拟 */}
          <div className="lg:col-span-8 rounded-2xl bg-black/60 border border-white/10 p-5 sm:p-6 backdrop-blur-md space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  pipeline-stream://chapter-1/de-ai-polished
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                SSE 极速推流中
              </span>
            </div>

            {/* 正文片段 */}
            <div className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
              <p className="text-purple-300 font-bold">
                【第一章 暴雨急救室的倒流指针】
              </p>
              <p className="text-slate-300">
                窗外暴雨如注，救护车刺耳的警笛划破长夜。心电监护仪尖锐的直线警报响起，病人的血压已跌破临界点。
              </p>
              <p className="text-slate-400">
                林渊深吸一口气，指尖银白色纳米手术刀微微下压。就在止血钳滑脱的刹那，他眼中掠过一抹炽蓝微光——
              </p>
              <p className="text-cyan-300 font-semibold pl-3 border-l-2 border-cyan-400 shadow-[inset_0_0_12px_rgba(0,240,255,0.1)]">
                &ldquo;时间倒流，三秒。&rdquo;
              </p>
              <p className="text-slate-400">
                世界瞬间凝滞，飞溅的血珠诡异倒退回血管，监护仪波形重新跳动。而在手术室紧闭的透视窗外，一个身穿黑色防化服的阴冷身影，正将一管标有&ldquo;第VII号长生原液&rdquo;的药剂迅速收入金属箱……
              </p>
            </div>

            {/* 分镜代码块展示 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={PIPELINE_STEPS[activeStep].step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-[11px] font-mono text-cyan-200/90 flex flex-wrap items-center justify-between gap-2 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
              >
                <div>
                  <span className="text-slate-500">
                    # [{PIPELINE_STEPS[activeStep].step} {PIPELINE_STEPS[activeStep].name}]：
                  </span>
                  <span className="text-cyan-400">
                    {" "}
                    {PIPELINE_STEPS[activeStep].en} · {PIPELINE_STEPS[activeStep].desc}
                  </span>
                </div>
                <Link
                  href="/workflow"
                  className="text-xs text-white hover:text-cyan-300 font-bold flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>探索全部章节</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
