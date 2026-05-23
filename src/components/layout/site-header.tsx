"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Hand, Sparkles } from "lucide-react";
import { navigation, siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 max-w-full overflow-x-clip">
      <div className="container-shell pt-4">
        <div className="glass-panel flex min-w-0 items-center justify-between gap-3 rounded-[22px] px-3 py-3 md:rounded-[24px] md:px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 md:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-900/8 bg-white/70 shadow-sm md:h-10 md:w-10">
              <Sparkles className="h-4 w-4 text-brand-cyan" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold tracking-[0.16em] text-foreground/90 sm:text-sm sm:tracking-[0.2em]">
                {siteConfig.title}
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">个人技术展示与项目记录</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigation
              .filter((item) => item.href !== "/gesture-interactive.html")
              .map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex min-w-[84px] justify-center rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
                      active && "bg-slate-900/[0.06] text-foreground shadow-sm",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/gesture-interactive.html"
              target="_blank"
              rel="noopener noreferrer"
              className="relative hidden items-center gap-1.5 overflow-hidden rounded-full border border-brand-violet/20 bg-brand-violet/5 px-3.5 py-2 text-sm font-medium text-brand-violet shadow-sm transition-all duration-300 hover:scale-105 hover:border-brand-violet/40 hover:bg-brand-violet/10 hover:shadow-md hover:shadow-brand-violet/5 md:flex"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-violet opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-violet"></span>
              </span>
              <Hand className="h-3.5 w-3.5 animate-pulse text-brand-violet" />
              <span>手势互动</span>
            </a>

            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full border border-slate-900/8 bg-white/70 px-3 py-2 text-sm text-muted-foreground shadow-sm"
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
              aria-label="打开菜单"
            >
              <Command className="h-4 w-4" />
              <span className="hidden sm:inline">菜单</span>
              <span className="hidden rounded-full border border-slate-900/8 px-2 py-0.5 text-xs text-foreground/70 sm:inline">
                Ctrl K
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
