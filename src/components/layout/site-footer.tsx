import Link from "next/link";
import { navigation } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-900/8">
      <div className="container-shell flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-foreground/90">
            CHEN TECH STUDIO
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            一个个人技术展示与项目记录网站，用来整理网站开发、代码构建、视觉实验、工具资料和学习过程。
          </p>
          <a
            href="mailto:chenyc0507@gmail.com"
            className="mt-3 inline-block text-sm text-brand-cyan hover:text-foreground"
          >
            chenyc0507@gmail.com
          </a>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </div>
          <a
            href="https://beian.mps.gov.cn/#/query/webSearch?code=44030002012696"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            粤公网安备 44030002012696号
          </a>
        </div>
      </div>
      <div className="container-shell pb-6 text-center text-xs text-muted-foreground">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
        >
          粤ICP备2026053642号
        </a>
      </div>
    </footer>
  );
}
