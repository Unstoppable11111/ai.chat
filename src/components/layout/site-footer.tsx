import Link from "next/link";
import { ArrowUpRight, Mail, Terminal, Cpu, Globe2 } from "lucide-react";
import { navigation } from "@/data/site";

const CORE_SYSTEMS = [
  { label: "JARVIS 智能助手", href: "/chat", code: "SYS_01" },
  { label: "小说 & 分镜工作流", href: "/workflow", code: "SYS_02" },
  { label: "A股量化投研竞技场", href: "/market", code: "SYS_03" },
  { label: "RAG 深度技术白皮书", href: "/build-log", code: "SYS_04" },
];

const LAB_DIRECTORY = [
  { label: "天纪 · 紫微斗数", href: "/experiments/ziwei" },
  { label: "AI 创意生图工坊", href: "/experiments/image-studio" },
  { label: "上帝之眼 3D 遥感", href: "/experiments/gods-eye" },
  { label: "霓虹流体物理画布", href: "/experiments/fluid" },
  { label: "赛博黑客终端 OS", href: "/experiments/cyber-hack" },
  { label: "手势多模态空间", href: "/gesture" },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-[#04060b] text-slate-300 overflow-hidden">
      {/* Top Blueprint Grid Line Overlay */}
      <div className="container-shell py-14 md:py-18 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/[0.08]">
          {/* Col 1: Studio Identity (5 cols) */}
          <div className="md:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-md border border-cyan-500/35 bg-cyan-950/35 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span>ALL SYSTEMS OPERATIONAL // NODE SHENZHEN</span>
            </div>

            <div>
              <p className="text-xl font-bold tracking-[0.14em] text-white font-mono">
                CHEN TECH STUDIO
              </p>
              <p className="mt-2.5 max-w-md text-xs sm:text-sm leading-relaxed text-slate-400">
                全栈 AI 工程、高精度 RAG 知识库引擎、A 股量化策略实验室与前沿 WebGL 交互作品归档基地。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="mailto:chenyc0507@gmail.com"
                className="group inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-3.5 py-2 text-xs font-mono text-cyan-300 hover:border-cyan-400/50 hover:bg-cyan-950/30 transition-all"
              >
                <Mail className="h-3.5 w-3.5 text-cyan-400" />
                <span>chenyc0507@gmail.com</span>
                <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Col 2: Core Modules (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span>CORE ENGINES</span>
            </p>
            <ul className="space-y-2.5 text-xs">
              {CORE_SYSTEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between border-b border-white/[0.05] pb-2 text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-[10px] text-slate-500 group-hover:text-cyan-400">
                      {item.code}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Interactive Labs (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
              <Terminal className="h-3.5 w-3.5 text-purple-400" />
              <span>LAB MATRIX</span>
            </p>
            <ul className="space-y-2 text-xs">
              {LAB_DIRECTORY.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-white transition-colors block py-0.5"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Full Index (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
              <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>DIRECTORY</span>
            </p>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-2 text-xs">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Architectural Colophon */}
        <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <span>© {new Date().getFullYear()} CHEN TECH STUDIO</span>
            <span className="text-white/15">|</span>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              PRIVACY POLICY
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              粤ICP备2026053642号
            </a>
            <span className="opacity-30">|</span>
            <a
              href="https://beian.mps.gov.cn/#/query/webSearch?code=44030002012696"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              粤公网安备 44030002012696号
            </a>
          </div>
        </div>
      </div>

      {/* Architectural Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none text-center font-mono text-[10vw] font-black tracking-tighter text-white/[0.02] leading-none pb-2"
      >
        CHEN.STUDIO.OS
      </div>
    </footer>
  );
}
