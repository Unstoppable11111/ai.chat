"use client";

import Link from "next/link";

export function ManifestoSection() {
  return (
    <section className="relative min-h-[40vh] flex flex-col justify-center items-center bg-background border-t border-slate-900/5 py-24 md:py-32">
      <div className="container-shell max-w-4xl mx-auto text-center z-10 relative">
        <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground mb-6">
          THE STUDIO IS ALWAYS BUILDING.
        </h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-16">
          An ongoing experiment in digital craft, creative coding, and technical documentation. 
          Building tools, exploring interfaces, and recording the process.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-xs font-mono tracking-widest uppercase text-muted-foreground">
          <Link href="/about" className="hover:text-brand-cyan transition-colors border-b border-transparent hover:border-brand-cyan pb-1">
            ABOUT STUDIO
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            GITHUB
          </a>
          <a href="mailto:contact@chenyc.chat" className="hover:text-foreground transition-colors">
            EMAIL
          </a>
        </div>
      </div>
    </section>
  );
}
