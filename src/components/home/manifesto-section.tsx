"use client";

import Link from "next/link";
import { ArrowUpRight, Terminal } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

export function ManifestoSection() {
  return (
    <section className="studio-section bg-[#04060b] py-20 sm:py-28">
      <div className="container-shell">
        <Reveal className="arch-frame rounded-xl overflow-hidden">
          <div className="hud-header">
            <span className="text-cyan-400">SEC_10 // STUDIO MANIFESTO</span>
            <span>CONTINUOUS DELIVERY</span>
          </div>

          <div className="p-8 sm:p-12 md:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 mb-4">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                <span>ENGINEERING ETHOS</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.08]">
                THE STUDIO IS ALWAYS
                <span className="block text-gradient-cyan mt-1">BUILDING & INDEXING.</span>
              </h2>
              <p className="mt-5 max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
                将每一个想法落地为可运行的工程原型、可回溯的技术白皮书与可检索的 RAG 向量知识资产。
                代码、数据与审美秩序在此持续演进。
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link
                href="/about"
                className="flex items-center justify-between rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3.5 text-xs font-mono uppercase tracking-wider text-white hover:border-cyan-400/50 hover:text-cyan-300 transition-all"
              >
                <span>ABOUT CHEN STUDIO</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/stack"
                className="flex items-center justify-between rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3.5 text-xs font-mono uppercase tracking-wider text-slate-200 hover:border-cyan-400/50 hover:text-cyan-300 transition-all"
              >
                <span>INFRASTRUCTURE STACK</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:chenyc0507@gmail.com"
                className="flex items-center justify-between rounded-lg border border-cyan-500/35 bg-cyan-950/35 px-4 py-3.5 text-xs font-mono uppercase tracking-wider text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition-all"
              >
                <span>DIRECT CONTACT // EMAIL</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
