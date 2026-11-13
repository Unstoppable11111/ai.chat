"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Command,
  Hand,
  Menu,
  Sparkles,
  X,
  User,
  LogOut,
  ChevronDown,
  TrendingUp,
  Bot,
  Trophy,
  BookOpen,
  Globe2,
  FlaskConical,
  Droplets,
  Terminal,
  Users,
  Compass,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { navigation, siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

const LAB_MENU_ITEMS = [
  {
    href: "/experiments/ziwei",
    title: "天纪 · 紫微斗数",
    tag: "ASTRO // AI",
    desc: "倪海厦《天纪》排盘、双人合盘与古籍库",
    icon: Compass,
    accent: "text-amber-300 border-amber-500/30 bg-amber-500/15",
  },
  {
    href: "/experiments/image-studio",
    title: "AI 生图工坊",
    tag: "FLUX // 极速",
    desc: "Cloudflare & Pollinations 智能双通道",
    icon: Sparkles,
    accent: "text-purple-300 border-purple-500/30 bg-purple-500/15",
  },
  {
    href: "/experiments/gods-eye",
    title: "上帝之眼",
    tag: "3D // CESIUM",
    desc: "4K 全球卫星遥感与态势感知系统",
    icon: Globe2,
    accent: "text-cyan-300 border-cyan-500/30 bg-cyan-500/15",
  },
  {
    href: "/experiments/fluid",
    title: "霓虹流体",
    tag: "PHYS // WEBGL",
    desc: "Navier-Stokes 触控光束与流体涡流",
    icon: Droplets,
    accent: "text-violet-300 border-violet-500/30 bg-violet-500/15",
  },
  {
    href: "/experiments/cyber-hack",
    title: "赛博黑客终端",
    tag: "NET // TERM",
    desc: "拟真命令行节点探测与数字雨",
    icon: Terminal,
    accent: "text-emerald-300 border-emerald-500/30 bg-emerald-500/15",
  },
  {
    href: "/experiments/ai-town",
    title: "AI 智能小镇",
    tag: "MULTI // AGENT",
    desc: "NPC 居民自主社交漫游与全镇广播",
    icon: Users,
    accent: "text-amber-300 border-amber-500/30 bg-amber-500/15",
  },
  {
    href: "/experiments/geo-detective",
    title: "地理大侦探",
    tag: "GEO // TRACE",
    desc: "实景街景勘查与世界地图插旗竞猜",
    icon: Compass,
    accent: "text-sky-300 border-sky-500/30 bg-sky-500/15",
  },
  {
    href: "/gesture",
    title: "手势互动",
    tag: "CV // PARTICLES",
    desc: "摄像头视觉追踪与力场粒子交互",
    icon: Hand,
    accent: "text-violet-300 border-violet-500/30 bg-violet-500/15",
  },
  {
    href: "/experiments/pelican",
    title: "鹈鹕盲测",
    tag: "LLM // ARENA",
    desc: "大语言模型性能双盲对抗竞技场",
    icon: Trophy,
    accent: "text-cyan-300 border-cyan-500/30 bg-cyan-500/15",
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isLoading, openAuthModal, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [experimentsOpen, setExperimentsOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const experimentsMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭所有下拉菜单
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (experimentsMenuRef.current && !experimentsMenuRef.current.contains(e.target as Node)) {
        setExperimentsOpen(false);
      }
    }
    if (userMenuOpen || experimentsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen, experimentsOpen]);

  // 滚动时智能隐藏/展示 Header
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      if (currentScrollY > 72) {
        if (currentScrollY - lastScrollY > 8) {
          setIsVisible(false);
        } else if (lastScrollY - currentScrollY > 8) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // 路由切换时异步收起菜单
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMobileMenuOpen(false);
      setUserMenuOpen(false);
      setExperimentsOpen(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  const isExperimentActive =
    pathname.startsWith("/experiments") || pathname.startsWith("/gesture");

  const primaryNavItems = navigation.filter((item) =>
    ["/", "/chat", "/workflow", "/market", "/projects", "/build-log", "/news"].includes(item.href)
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 max-w-full transition-transform duration-300 ease-in-out",
        !isVisible && !mobileMenuOpen ? "-translate-y-full" : "translate-y-0"
      )}
    >
      {/* Top Studio OS Telemetry Strip (Desktop) */}
      <div
        className={cn(
          "hidden lg:block border-b border-white/[0.07] bg-[#04060b]/90 backdrop-blur-md transition-all duration-300",
          isScrolled ? "h-0 overflow-hidden border-b-0 opacity-0" : "h-7 opacity-100"
        )}
      >
        <div className="container-shell flex h-7 items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span>SYS.NODE // SHENZHEN</span>
            </span>
            <span className="text-white/15">|</span>
            <span>STUDIO OS v3.0</span>
          </div>
          <div className="flex items-center gap-5 text-slate-500">
            <span className="text-cyan-400/90">RAG: 65+ DOCS</span>
            <span>QUANT: T+1 LIVE</span>
            <span>PIPELINE: 5-STAGE</span>
            <span className="text-slate-300">CMD: CTRL+K</span>
          </div>
        </div>
      </div>

      {/* Main Architectural Command Bar */}
      <div className="container-shell pt-2.5 sm:pt-3">
        <div
          className={cn(
            "arch-frame flex min-w-0 items-center justify-between gap-2 sm:gap-3 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-300",
            isScrolled || mobileMenuOpen
              ? "border-cyan-500/25 bg-[#060913]/95 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
              : "border-white/10 bg-[#070b16]/85"
          )}
        >
          {/* Left Identity Plate */}
          <Link href="/" className="flex min-w-0 shrink items-center gap-2.5 group">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/50 text-cyan-400 shadow-[0_0_14px_rgba(0,240,255,0.2)] group-hover:border-cyan-300 sm:h-9 sm:w-9">
              <Cpu className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            </span>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-xs font-bold tracking-[0.16em] text-white sm:text-sm flex items-center gap-1.5 font-mono">
                <span>{siteConfig.title}</span>
                <span className="hidden sm:inline-block text-[10px] text-cyan-400/80 border border-cyan-500/30 bg-cyan-950/40 px-1.5 py-0.2 rounded">
                  LABS
                </span>
              </p>
              <p className="hidden text-[10px] font-mono uppercase tracking-[0.14em] text-slate-400 md:block truncate">
                AI Engineering · Quant · WebGL
              </p>
            </div>
          </Link>

          {/* Center Indexed Navigation Rail */}
          <nav className="hidden shrink-0 items-center gap-0.5 xl:flex" aria-label="主导航">
            {primaryNavItems.map((item, idx) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "text-cyan-300 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="header-nav-frame"
                      className="absolute inset-0 rounded-lg bg-cyan-500/12 border border-cyan-400/40 shadow-[0_0_16px_rgba(0,240,255,0.16)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 font-mono text-[10px] text-slate-500">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}

            {/* Mega-Menu Trigger: 极客工坊 */}
            <div className="relative ml-1" ref={experimentsMenuRef}>
              <button
                type="button"
                onClick={() => setExperimentsOpen(!experimentsOpen)}
                className={cn(
                  "inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer border",
                  experimentsOpen || isExperimentActive
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/45 font-semibold shadow-[0_0_14px_rgba(0,240,255,0.2)]"
                    : "border-white/10 bg-white/[0.03] text-slate-200 hover:text-white hover:border-white/25"
                )}
                aria-expanded={experimentsOpen}
                aria-label="前沿极客实验室"
              >
                <FlaskConical className="h-3.5 w-3.5 text-cyan-400" />
                <span>极客工坊</span>
                <span className="font-mono text-[10px] text-cyan-400/90">[09]</span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-slate-400 transition-transform duration-200",
                    experimentsOpen && "rotate-180 text-cyan-300"
                  )}
                />
              </button>

              <AnimatePresence>
                {experimentsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-2.5 w-[560px] rounded-xl border border-white/15 bg-[#070b16]/98 backdrop-blur-2xl shadow-[0_28px_80px_rgba(0,0,0,0.9)] z-50 overflow-hidden"
                  >
                    <div className="hud-header">
                      <span className="text-cyan-400">PLAYGROUND MATRIX // 09 INTERACTIVE LABS</span>
                      <Link
                        href="/experiments"
                        onClick={() => setExperimentsOpen(false)}
                        className="text-cyan-300 hover:text-white inline-flex items-center gap-1 font-semibold"
                      >
                        <span>进入大厅</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 p-2.5">
                      {LAB_MENU_ITEMS.map((lab) => {
                        const Icon = lab.icon;
                        return (
                          <Link
                            key={lab.href}
                            href={lab.href}
                            onClick={() => setExperimentsOpen(false)}
                            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-transparent hover:border-white/12 hover:bg-white/[0.04] transition-all group"
                          >
                            <div className={cn("p-1.5 rounded-md border shrink-0 mt-0.5", lab.accent)}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate">
                                  {lab.title}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                  {lab.tag}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">{lab.desc}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right Terminal Action Cluster */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2 py-1.5 sm:px-3 text-xs font-medium text-cyan-200 hover:bg-cyan-900/50 hover:border-cyan-300 transition-all cursor-pointer"
                  aria-label={`用户菜单: ${user.username}`}
                  title={user.username}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-tr from-cyan-500 to-blue-600 text-[10px] font-bold text-white uppercase">
                    {user.username.slice(0, 1)}
                  </span>
                  <span className="hidden sm:inline max-w-[90px] truncate font-mono text-xs text-white">
                    {user.username}
                  </span>
                  <ChevronDown
                    className={cn(
                      "hidden sm:inline h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                      userMenuOpen && "rotate-180 text-cyan-300"
                    )}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-68 rounded-xl border border-white/15 bg-[#070b16]/98 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.9)] z-50 overflow-hidden text-xs">
                    <div className="hud-header">
                      <span className="text-emerald-400">SESSION // ACTIVE</span>
                      <span>USER_NODE</span>
                    </div>
                    <div className="p-2.5 space-y-2">
                      <div className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 text-xs font-bold text-white uppercase">
                          {user.username.slice(0, 1)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate font-mono text-sm">
                            {user.username}
                          </p>
                          <p className="text-[10px] text-emerald-400 font-mono">
                            CLOUD WORKSPACE SYNCED
                          </p>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <Link
                          href="/workflow"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-200 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                            <span>小说与分镜工作流</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">03</span>
                        </Link>
                        <Link
                          href="/experiments/ziwei"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-200 hover:bg-amber-500/10 hover:text-amber-200 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Compass className="h-3.5 w-3.5 text-amber-400" />
                            <span>天纪 · 紫微斗数</span>
                          </span>
                          <span className="text-[10px] font-mono text-amber-400">ASTRO</span>
                        </Link>
                        <Link
                          href="/experiments/image-studio"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-200 hover:bg-purple-500/10 hover:text-purple-200 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                            <span>AI 生图工坊</span>
                          </span>
                          <span className="text-[10px] font-mono text-purple-400">FLUX</span>
                        </Link>
                        <Link
                          href="/chat"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-200 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Bot className="h-3.5 w-3.5 text-cyan-400" />
                            <span>JARVIS 专属对话记忆</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">02</span>
                        </Link>
                        <Link
                          href="/market"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-200 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                            <span>量化投研策略中心</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">04</span>
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-white/10">
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
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <LogOut className="h-3.5 w-3.5" />
                            <span>退出登录</span>
                          </span>
                          <span className="text-[10px] font-mono text-rose-400/70">EXIT</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : isLoading ? (
              <div className="h-8 w-8 sm:w-20 rounded-lg bg-slate-800 animate-pulse border border-white/10 shrink-0" />
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] h-8 px-2.5 sm:px-3 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all cursor-pointer"
                title="登录 / 注册"
                aria-label="登录或注册"
              >
                <User className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline">登录</span>
              </button>
            )}

            <button
              type="button"
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] h-8 px-2.5 sm:px-3 text-xs text-slate-300 hover:text-white hover:border-cyan-400/40 transition-all cursor-pointer"
              onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
              aria-label="打开搜索菜单"
              title="搜索与快捷指令"
            >
              <Command className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-mono text-[11px]">CTRL+K</span>
            </button>

            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-slate-300 hover:text-white xl:hidden cursor-pointer"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "关闭导航" : "展开导航"}
              aria-expanded={mobileMenuOpen}
              aria-controls="site-navigation"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Architectural Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="site-navigation"
            className="arch-frame mt-2 max-h-[75dvh] overflow-y-auto rounded-xl p-3 shadow-2xl xl:hidden"
          >
            <div className="mb-3">
              <p className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em]">
                01 // MAIN MODULES
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {navigation
                  .filter((item) =>
                    ["/", "/chat", "/workflow", "/market", "/projects", "/build-log", "/news", "/about"].includes(
                      item.href
                    )
                  )
                  .map((item, idx) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium border transition-colors",
                          active
                            ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 font-semibold"
                            : "border-white/5 bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        )}
                      >
                        <span>{item.label}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/10">
              <div className="flex items-center justify-between px-2 py-1 mb-1.5">
                <p className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-[0.2em]">
                  02 // INTERACTIVE LABS (09)
                </p>
                <Link
                  href="/experiments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[10px] font-mono text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <span>ALL LABS</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {LAB_MENU_ITEMS.map((lab) => {
                  const Icon = lab.icon;
                  return (
                    <Link
                      key={lab.href}
                      href={lab.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs border border-white/10 bg-white/[0.02] text-slate-200 hover:border-cyan-400/40"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Icon className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{lab.title}</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">{lab.tag}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
