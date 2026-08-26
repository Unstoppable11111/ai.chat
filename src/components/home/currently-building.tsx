"use client";

import { useRef } from "react";
import { currentlyBuilding } from "@/data/site";

export function CurrentlyBuilding() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section className="studio-section relative w-full bg-background">
      <div className="container-shell max-w-7xl mx-auto">
        
        <div className="mb-20">
          <h2 className="text-[10px] md:text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
            CURRENTLY<br />BUILDING
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start" ref={containerRef}>
          
          {/* Left Huge Index */}
          <div className="md:col-span-5 lg:col-span-4 flex items-start">
            <span className="text-[25vw] md:text-[15vw] font-light tracking-tighter text-foreground will-change-transform" style={{ lineHeight: 0.8 }}>
              01
            </span>
          </div>

          {/* Right Content */}
          <div className="md:col-span-7 lg:col-span-8 pt-4 md:pt-8">
            <div className="max-w-2xl">
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.1] mb-8">
                {currentlyBuilding[0]}
              </h3>
              
              <div className="flex flex-wrap items-center gap-6 text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground mb-12 border-b border-slate-900/10 pb-8">
                <span>2026.08</span>
                <span className="text-slate-300">/</span>
                <span>DESIGN & FRONTEND</span>
                <span className="text-slate-300">/</span>
                <span className="text-brand-cyan">IN PROGRESS</span>
              </div>

              {/* Minimal Progress Bar */}
              <div className="w-full h-px bg-slate-900/10 overflow-hidden">
                <div 
                  className="h-full bg-foreground transition-all duration-700 ease-out"
                  style={{ width: "25%" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-3 border-t border-slate-900/10 pt-6 md:grid-cols-2">
          {currentlyBuilding.slice(1).map((item, index) => (
            <div key={item} className="flex gap-4 border-b border-slate-900/5 pb-4 text-sm text-muted-foreground">
              <span className="font-mono text-xs text-brand-cyan">0{index + 2}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
