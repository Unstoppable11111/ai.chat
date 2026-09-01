"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowDown, Hand } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

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
    if (reduceMotion || !sectionRef.current) return;

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
    <section ref={sectionRef} className="relative min-h-[165vh] w-full bg-background overflow-x-clip">
      {/* 极光微光环境背景 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[15%] w-[70vw] h-[60vh] bg-brand-cyan/[0.045] blur-[130px] rounded-full" />
        <div className="absolute top-[15%] right-[-5%] w-[55vw] h-[60vh] bg-brand-violet/[0.04] blur-[110px] rounded-full" />
        <div className="absolute top-[35%] left-[-5%] w-[50vw] h-[50vh] bg-brand-lime/[0.025] blur-[100px] rounded-full" />
        
        {/* Animated Scanline / Grid */}
        <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, white 20%, white 80%, transparent)' }} />
      </div>

      <div ref={containerRef} className="sticky top-0 h-screen flex flex-col justify-between p-4 sm:p-6 md:p-12 pt-20 sm:pt-28 z-10">
        
        {/* Top Info & Live Status Capsule */}
        <div ref={topBarRef} className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-3 z-20 w-full max-w-7xl mx-auto">
          {/* 左侧工作室定位 */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-900/10 bg-white/70 backdrop-blur-md shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-mono tracking-widest text-foreground font-semibold uppercase">
                SYSTEM ONLINE // 2026.09
              </span>
            </div>
          </div>

          <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground text-center sm:text-right hidden sm:block">
            BUILD · EXPERIMENT · RECORD
          </p>
        </div>

        {/* Central Hero Block */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 w-full relative">
          
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
            <span className="block min-h-[0.9em] text-slate-300 dark:text-zinc-700">
              {displayLines[2]}
              {(!reduceMotion && typingState.line === 2) && <i className="type-caret" aria-hidden="true" />}
            </span>
          </h1>

          {/* 移动端专属：快捷探索胶囊栏与 3D 入口 */}
          <div ref={quickPillsRef} className="mt-6 flex flex-col items-center gap-3 md:hidden z-20">
            <p className="text-[11px] text-muted-foreground font-medium tracking-wide text-center max-w-[260px]">
              个人技术展示 · WebGL 实验 · 知识系统
            </p>

            {/* 核心功能直达芯片 */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs">
              <Link 
                href="/projects"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-900/10 bg-white/80 dark:bg-zinc-800/80 text-[11px] font-medium text-foreground shadow-2xs hover:border-brand-cyan transition-colors"
              >
                <span>🚀 精选项目</span>
              </Link>
              <Link 
                href="/experiments"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-900/10 bg-white/80 dark:bg-zinc-800/80 text-[11px] font-medium text-foreground shadow-2xs hover:border-brand-cyan transition-colors"
              >
                <span>🧪 视觉实验</span>
              </Link>
              <Link 
                href="/build-log"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-900/10 bg-white/80 dark:bg-zinc-800/80 text-[11px] font-medium text-foreground shadow-2xs hover:border-brand-cyan transition-colors"
              >
                <span>📝 构建日志</span>
              </Link>
              <a 
                href="/gesture-interactive.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-violet/25 bg-brand-violet/10 text-[11px] font-medium text-brand-violet shadow-2xs hover:bg-brand-violet/15 transition-colors"
              >
                <Hand className="h-3 w-3" />
                <span>3D 手势交互</span>
              </a>
            </div>
          </div>

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
        <div ref={workspaceRef} className="absolute inset-0 flex items-center justify-center z-30 opacity-0 pointer-events-none px-4 sm:px-6">
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
