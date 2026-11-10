"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const panels = [
  {
    id: "01",
    title: "PROJECTS",
    description: "Production-ready products, systems, and platforms.",
    href: "/projects",
    image: "/images/placeholders/panel-1.svg",
    colorClass: "bg-gradient-to-br from-[#0d162b] via-[#091020] to-[#050813] text-white border-cyan-500/35 shadow-[0_0_40px_rgba(0,240,255,0.12)]",
    buttonHover: "hover:bg-cyan-400 hover:text-slate-950 hover:border-cyan-300",
  },
  {
    id: "02",
    title: "EXPERIMENTS",
    description: "Visual labs, interactions, and conceptual designs.",
    href: "/experiments",
    image: "/images/placeholders/panel-2.svg",
    colorClass: "bg-gradient-to-br from-[#140e2b] via-[#0e0a1f] to-[#070512] text-white border-purple-500/35 shadow-[0_0_40px_rgba(168,85,247,0.12)]",
    buttonHover: "hover:bg-purple-400 hover:text-slate-950 hover:border-purple-300",
  },
  {
    id: "03",
    title: "BUILD LOGS",
    description: "Documenting the process, failures, and technical decisions.",
    href: "/build-log",
    image: "/images/placeholders/panel-3.svg",
    colorClass: "bg-gradient-to-br from-[#06181f] via-[#041016] to-[#03090e] text-white border-emerald-500/35 shadow-[0_0_40px_rgba(16,185,129,0.12)]",
    buttonHover: "hover:bg-emerald-400 hover:text-slate-950 hover:border-emerald-300",
  },
  {
    id: "04",
    title: "LEARNING",
    description: "Prompts, tools, and technical archives.",
    href: "/prompts",
    image: "/images/placeholders/panel-4.svg",
    colorClass: "bg-gradient-to-br from-[#1a1309] via-[#120d06] to-[#090602] text-white border-amber-500/35 shadow-[0_0_40px_rgba(245,158,11,0.12)]",
    buttonHover: "hover:bg-amber-400 hover:text-slate-950 hover:border-amber-300",
  }
];

export function StackingPanels() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !containerRef.current) return;

    const cards = gsap.utils.toArray<HTMLElement>(".stack-panel");
    const ctx = gsap.context(() => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;

      cards.forEach((card, index) => {
        if (index === cards.length - 1) return;

        const nextCard = cards[index + 1];

        gsap.to(card, {
          scale: isMobile ? 0.96 : 0.94,
          opacity: isMobile ? 0.8 : 0.6,
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: nextCard,
            start: "top 80%",
            end: "top 20%",
            scrub: true,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section className="relative w-full bg-background pb-32">
      <div className="container-shell max-w-7xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest mb-3 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
          <span>DIGITAL WORKSPACE // 空间矩阵</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          四大核心沉淀工坊
        </h2>
      </div>

      <div ref={containerRef} className="relative w-full flex flex-col items-center">
        {panels.map((panel, i) => (
          <div 
            key={panel.id}
            className={`stack-panel sticky w-[92vw] sm:w-[88vw] md:w-[75vw] max-w-5xl h-[56vh] sm:h-[62vh] md:h-[70vh] rounded-[28px] sm:rounded-[36px] md:rounded-[40px] border flex flex-col justify-between p-5 sm:p-8 md:p-12 lg:p-16 shadow-[0_-12px_48px_-15px_rgba(0,0,0,0.7)] origin-top overflow-hidden isolate group will-change-transform backdrop-blur-2xl ${panel.colorClass}`}
            style={{ 
              top: `calc(72px + ${i * 20}px)`, 
              marginBottom: i === panels.length - 1 ? '0' : '30vh'
            }}
          >
            <div className="flex justify-between items-start relative z-20">
              <span className="text-lg sm:text-xl md:text-3xl font-light opacity-60 tracking-tighter font-mono text-cyan-300">
                {panel.id}
              </span>
              <Link 
                href={panel.href} 
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 ${panel.buttonHover} pointer-events-auto backdrop-blur-md shadow-sm`}
              >
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>

            {/* Central Visual Area */}
            <div className="flex-1 w-full relative min-h-0 my-3 sm:my-6 flex items-center justify-center z-10 pointer-events-none">
              <div className="relative w-full h-full max-w-3xl rounded-xl sm:rounded-2xl overflow-hidden opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700 ease-out border border-white/10 shadow-2xl">
                <Image 
                  src={panel.image} 
                  alt={panel.title} 
                  fill 
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            </div>

            <div className="max-w-3xl relative z-20 pointer-events-none">
              <h3 className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tighter mb-2 sm:mb-4 md:mb-6 uppercase text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.15)]">
                {panel.title}
              </h3>
              <p className="text-xs sm:text-base md:text-xl font-light text-slate-300 leading-relaxed max-w-xl line-clamp-2">
                {panel.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
