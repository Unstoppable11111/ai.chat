"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, Bot, Cpu, Hand, Sparkles, TrendingUp } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { MagneticButton } from "@/components/ui/magnetic-button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HERO_LINES = [
  { text: "CHEN", accent: false },
  { text: "TECH", accent: false },
  { text: "STUDIO", accent: true },
] as const;

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const quickPillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (reduceMotion || isMobile || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.0,
        },
      });

      // 0-30%: Title scales smoothly toward the header axis
      tl.to(
        titleRef.current,
        {
          scale: 0.36,
          y: "-8vh",
          ease: "power2.inOut",
          duration: 3,
        },
        0
      );

      // Fade out micro chrome & quick pills
      tl.to(
        [topBarRef.current, bottomBarRef.current, quickPillsRef.current],
        {
          opacity: 0,
          y: -18,
          ease: "power2.inOut",
          duration: 2,
        },
        0
      );

      // 30-70%: Luminous command dock reveals
      tl.fromTo(
        workspaceRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 1, ease: "power2.out" },
        0.4
      );

      // Staggered quick launch cells
      tl.fromTo(
        ".workspace-link",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 1.0, ease: "power3.out" },
        0.85
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] w-full bg-transparent overflow-x-clip md:min-h-[155vh]"
    >
      {/* Subtle architectural ambient highlight */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-8%] left-[18%] w-[64vw] h-[54vh] bg-[radial-gradient(closest-side,rgba(14,165,233,0.06),transparent)]" />
        <div className="absolute top-[18%] right-[-4%] w-[52vw] h-[54vh] bg-[radial-gradient(closest-side,rgba(139,92,246,0.05),transparent)]" />
      </div>

      <div
        ref={containerRef}
        className="sticky top-0 h-[100svh] flex flex-col justify-between p-4 sm:p-6 md:h-screen md:p-12 pt-20 sm:pt-28 z-10"
      >
        {/* Top Luminous Info Bar */}
        <div
          ref={topBarRef}
          className="flex justify-between items-center z-20 w-full max-w-7xl mx-auto pointer-events-none"
        >
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3.5 py-1.5 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.06)]">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-700 font-semibold">
              STUDIO OS v3.0 // LUMINOUS EDITION
            </span>
          </div>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.28em] text-muted-foreground/85 font-mono hidden sm:block">
            BUILD · EXPERIMENT · RECORD
          </p>
        </div>

        {/* Central Hero Block */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 w-full relative">
          {/* Desktop Symmetrical Floating Telemetry Cards */}
          <div className="pointer-events-auto hidden lg:block">
            <Link
              href="/market"
              className="absolute left-[5%] top-[16%] flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-[0_18px_36px_-10px_rgba(16,185,129,0.16)] transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  QUANT ARENA
                </p>
                <p className="text-xs font-semibold text-foreground">三大实盘策略在线</p>
              </div>
            </Link>

            <Link
              href="/build-log"
              className="absolute right-[5%] top-[18%] flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:border-sky-400/60 hover:shadow-[0_18px_36px_-10px_rgba(14,165,233,0.18)] transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
                <Cpu className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  RAG ENGINE
                </p>
                <p className="text-xs font-semibold text-foreground">65+ 深度技术白皮书</p>
              </div>
            </Link>

            <Link
              href="/workflow"
              className="absolute left-[7%] bottom-[14%] flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:border-violet-400/60 hover:shadow-[0_18px_36px_-10px_rgba(139,92,246,0.18)] transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-violet">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  AI WORKFLOW
                </p>
                <p className="text-xs font-semibold text-foreground">小说 & 影视分镜流水线</p>
              </div>
            </Link>

            <Link
              href="/chat"
              className="absolute right-[7%] bottom-[16%] flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:border-sky-400/60 hover:shadow-[0_18px_36px_-10px_rgba(14,165,233,0.18)] transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-sky-400">
                <Bot className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  JARVIS AGENT
                </p>
                <p className="text-xs font-semibold text-foreground">全库知识流式对话</p>
              </div>
            </Link>
          </div>

          {/* Main Display Title (Zero interval re-renders, pure GPU staggered reveal) */}
          <h1
            ref={titleRef}
            aria-label="CHEN TECH STUDIO"
            className="text-[16vw] sm:text-[14vw] md:text-[8.8vw] font-semibold tracking-tighter text-foreground text-center uppercase will-change-transform flex flex-col select-none pointer-events-none"
            style={{ lineHeight: 0.9 }}
          >
            {HERO_LINES.map((line, idx) => (
              <motion.span
                key={line.text}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{
                  duration: 0.48,
                  delay: idx * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={
                  line.accent
                    ? "block bg-gradient-to-r from-brand-cyan via-brand-violet to-sky-500 bg-clip-text text-transparent"
                    : "block bg-gradient-to-b from-slate-950 via-slate-900 to-slate-700 bg-clip-text text-transparent"
                }
              >
                {line.text}
              </motion.span>
            ))}
          </h1>

          {/* Subtitle & Quick Launch Pills */}
          <motion.div
            ref={quickPillsRef}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 sm:mt-8 flex flex-col items-center gap-3.5 z-20"
          >
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium tracking-wide text-center max-w-[320px] sm:max-w-lg">
              个人全栈工程 · A股量化竞技场 · WebGL 交互实验 · RAG 知识库
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-xs sm:max-w-2xl">
              <MagneticButton strength={0.22}>
                <Link
                  href="/projects"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200/90 bg-white/95 text-[11px] sm:text-xs font-medium text-foreground shadow-2xs hover:border-sky-300 hover:shadow-sm transition-all"
                >
                  <span>精选项目</span>
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.22}>
                <Link
                  href="/experiments"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200/90 bg-white/95 text-[11px] sm:text-xs font-medium text-foreground shadow-2xs hover:border-sky-300 hover:shadow-sm transition-all"
                >
                  <span>极客工坊</span>
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.22}>
                <Link
                  href="/market"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[11px] sm:text-xs font-semibold text-emerald-700 shadow-2xs hover:bg-emerald-500/15 transition-all"
                >
                  <span>量化投研</span>
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.22}>
                <Link
                  href="/build-log"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200/90 bg-white/95 text-[11px] sm:text-xs font-medium text-foreground shadow-2xs hover:border-sky-300 hover:shadow-sm transition-all"
                >
                  <span>技术白皮书</span>
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.22}>
                <Link
                  href="/gesture"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-brand-violet/25 bg-brand-violet/10 text-[11px] sm:text-xs font-semibold text-brand-violet shadow-2xs hover:bg-brand-violet/15 transition-all"
                >
                  <Hand className="h-3 w-3" />
                  <span>3D 手势交互</span>
                </Link>
              </MagneticButton>
            </div>
          </motion.div>
        </div>

        {/* Scroll Hint */}
        <div ref={bottomBarRef} className="flex flex-col items-center gap-2 pb-2 z-20">
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full border border-slate-200/80 bg-white/85 shadow-2xs">
            <ArrowDown className="h-3 w-3 text-brand-cyan animate-bounce" />
            <p className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
              SCROLL TO EXPLORE
            </p>
          </div>
        </div>

        {/* Luminous Command Dock (Reveals smoothly on desktop scroll) */}
        <div
          ref={workspaceRef}
          className="absolute inset-0 hidden items-center justify-center z-30 opacity-0 pointer-events-none px-4 sm:px-6 md:flex"
        >
          <div className="translate-y-[8vh] container-shell w-full max-w-4xl rounded-3xl border border-slate-200/90 bg-white/96 p-6 sm:p-8 shadow-[0_24px_72px_-12px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
              {[
                { label: "PROJECTS", zh: "项目案例", href: "/projects" },
                { label: "EXPERIMENTS", zh: "极客工坊", href: "/experiments" },
                { label: "WORKFLOW", zh: "内容流", href: "/workflow" },
                { label: "QUANT", zh: "量化投研", href: "/market" },
                { label: "BUILD LOGS", zh: "白皮书", href: "/build-log" },
                { label: "AI CHAT", zh: "智能对话", href: "/chat" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="workspace-link group rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3 pointer-events-auto hover:border-sky-300 hover:bg-sky-50/50 transition-all"
                >
                  <span className="block text-[10px] font-mono tracking-[0.16em] text-slate-400 group-hover:text-sky-600 transition-colors">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-slate-800">
                    {item.zh}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
