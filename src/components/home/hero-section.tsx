"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
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

      // Fade out top and bottom micro texts
      tl.to([topBarRef.current, bottomBarRef.current], {
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
      {/* Static Background to fix performance and flashing */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[60vw] h-[60vh] bg-brand-cyan/[0.03] blur-[120px] rounded-full" />
        <div className="absolute top-[10%] right-[-10%] w-[40vw] h-[60vh] bg-brand-violet/[0.03] blur-[100px] rounded-full" />
        <div className="absolute top-[40%] left-[-10%] w-[50vw] h-[50vh] bg-brand-lime/[0.02] blur-[100px] rounded-full" />
        
        {/* Animated Scanline / Grid */}
        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, white 20%, white 80%, transparent)' }} />
      </div>

      <div ref={containerRef} className="sticky top-0 h-screen flex flex-col justify-between p-6 md:p-12 pt-32 z-10">
        
        {/* Top Info */}
        <div ref={topBarRef} className="flex justify-between items-start z-20 w-full max-w-7xl mx-auto">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground max-w-[200px] leading-loose">
            PERSONAL CREATIVE<br />TECHNOLOGY STUDIO
          </p>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground text-right hidden sm:block">
            BUILD · EXPERIMENT · RECORD
          </p>
        </div>

        {/* Scaled down Title */}
        <div className="flex-1 flex items-center justify-center z-10 w-full relative pointer-events-none">
          <h1 ref={titleRef} aria-label="CHEN TECH STUDIO" className="text-[14vw] md:text-[9vw] font-semibold tracking-tighter text-foreground text-center uppercase will-change-transform flex flex-col" style={{ lineHeight: 0.9 }}>
            <span className="block min-h-[0.9em]">
              {displayLines[0]}
              {(!reduceMotion && typingState.line === 0) && <i className="type-caret" aria-hidden="true" />}
            </span>
            <span className="block min-h-[0.9em]">
              {displayLines[1]}
              {(!reduceMotion && typingState.line === 1) && <i className="type-caret" aria-hidden="true" />}
            </span>
            <span className="block min-h-[0.9em] text-muted-foreground/30">
              {displayLines[2]}
              {(!reduceMotion && typingState.line === 2) && <i className="type-caret" aria-hidden="true" />}
            </span>
          </h1>
        </div>

        {/* Scroll Hint */}
        <div ref={bottomBarRef} className="flex justify-center pb-4 z-20">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground">
            SCROLL TO ENTER ↓
          </p>
        </div>

        {/* Workspace Nav (Reveals on scroll) */}
        <div ref={workspaceRef} className="absolute inset-0 flex items-center justify-center z-30 opacity-0 pointer-events-none">
          <div className="translate-y-[10vh] container-shell w-full max-w-5xl rounded-3xl border border-slate-900/10 bg-background/95 px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-5 md:gap-8">
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
                  <span className="text-sm md:text-base font-light tracking-[0.2em] text-foreground hover:text-brand-cyan transition-colors">
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
