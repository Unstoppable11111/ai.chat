import Link from "next/link";
import { Sparkles, ArrowUpRight, Mail } from "lucide-react";
import { navigation } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-[#050813]/90 backdrop-blur-md">
      <div className="container-shell py-12 md:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-[11px] font-mono font-semibold text-cyan-300 mb-4 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              </span>
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>ALL SYSTEMS OPERATIONAL // 2026</span>
            </div>
            <p className="text-base font-bold uppercase tracking-[0.22em] text-gradient-cyan">
              CHEN TECH STUDIO
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              一个个人技术展示与项目记录网站，用来整理网站开发、代码构建、视觉实验、工具资料和学习过程。
            </p>
            <a
              href="mailto:chenyc0507@gmail.com"
              className="group mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-4 py-1.5 text-xs font-mono font-medium text-cyan-300 shadow-2xs hover:border-cyan-400/50 hover:bg-cyan-950/40 hover:text-cyan-200 transition-all"
            >
              <Mail className="h-3.5 w-3.5 text-cyan-400" />
              <span>chenyc0507@gmail.com</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative py-0.5 hover:text-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 md:justify-end">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-300 transition-colors"
              >
                粤ICP备2026053642号
              </a>
              <span className="opacity-40 hidden md:inline">|</span>
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
      </div>
    </footer>
  );
}
