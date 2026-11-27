import { HoverPrefetchLink } from "@/components/shared/hover-prefetch-link";
import { Sparkles, ArrowUpRight, Mail } from "lucide-react";
import { navigation } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-[#D8D8E4] bg-[#FFFFFF]/90 backdrop-blur-sm">
      <div className="container-shell py-12 md:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#184120] bg-[#042328] px-3 py-1 text-[11px] font-mono font-semibold text-[#E1F209] mb-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#33DD18]" />
              </span>
              <Sparkles className="h-3 w-3" />
              <span>STUDIO v3.0 · ALL SYSTEMS OPERATIONAL // 2026</span>
            </div>
            <p className="text-base font-bold uppercase tracking-[0.22em] text-[#0F0F0F]">
              CHEN TECH STUDIO
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#263844]">
              一个个人技术展示与项目记录网站，用来整理网站开发、代码构建、视觉实验、工具资料和学习过程。
            </p>
            <a
              href="mailto:chenyc0507@gmail.com"
              className="group mt-4 inline-flex items-center gap-2 rounded-full border border-[#D8D8E4] bg-[#F8F8F4] px-4 py-1.5 text-xs font-mono font-medium text-[#042328] shadow-2xs hover:border-[#042328] hover:bg-[#E0E7D9]/60"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>chenyc0507@gmail.com</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#263844]">
              {navigation.map((item) => (
                <HoverPrefetchLink
                  key={item.href}
                  href={item.href}
                  className="relative py-0.5 hover:text-[#042328] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#042328] after:transition-all after:duration-300 hover:after:w-full"
                >
                  {item.label}
                </HoverPrefetchLink>
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
