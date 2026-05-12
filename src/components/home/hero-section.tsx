"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Dot, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { siteConfig } from "@/data/site";

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const floatTransition = {
    duration: 10,
    repeat: Number.POSITIVE_INFINITY,
    ease: [0.45, 0, 0.55, 1],
  } as const;

  return (
    <section className="studio-section grid min-w-0 gap-10 lg:grid-cols-2 lg:items-center">
      <div className="min-w-0">
        <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-900/8 bg-white/70 px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground shadow-sm sm:px-4 sm:tracking-[0.24em]">
          <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
          AI 原生个人工作室
        </div>
        <h1 className="max-w-full text-[clamp(2.75rem,15vw,4.5rem)] font-semibold leading-[0.98] tracking-tight text-foreground break-words md:max-w-3xl md:text-7xl">
          {siteConfig.title}
        </h1>
        <p className="mt-5 text-xl text-gradient md:text-2xl">
          用 AI、代码与视觉持续构建。
        </p>
        <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
          我用 AI、设计和代码，把想法快速变成图像、页面、产品和系统。
        </p>

        <div className="mt-8 flex min-w-0 flex-col gap-3 sm:flex-row">
          <ButtonLink href="/ai-lab" className="w-full justify-center sm:w-auto">
            进入 AI Lab <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/projects" variant="secondary" className="w-full justify-center sm:w-auto">
            查看项目案例
          </ButtonLink>
          <ButtonLink href="/build-log" variant="secondary" className="w-full justify-center sm:w-auto">
            阅读构建日志
          </ButtonLink>
        </div>

        <div className="mt-10 flex min-w-0 flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Dot className="h-5 w-5 text-brand-lime" />
            视觉实验
          </div>
          <div className="flex items-center gap-2">
            <Dot className="h-5 w-5 text-brand-cyan" />
            提示词系统
          </div>
          <div className="flex items-center gap-2">
            <Dot className="h-5 w-5 text-brand-violet" />
            产品构建
          </div>
        </div>
      </div>

      <motion.div
        className="glass-panel noise-overlay relative grid w-full min-w-0 max-w-full gap-4 overflow-hidden rounded-[26px] p-4 md:block md:min-h-[430px] md:rounded-[30px] md:p-6"
        initial={false}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.32),rgba(14,165,233,0.14)_36%,rgba(139,92,246,0.12)_64%,transparent_74%)] blur-sm will-change-transform md:h-56 md:w-56"
          animate={
            reduceMotion
              ? undefined
              : { y: [-8, 7, -8], x: [-5, 5, -5], scale: [1, 1.035, 1] }
          }
          transition={{ ...floatTransition, duration: 12 }}
        />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(255,255,255,0.58))]" />

        <motion.div
          className="relative z-10 w-full max-w-full rounded-[22px] border border-slate-900/8 bg-white/80 p-4 shadow-sm will-change-transform md:absolute md:left-6 md:top-6 md:w-auto md:max-w-[280px]"
          animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, -0.35, 0] }}
          transition={{ ...floatTransition, duration: 9 }}
        >
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground sm:tracking-[0.24em]">AI Core</p>
          <p className="mt-2 text-sm text-foreground/90">
            提示词逻辑、视觉方向、产品表达。
          </p>
        </motion.div>

        <motion.div
          className="relative z-10 w-full min-w-0 max-w-full rounded-[22px] border border-slate-900/8 bg-white/84 p-4 shadow-sm will-change-transform md:absolute md:bottom-6 md:left-6 md:right-6 md:w-auto"
          animate={reduceMotion ? undefined : { y: [0, 6, 0], rotate: [0, 0.25, 0] }}
          transition={{ ...floatTransition, duration: 11 }}
        >
          <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.24em]">
            <span>当前工作循环</span>
            <span className="text-brand-lime">进行中</span>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] border border-slate-900/8 bg-slate-900/[0.025] p-3">
              <p className="text-xs text-muted-foreground">生成</p>
              <p className="mt-1 text-sm leading-6">提示词到图像的实验</p>
            </div>
            <div className="rounded-[18px] border border-slate-900/8 bg-slate-900/[0.025] p-3">
              <p className="text-xs text-muted-foreground">塑形</p>
              <p className="mt-1 text-sm leading-6">界面、系统与发布页</p>
            </div>
            <div className="rounded-[18px] border border-slate-900/8 bg-slate-900/[0.025] p-3">
              <p className="text-xs text-muted-foreground">沉淀</p>
              <p className="mt-1 text-sm leading-6">日志、提示词与复用模式</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
