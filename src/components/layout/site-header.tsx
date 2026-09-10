"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Hand, Menu, Sparkles, X, User, LogOut, ChevronDown, TrendingUp, Bot } from "lucide-react";
import { navigation, siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isLoading, openAuthModal, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      // 向下滚动且滚动超过 60px 时隐藏，向上滚动时滑出恢复
      if (currentScrollY > 60) {
        if (currentScrollY - lastScrollY > 6) {
          setIsVisible(false);
        } else if (lastScrollY - currentScrollY > 6) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMobileMenuOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  const isHome = pathname === "/";
  const showGlass = !isHome || isScrolled || mobileMenuOpen;

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-50 max-w-full overflow-x-clip transition-transform duration-300 ease-in-out",
      (!isVisible && !mobileMenuOpen) ? "-translate-y-full" : "translate-y-0"
    )}>
      <div className="container-shell pt-4">
        <div className={cn(
          "flex min-w-0 items-center justify-between gap-3 rounded-[22px] px-3 py-3 md:rounded-[24px] md:px-4 transition-all duration-500",
          showGlass ? "glass-panel" : "bg-transparent border-transparent shadow-none"
        )}>
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

          <nav className="hidden shrink-0 items-center gap-0 xl:flex" aria-label="主导航">
            {navigation
              .filter((item) => ["/", "/projects", "/build-log", "/news", "/chat"].includes(item.href))
              .map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex shrink-0 whitespace-nowrap justify-center rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
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

            {/* 全局账户登录 / 用户状态胶囊 */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-sm hover:bg-cyan-500/20 transition-all cursor-pointer"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-[10px] font-bold text-white uppercase shadow-xs">
                    {user.username.slice(0, 1)}
                  </span>
                  <span className="max-w-[70px] sm:max-w-[110px] truncate font-mono text-xs">{user.username}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-slate-500 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[10px] text-muted-foreground">当前已登录账号</p>
                      <p className="font-semibold text-slate-800 truncate font-mono text-sm mt-0.5">{user.username}</p>
                    </div>
                    <div className="py-1 space-y-0.5">
                      <Link
                        href="/market"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-600" />
                        <span>量化投研工作台</span>
                      </Link>
                      <Link
                        href="/chat"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                      >
                        <Bot className="h-3.5 w-3.5 text-cyan-600" />
                        <span>贾维斯专属 AI 记忆</span>
                      </Link>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setUserMenuOpen(false);
                          await logout();
                          if (pathname.startsWith("/market")) {
                            window.location.assign("/market");
                          } else {
                            window.location.reload();
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>退出当前账号</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : isLoading ? (
              <div className="h-8 w-20 rounded-full bg-slate-200/40 animate-pulse border border-slate-200/40 shrink-0" />
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-900/8 bg-white/70 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:border-cyan-500/40 hover:text-cyan-700 transition-all cursor-pointer"
              >
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span>登录 / 注册</span>
              </button>
            )}

            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full border border-slate-900/8 bg-white/70 px-3 py-2 text-sm text-muted-foreground shadow-sm hover:text-foreground"
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
              aria-label="打开搜索菜单"
            >
              <Command className="h-4 w-4" />
              <span className="hidden sm:inline">菜单</span>
              <span className="hidden rounded-full border border-slate-900/8 px-2 py-0.5 text-xs text-foreground/70 sm:inline">
                Ctrl K
              </span>
            </button>

            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-900/8 bg-white/70 text-muted-foreground shadow-sm hover:text-foreground"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "关闭导航" : "展开导航"}
              aria-expanded={mobileMenuOpen}
              aria-controls="site-navigation"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 移动端下拉导航抽屉 */}
        {mobileMenuOpen && (
          <div id="site-navigation" className="glass-panel mt-2 max-h-[70dvh] overflow-y-auto rounded-[20px] p-3 shadow-lg transition-all duration-300">
            <div className="grid grid-cols-2 gap-1.5">
              {navigation.map((item) => {
                const active = pathname === item.href;
                const isExternal = item.href.endsWith(".html");

                if (isExternal) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-brand-violet bg-brand-violet/5 hover:bg-brand-violet/10 transition-colors"
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-violet/10">3D</span>
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-slate-900/[0.08] text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-slate-900/[0.04] hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* 移动端账户快捷面板 */}
            <div className="mt-3 pt-3 border-t border-slate-900/8 px-1">
              {user ? (
                <div className="flex items-center justify-between px-3 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-white text-[11px] font-bold">
                      {user.username.slice(0, 1)}
                    </span>
                    <span className="font-mono text-xs text-slate-800 truncate max-w-[140px]">{user.username}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setMobileMenuOpen(false);
                      await logout();
                      if (pathname.startsWith("/market")) {
                        window.location.assign("/market");
                      } else {
                        window.location.reload();
                      }
                    }}
                    className="text-xs text-rose-600 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>退出</span>
                  </button>
                </div>
              ) : isLoading ? (
                <div className="h-9 w-full rounded-xl bg-slate-200/40 animate-pulse" />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("login");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium text-xs shadow-sm cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>登录 / 注册账号</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
