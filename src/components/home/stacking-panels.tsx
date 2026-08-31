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
    colorClass: "bg-white text-foreground border-slate-900/10",
    buttonHover: "hover:bg-foreground hover:text-white",
  },
  {
    id: "02",
    title: "EXPERIMENTS",
    description: "Visual labs, interactions, and conceptual designs.",
    href: "/experiments",
    image: "/images/placeholders/panel-2.svg",
    colorClass: "bg-slate-50 text-foreground border-slate-900/5",
    buttonHover: "hover:bg-foreground hover:text-white",
  },
  {
    id: "03",
    title: "BUILD LOGS",
    description: "Documenting the process, failures, and technical decisions.",
    href: "/build-log",
    image: "/images/placeholders/panel-3.svg",
    colorClass: "bg-slate-950 text-white border-white/10",
    buttonHover: "hover:bg-white hover:text-slate-950",
  },
  {
    id: "04",
    title: "LEARNING",
    description: "Prompts, tools, and technical archives.",
    href: "/prompts",
    image: "/images/placeholders/panel-4.svg",
    colorClass: "bg-[#f8f9fa] text-foreground border-slate-900/10",
    buttonHover: "hover:bg-foreground hover:text-white",
  }
];

export function StackingPanels() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !containerRef.current) return;

    const cards = gsap.utils.toArray<HTMLElement>(".stack-panel");
    const ctx = gsap.context(() => {
      cards.forEach((card, index) => {
        if (index === cards.length - 1) return; // 最后一张卡片不需要被后续遮盖缩放

        const nextCard = cards[index + 1];

        gsap.to(card, {
          scale: 0.9,
          opacity: 0.5,
          filter: "blur(8px)",
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
         <h2 className="text-[10px] md:text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
            DIGITAL WORKSPACE
         </h2>
      </div>

      <div ref={containerRef} className="relative w-full flex flex-col items-center">
        {panels.map((panel, i) => (
          <div 
            key={panel.id}
            className={`stack-panel sticky w-[90vw] md:w-[75vw] max-w-5xl h-[60vh] md:h-[70vh] rounded-[32px] md:rounded-[40px] border flex flex-col justify-between p-8 md:p-12 lg:p-16 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.1)] origin-top overflow-hidden isolate group will-change-transform ${panel.colorClass}`}
            style={{ 
              top: `calc(10vh + ${i * 40}px)`, 
              marginBottom: i === panels.length - 1 ? '0' : '40vh'
            }}
          >
            <div className="flex justify-between items-start relative z-20">
              <span className="text-xl md:text-3xl font-light opacity-50 tracking-tighter">
                {panel.id}
              </span>
              <Link href={panel.href} className={`w-12 h-12 rounded-full border border-current/20 flex items-center justify-center transition-colors duration-300 ${panel.buttonHover} pointer-events-auto`}>
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Central Visual Area using flex-1 min-h-0 to avoid overlap */}
            <div className="flex-1 w-full relative min-h-0 my-6 flex items-center justify-center z-10 pointer-events-none">
              <div className="relative w-full h-full max-w-3xl rounded-2xl overflow-hidden opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700 ease-out border border-current/5 shadow-2xl">
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
              <h3 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tighter mb-4 md:mb-6 uppercase">
                {panel.title}
              </h3>
              <p className="text-base md:text-xl font-light opacity-70 leading-relaxed max-w-xl line-clamp-2">
                {panel.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
