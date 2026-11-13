"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Layers } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

const DOMAIN_DOSSIERS = [
  {
    id: "SECTOR_01",
    title: "PROJECTS // 生产级系统工程",
    subtitle: "全栈平台、量化引擎与自动化工程归档",
    description: "涵盖 Next.js 全栈架构、AI 工作流调度后台、量化交易引擎及生产环境高可用工程案例。",
    href: "/projects",
    image: "/images/placeholders/panel-1.svg",
    metrics: [
      { k: "STACK", v: "Next.js 16 / MySQL / TS" },
      { k: "FOCUS", v: "Production Architecture" },
    ],
    accent: "text-cyan-300 border-cyan-500/35 bg-cyan-950/40",
  },
  {
    id: "SECTOR_02",
    title: "EXPERIMENTS // 交互与图形学沙盒",
    subtitle: "WebGL、3D 空间计算与多模态交互玩具",
    description: "结合 Three.js、Cesium、Canvas 流体力学与计算机视觉手势追踪，持续探索下一代界面交互。",
    href: "/experiments",
    image: "/images/placeholders/panel-2.svg",
    metrics: [
      { k: "ENGINE", v: "WebGL / Three.js / CV" },
      { k: "MODULES", v: "09 Playable Labs" },
    ],
    accent: "text-purple-300 border-purple-500/35 bg-purple-950/40",
  },
  {
    id: "SECTOR_03",
    title: "BUILD LOGS // 深度白皮书与 RAG",
    subtitle: "结构化工程实践、架构复盘与向量知识库",
    description: "系统沉淀 RAG 混合检索、CUDA/Attention 加速、前端性能优化与系统故障复盘的硬核长文。",
    href: "/build-log",
    image: "/images/placeholders/panel-3.svg",
    metrics: [
      { k: "CORPUS", v: "65+ Structured Docs" },
      { k: "INDEX", v: "Chunking-Ready MDX" },
    ],
    accent: "text-emerald-300 border-emerald-500/35 bg-emerald-950/40",
  },
  {
    id: "SECTOR_04",
    title: "PROMPTS // 结构化提示词档案",
    subtitle: "工程级 System Prompts 与多角色模板",
    description: "经真实业务验证的代码审查、架构设计、影视分镜及定量分析可复用 Prompt 指令资产库。",
    href: "/prompts",
    image: "/images/placeholders/panel-4.svg",
    metrics: [
      { k: "FORMAT", v: "Deterministic Templates" },
      { k: "ACCESS", v: "Instant Copy & Run" },
    ],
    accent: "text-amber-300 border-amber-500/35 bg-amber-950/40",
  },
];

export function StackingPanels() {
  return (
    <section className="studio-section bg-[#04060b]">
      <div className="container-shell">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 border-b border-white/10 pb-5">
          <div>
            <div className="tech-tag mb-2.5">
              <Layers className="h-3 w-3 text-cyan-400" />
              <span>SEC_05 // ARCHITECTURAL DOMAIN DOSSIERS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              四大核心沉淀工坊
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            每个核心模块均作为独立系统运行，共同服务于可追溯的 RAG 知识引擎与全栈作品矩阵。
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {DOMAIN_DOSSIERS.map((dossier, idx) => (
            <Reveal key={dossier.id} delay={idx * 0.06}>
              <Link
                href={dossier.href}
                className="arch-frame group flex h-full flex-col overflow-hidden rounded-xl"
              >
                <div className="hud-header">
                  <span className="text-cyan-300">{dossier.id}</span>
                  <span>DOSSIER MODULE</span>
                </div>

                {/* Split Visual + Manifest */}
                <div className="grid grid-cols-1 sm:grid-cols-12 flex-1">
                  <div className="sm:col-span-5 relative min-h-[180px] border-b sm:border-b-0 sm:border-r border-white/[0.08] bg-[#04060b] overflow-hidden">
                    <Image
                      src={dossier.image}
                      alt={dossier.title}
                      fill
                      className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#04060b]/80 via-transparent to-transparent" />
                  </div>

                  <div className="sm:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
                    <div>
                      <span
                        className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider mb-3 ${dossier.accent}`}
                      >
                        {dossier.subtitle}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {dossier.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {dossier.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                      <div className="grid grid-cols-2 gap-2">
                        {dossier.metrics.map((m) => (
                          <div key={m.k} className="rounded bg-[#04060b]/80 border border-white/[0.06] px-2.5 py-1.5">
                            <p className="font-mono text-[9px] text-slate-500">{m.k}</p>
                            <p className="text-[11px] font-mono text-slate-200 truncate">{m.v}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-cyan-300">
                        <span>OPEN SECTOR</span>
                        <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
