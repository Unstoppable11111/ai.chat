import Link from "next/link";
import { Sparkles, ArrowUpRight, Mail } from "lucide-react";
import { navigation } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-slate-900/8 bg-white/40 backdrop-blur-sm">
      <div className="container-shell py-12 md:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/20 bg-brand-cyan/8 px-3 py-1 text-[11px] font-mono font-semibold text-brand-cyan mb-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-cyan" />
              </span>
              <Sparkles className="h-3 w-3" />
              <span>ALL SYSTEMS OPERATIONAL // 2026</span>
            </div>
            <p className="text-base font-bold uppercase tracking-[0.22em] text-foreground/95">
              CHEN TECH STUDIO
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              一个个人技术展示与项目记录网站，用来整理网站开发、代码构建、视觉实验、工具资料和学习过程。
            </p>
            <a
              href="mailto:chenyc0507@gmail.com"
              className="group mt-4 inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 px-4 py-1.5 text-xs font-mono font-medium text-brand-cyan shadow-2xs hover:border-brand-cyan/40 hover:bg-white hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>chenyc0507@gmail.com</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative py-0.5 hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-brand-cyan after:transition-all after:duration-300 hover:after:w-full"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2 md:justify-end">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                粤ICP备2026053642号
              </a>
              <span className="opacity-40 hidden md:inline">|</span>
              <a
                href="https://beian.mps.gov.cn/#/query/webSearch?code=44030002012696"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
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
