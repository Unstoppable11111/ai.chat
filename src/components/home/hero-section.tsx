"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Dot, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { siteConfig } from "@/data/site";

const floatTransition = {
  duration: 10,
  repeat: Number.POSITIVE_INFINITY,
  ease: [0.42, 0, 0.58, 1] as const,
};

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="studio-section grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-900/8 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-muted-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
          AI 原生个人工作室
        </div>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
          {siteConfig.title}
        </h1>
        <p className="mt-5 text-xl text-gradient md:text-2xl">
          用 AI、代码与视觉持续构建。
        </p>
        <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
          我用 AI、设计和代码，把想法快速变成图像、页面、产品和系统。
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/ai-lab">
            进入 AI Lab <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/projects" variant="secondary">
            查看项目案例
          </ButtonLink>
          <ButtonLink href="/build-log" variant="secondary">
            阅读构建日志
          </ButtonLink>
        </div>

        <div className="mt-10 flex flex-wrap gap-5 text-sm text-muted-foreground">
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
        className="glass-panel noise-overlay relative min-h-[460px] overflow-hidden rounded-[30px] p-6"
        initial={false}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.34),rgba(14,165,233,0.12)_34%,rgba(139,92,246,0.12)_60%,transparent_72%)] blur-sm will-change-transform"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [-4, 6, -4],
                  y: [-8, 10, -8],
                  scale: [1, 1.035, 1],
                }
          }
          transition={{ ...floatTransition, duration: 11 }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(255,255,255,0.48))]" />

        <motion.div
          className="absolute left-6 top-6 rounded-[24px] border border-slate-900/8 bg-white/82 p-4 shadow-sm will-change-transform"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, 3, 0, -2, 0],
                  y: [0, -4, -6, -3, 0],
                  rotate: [0, 0.2, 0, -0.2, 0],
                }
          }
          transition={{ ...floatTransition, duration: 9.5 }}
        >
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">AI Core</p>
          <p className="mt-2 text-sm leading-7 text-foreground/90">
            提示词逻辑、视觉方向、产品表达。
          </p>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-8 right-20 rounded-[24px] border border-slate-900/8 bg-white/86 p-4 shadow-sm will-change-transform"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, -2, 0, 2, 0],
                  y: [0, 5, 7, 3, 0],
                  rotate: [0, -0.12, 0, 0.12, 0],
                }
          }
          transition={{ ...floatTransition, duration: 12.5 }}
        >
          <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-muted-foreground">
            <span>当前工作循环</span>
            <span className="text-brand-lime">进行中</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <motion.div
              className="rounded-2xl border border-slate-900/8 bg-slate-900/[0.03] p-3"
              animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
              transition={{ ...floatTransition, duration: 7.5 }}
            >
              <p className="text-xs text-muted-foreground">生成</p>
              <p className="mt-1 text-sm leading-7">提示词到图像的实验</p>
            </motion.div>
            <motion.div
              className="rounded-2xl border border-slate-900/8 bg-slate-900/[0.03] p-3"
              animate={reduceMotion ? undefined : { y: [0, 1, 0, -2, 0] }}
              transition={{ ...floatTransition, duration: 8.2 }}
            >
              <p className="text-xs text-muted-foreground">塑形</p>
              <p className="mt-1 text-sm leading-7">界面、系统与发布页</p>
            </motion.div>
            <motion.div
              className="rounded-2xl border border-slate-900/8 bg-slate-900/[0.03] p-3"
              animate={reduceMotion ? undefined : { y: [0, -1, 0, 2, 0] }}
              transition={{ ...floatTransition, duration: 8.8 }}
            >
              <p className="text-xs text-muted-foreground">沉淀</p>
              <p className="mt-1 text-sm leading-7">日志、提示词与复用模式</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
