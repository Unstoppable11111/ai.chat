"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, Hand, Sparkles, TrendingUp, Cpu } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { MagneticButton } from "@/components/ui/magnetic-button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const quickPillsRef = useRef<HTMLDivElement>(null);
  const [typingState, setTypingState] = useState({ line: 0, char: 0 });
  
  const displayLines = reduceMotion 
    ? ["CHEN", "TECH", "STUDIO"] 
    : [
        "CHEN".slice(0, typingState.line > 0 ? 4 : typingState.line === 0 ? typingState.char : 0),
        "TECH".slice(0, typingState.line > 1 ? 4 : typingState.line === 1 ? typingState.char : 0),
        "STUDIO".slice(0, typingState.line > 2 ? 6 : typingState.line === 2 ? typingState.char : 0),
      ];

  useEffect(() => {
    if (reduceMotion) return;

    const lines = ["CHEN", "TECH", "STUDIO"];
    let l = 0;
    let c = 0;
    
    const timer = window.setInterval(() => {
      c += 1;
      if (c > lines[l].length) {
        l += 1;
        c = 1;
      }
      if (l >= lines.length) {
        setTypingState({ line: l, char: 0 });
        window.clearInterval(timer);
        return;
      }
      setTypingState({ line: l, char: c });
    }, 105);

    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (reduceMotion || isMobile || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // 0-30%: Title scales down
      tl.to(titleRef.current, {
        scale: 0.35,
        y: "-8vh",
        ease: "power2.inOut",
        duration: 3,
      }, 0);

      // Fade out top and bottom micro texts & quick pills
      tl.to([topBarRef.current, bottomBarRef.current, quickPillsRef.current], {
        opacity: 0,
        y: -20,
        ease: "power2.inOut",
        duration: 2,
      }, 0);

      // 30-70%: Workspace space reveals
      tl.fromTo(workspaceRef.current, 
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 1, ease: "power2.out" },
        0.4
      );

      // Stagger in the links
      tl.fromTo(".workspace-link", 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 1.2, ease: "power3.out" },
        0.9
      );

    }, sectionRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] w-full bg-background overflow-x-clip md:min-h-[165vh]">
      {/* 极光微光环境背景 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* 性能优化：用 radial-gradient 替代超大半径 CSS blur 滤镜，视觉等效，但避免滚动/scrub 动画时每帧重算高斯模糊 */}
        <div className="absolute top-[-10%] left-[15%] w-[70vw] h-[60vh] bg-[radial-gradient(closest-side,rgba(14,165,233,0.045),transparent)]" />
        <div className="absolute top-[15%] right-[-5%] w-[55vw] h-[60vh] bg-[radial-gradient(closest-side,rgba(139,92,246,0.04),transparent)]" />
        <div className="absolute top-[35%] left-[-5%] w-[50vw] h-[50vh] bg-[radial-gradient(closest-side,rgba(101,163,13,0.025),transparent)]" />
        
        {/* Animated Scanline / Grid */}
        <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, white 20%, white 80%, transparent)' }} />
      </div>

      <div ref={containerRef} className="sticky top-0 h-[100svh] flex flex-col justify-between p-4 sm:p-6 md:h-screen md:p-12 pt-20 sm:pt-28 z-10">
        
        {/* Top Minimal Info Bar */}
        <div ref={topBarRef} className="flex justify-between items-center z-20 w-full max-w-7xl mx-auto pointer-events-none">
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-900/8 bg-white/75 px-3 py-1 backdrop-blur-xs shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/85 font-semibold">
              STUDIO OS v2.6 // ONLINE
            </span>
          </div>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.28em] text-muted-foreground/80 font-mono hidden sm:block">
            BUILD · EXPERIMENT · RECORD
          </p>
        </div>

        {/* Central Hero Block */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 w-full relative">
          {/* Desktop Floating Telemetry Chips */}
          <div className="pointer-events-auto hidden lg:block">
            <Link
              href="/market"
              className="animate-float-slow absolute left-[6%] top-[18%] flex items-center gap-2.5 rounded-2xl border border-slate-900/8 bg-white/80 px-3.5 py-2 backdrop-blur-md shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">QUANT ARENA</p>
                <p className="text-xs font-semibold text-foreground">三大实盘策略在线</p>
              </div>
            </Link>

            <Link
              href="/build-log"
              style={{ animationDelay: "1.6s" }}
              className="animate-float-slow absolute right-[6%] top-[20%] flex items-center gap-2.5 rounded-2xl border border-slate-900/8 bg-white/80 px-3.5 py-2 backdrop-blur-md shadow-sm hover:border-brand-cyan/40 hover:shadow-md transition-all"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
                <Cpu className="h-3.5 w-3.5" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">RAG ENGINE</p>
                <p className="text-xs font-semibold text-foreground">65+ 深度技术白皮书</p>
              </div>
            </Link>

            <Link
              href="/workflow"
              style={{ animationDelay: "2.8s" }}
              className="animate-float-slow absolute left-[9%] bottom-[16%] flex items-center gap-2.5 rounded-2xl border border-slate-900/8 bg-white/80 px-3.5 py-2 backdrop-blur-md shadow-sm hover:border-brand-violet/40 hover:shadow-md transition-all"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-violet">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">AI WORKFLOW</p>
                <p className="text-xs font-semibold text-foreground">小说 & 影视分镜流水线</p>
              </div>
            </Link>
          </div>
          
          {/* Main Title */}
          <h1 
            ref={titleRef} 
            aria-label="CHEN TECH STUDIO" 
            className="text-[16vw] sm:text-[14vw] md:text-[9vw] font-semibold tracking-tighter text-foreground text-center uppercase will-change-transform flex flex-col select-none pointer-events-none" 
            style={{ lineHeight: 0.88 }}
          >
            <span className="block min-h-[0.9em] bg-gradient-to-b from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              {displayLines[0]}
              {(!reduceMotion && typingState.line === 0) && <i className="type-caret" aria-hidden="true" />}
            </span>
            <span className="block min-h-[0.9em] bg-gradient-to-b from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              {displayLines[1]}
              {(!reduceMotion && typingState.line === 1) && <i className="type-caret" aria-hidden="true" />}
            </span>
            <span className="block min-h-[0.9em] bg-gradient-to-r from-brand-cyan via-brand-violet to-sky-500 bg-clip-text text-transparent">
              {displayLines[2]}
              {(!reduceMotion && typingState.line === 2) && <i className="type-caret text-brand-cyan" aria-hidden="true" />}
            </span>
          </h1>

          {/* 全端快捷探索胶囊栏与磁吸入口 */}
          <motion.div
            ref={quickPillsRef}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 sm:mt-8 flex flex-col items-center gap-3.5 z-20"
          >
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium tracking-wide text-center max-w-[320px] sm:max-w-md">
              个人全栈工程 · A股量化竞技场 · WebGL 交互实验 · RAG 知识库
            </p>

            {/* 核心功能直达芯片（桌面端支持 Magnetic 磁吸） */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-xs sm:max-w-xl">
              <MagneticButton strength={0.25}>
                <Link 
                  href="/projects"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-900/10 bg-white/85 text-[11px] sm:text-xs font-medium text-foreground shadow-2xs hover:border-brand-cyan/50 hover:shadow-sm transition-all"
                >
                  <span>🚀 精选项目</span>
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.25}>
                <Link 
                  href="/experiments"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-900/10 bg-white/85 text-[11px] sm:text-xs font-medium text-foreground shadow-2xs hover:border-brand-cyan/50 hover:shadow-sm transition-all"
                >
                  <span>🧪 极客工坊</span>
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.25}>
                <Link 
                  href="/market"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[11px] sm:text-xs font-medium text-emerald-700 shadow-2xs hover:bg-emerald-500/15 transition-all"
                >
                  <span>📈 量化投研</span>
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.25}>
                <Link 
                  href="/build-log"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-900/10 bg-white/85 text-[11px] sm:text-xs font-medium text-foreground shadow-2xs hover:border-brand-cyan/50 hover:shadow-sm transition-all"
                >
                  <span>📑 技术白皮书</span>
                </Link>
              </MagneticButton>
              <MagneticButton strength={0.25}>
                <Link 
                  href="/gesture"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-brand-violet/25 bg-brand-violet/10 text-[11px] sm:text-xs font-medium text-brand-violet shadow-2xs hover:bg-brand-violet/15 transition-all"
                >
                  <Hand className="h-3 w-3" />
                  <span>3D 手势交互</span>
                </Link>
              </MagneticButton>
            </div>
          </motion.div>

        </div>

        {/* Scroll Hint with Animated Indicator */}
        <div ref={bottomBarRef} className="flex flex-col items-center gap-2 pb-2 z-20">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-900/8 bg-white/50 backdrop-blur-2xs shadow-2xs">
            <ArrowDown className="h-3 w-3 text-brand-cyan animate-bounce" />
            <p className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
              SCROLL TO EXPLORE
            </p>
          </div>
        </div>

        {/* Workspace Nav (Reveals on scroll) */}
        <div ref={workspaceRef} className="absolute inset-0 hidden items-center justify-center z-30 opacity-0 pointer-events-none px-4 sm:px-6 md:flex">
          <div className="translate-y-[8vh] container-shell w-full max-w-5xl rounded-2xl sm:rounded-3xl border border-slate-900/10 bg-background/95 p-5 sm:p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10 text-center">
              {[
                { label: 'PROJECTS', href: '/projects' },
                { label: 'EXPERIMENTS', href: '/experiments' },
                { label: 'BUILD LOGS', href: '/build-log' },
                { label: 'TOOLS', href: '/stack' },
                { label: 'NOTES', href: '/prompts' }
              ].map((item) => (
                <Link 
                  key={item.label} 
                  href={item.href}
                  className="workspace-link block pointer-events-auto"
                >
                  <span className="text-xs sm:text-sm md:text-base font-light tracking-[0.18em] text-foreground hover:text-brand-cyan transition-colors">
                    {item.label}
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
