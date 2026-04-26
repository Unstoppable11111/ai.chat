"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Sparkles } from "lucide-react";
import { navigation, siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="container-shell pt-4">
        <div className="glass-panel flex items-center justify-between rounded-[24px] px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/8 bg-white/70 shadow-sm">
              <Sparkles className="h-4 w-4 text-brand-cyan" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-foreground/90">
                {siteConfig.title}
              </p>
              <p className="text-xs text-muted-foreground">AI 原生个人工作室</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => {
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

          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-slate-900/8 bg-white/70 px-3 py-2 text-sm text-muted-foreground shadow-sm"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
          >
            <Command className="h-4 w-4" />
            <span className="hidden sm:inline">菜单</span>
            <span className="rounded-full border border-slate-900/8 px-2 py-0.5 text-xs text-foreground/70">
              Ctrl K
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
