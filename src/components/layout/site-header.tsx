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
} from "lucide-react";
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
  const [experimentsOpen, setExperimentsOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const experimentsMenuRef = useRef<HTMLDivElement>(null);

  // 监听点击外部关闭所有下拉菜单
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

      // 向下滚动超过 60px 时隐藏，向上滚动时滑出恢复
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
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // 路由跳转时自动收起所有浮层
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMobileMenuOpen(false);
      setUserMenuOpen(false);
      setExperimentsOpen(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  const isHome = pathname === "/";
  const showGlass = !isHome || isScrolled || mobileMenuOpen;

  // 判断是否处于特色实验路由下
  const isExperimentActive = pathname.startsWith("/experiments") || pathname.startsWith("/gesture");

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 max-w-full transition-transform duration-300 ease-in-out",
          !isVisible && !mobileMenuOpen ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className="container-shell pt-3 sm:pt-4">
          <div
            className={cn(
              "flex min-w-0 items-center justify-between gap-2 sm:gap-3 rounded-[22px] px-2.5 py-2 sm:px-4 sm:py-2.5 md:rounded-[24px] transition-all duration-500",
              showGlass
                ? "glass-panel border-white/10 shadow-[0_16px_36px_rgba(0,0,0,0.6)]"
                : "bg-transparent border-transparent shadow-none"
            )}
          >
            {/* 左侧 Brand Logo 与站点名称 */}
            <Link href="/" className="flex min-w-0 shrink items-center gap-2 md:gap-3 group">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/50 shadow-[0_0_16px_rgba(0,240,255,0.25)] group-hover:scale-105 group-hover:border-cyan-400/50 transition-all sm:h-9 sm:w-9">
                <Sparkles className="h-4 w-4 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              </span>
              <div className="min-w-0">
                <p className="whitespace-nowrap text-xs font-bold tracking-[0.14em] text-white sm:text-sm sm:tracking-[0.18em] flex items-center gap-1.5">
                  <span className="text-gradient-cyan">{siteConfig.title}</span>
                  <span className="hidden sm:inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                </p>
                <p className="hidden text-[11px] text-slate-400 md:block truncate">
                  个人技术展示与项目记录
                </p>
              </div>
            </Link>

            {/* 桌面端居中主导航体系（>= xl 屏幕展示，呼吸感充裕） */}
            <nav className="hidden shrink-0 items-center gap-1 xl:flex" aria-label="主导航">
              {navigation
                .filter((item) =>
                  ["/", "/chat", "/workflow", "/market", "/projects", "/build-log", "/news"].includes(item.href)
                )
                .map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative inline-flex shrink-0 whitespace-nowrap justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                        active
                          ? "text-cyan-300 font-semibold"
                          : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="header-nav-pill"
                          className="absolute inset-0 rounded-full bg-cyan-500/15 border border-cyan-500/35 shadow-[0_0_16px_rgba(0,240,255,0.2)]"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  );
                })}

              {/* 前沿极客实验室下拉胶囊 */}
              <div className="relative" ref={experimentsMenuRef}>
                <button
                  type="button"
                  onClick={() => setExperimentsOpen(!experimentsOpen)}
                  className={cn(
                    "inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer",
                    experimentsOpen || isExperimentActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_14px_rgba(0,240,255,0.25)]"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                  )}
                  aria-expanded={experimentsOpen}
                  aria-label="前沿极客实验室"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                  </span>
                  <span>极客工坊</span>
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
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0b1120]/95 backdrop-blur-2xl p-2.5 shadow-[0_24px_64px_rgba(0,0,0,0.8)] z-50"
                  >
                    <div className="px-2.5 py-1.5 border-b border-white/10 mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        高可用工坊与交互空间 (9款)
                      </span>
                      <Link
                        href="/experiments"
                        onClick={() => setExperimentsOpen(false)}
                        className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5"
                      >
                        <span>门户大厅</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>

                    <div className="space-y-1 max-h-[380px] overflow-y-auto no-scrollbar pr-0.5">
                      <Link
                        href="/experiments/ziwei"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-amber-500/15 hover:border hover:border-amber-500/30 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 group-hover:scale-105 transition-transform">
                          <Compass className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-amber-200">
                              天纪 · 紫微斗数
                            </span>
                            <span className="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-1.5 rounded font-bold">
                              AI 命盘/合盘
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            倪海厦《天纪》排盘、双人合盘与古籍库
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/image-studio"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-purple-500/15 hover:border hover:border-purple-500/30 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 group-hover:scale-105 transition-transform">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-purple-200">
                              AI 生图工坊
                            </span>
                            <span className="text-[9px] font-mono text-purple-300 bg-purple-500/20 px-1.5 rounded font-bold">
                              FLUX 极速
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            Cloudflare & Pollinations 智能双通道
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/gods-eye"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-cyan-500/15 hover:border hover:border-cyan-500/30 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:scale-105 transition-transform">
                          <Globe2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-cyan-200">
                              上帝之眼
                            </span>
                            <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 rounded">
                              3D 遥感
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            Cesium 4K 全球遥感与态势感知
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/fluid"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-violet-500/15 hover:border hover:border-violet-500/30 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-violet-500/20 text-violet-300 group-hover:scale-105 transition-transform">
                          <Droplets className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-violet-200">
                              霓虹流体
                            </span>
                            <span className="text-[9px] font-mono text-violet-300 bg-violet-500/20 px-1.5 rounded">
                              物理动力学
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            触控丝绸光束与流体涡流画布
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/cyber-hack"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-emerald-500/15 hover:border hover:border-emerald-500/30 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 group-hover:scale-105 transition-transform">
                          <Terminal className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-emerald-200">
                              赛博黑客终端
                            </span>
                            <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 rounded">
                              攻防渗透
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            拟真命令行节点漏洞爆破与数字雨
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/ai-town"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-amber-500/15 hover:border hover:border-amber-500/30 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 group-hover:scale-105 transition-transform">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-amber-200">
                              AI 智能小镇
                            </span>
                            <span className="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-1.5 rounded">
                              像素沙盒
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            NPC 居民自主漫游八卦与全镇广播
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/geo-detective"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-sky-500/15 hover:border hover:border-sky-500/30 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-sky-500/20 text-sky-300 group-hover:scale-105 transition-transform">
                          <Compass className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-sky-200">
                              地理大侦探
                            </span>
                            <span className="text-[9px] font-mono text-sky-300 bg-sky-500/20 px-1.5 rounded">
                              街景探案
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            实景环境勘查与世界地图插旗竞猜
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/gesture"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-violet-500/15 hover:border hover:border-violet-500/30 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-violet-500/20 text-violet-300 group-hover:scale-105 transition-transform">
                          <Hand className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-violet-200">
                              手势互动
                            </span>
                            <span className="text-[9px] font-mono text-violet-300 bg-violet-500/20 px-1.5 rounded">
                              视觉跟踪
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            摄像头手掌张开与拳头力场粒子
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/pelican"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-200 hover:bg-cyan-500/15 hover:border hover:border-cyan-500/30 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:scale-105 transition-transform">
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white group-hover:text-cyan-200">
                              鹈鹕盲测
                            </span>
                            <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 rounded">
                              ARENA
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            大语言模型性能双盲对抗竞技
                          </p>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </nav>

            {/* 右侧操作区：全站统一控制 */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {/* 全局账户登录 / 用户状态胶囊 */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 p-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.2)] hover:bg-cyan-900/50 hover:border-cyan-400 transition-all cursor-pointer"
                    aria-label={`用户菜单: ${user.username}`}
                    title={user.username}
                  >
                    <span className="flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-[10px] font-bold text-white uppercase shadow-2xs">
                      {user.username.slice(0, 1)}
                    </span>
                    <span className="hidden sm:inline max-w-[80px] md:max-w-[110px] truncate font-mono text-xs text-white">
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
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#0b1120]/95 backdrop-blur-2xl p-2.5 shadow-[0_24px_64px_rgba(0,0,0,0.85)] z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                      {/* 用户头部信息卡片 */}
                      <div className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-slate-900 to-cyan-950/60 border border-cyan-500/20 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-xs font-bold text-white uppercase shadow-2xs">
                            {user.username.slice(0, 1)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white truncate font-mono text-sm leading-tight">
                              {user.username}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                              <span className="text-[10px] text-emerald-300 font-medium">全站专属资产已绑定</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 核心工作流与功能矩阵 */}
                      <div className="py-1 space-y-0.5">
                        <p className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          核心工作台与资产
                        </p>
                        <Link
                          href="/workflow"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-200 hover:bg-cyan-500/15 hover:text-cyan-200 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">自动化小说与分镜工作流</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">书架</span>
                        </Link>
                        <Link
                          href="/experiments/ziwei"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-200 hover:bg-amber-500/15 hover:text-amber-200 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Compass className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">天纪 · 紫微斗数与合盘</span>
                          </div>
                          <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-bold">无限次</span>
                        </Link>
                        <Link
                          href="/experiments/image-studio"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-200 hover:bg-purple-500/15 hover:text-purple-200 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">AI 创意视觉与生图工坊</span>
                          </div>
                          <span className="text-[10px] text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded font-bold">FLUX</span>
                        </Link>
                        <Link
                          href="/chat"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-200 hover:bg-cyan-500/15 hover:text-cyan-200 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Bot className="h-3.5 w-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">贾维斯专属 AI 对话记忆</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">记忆</span>
                        </Link>
                        <Link
                          href="/market"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-200 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">量化投研与策略中心</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">多空</span>
                        </Link>
                        <Link
                          href="/gesture"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-200 hover:bg-violet-500/15 hover:text-violet-200 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Hand className="h-3.5 w-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">3D 手势视效空间</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">交互</span>
                        </Link>
                      </div>

                      {/* 退出登录操作区 */}
                      <div className="mt-1.5 pt-1.5 border-t border-white/10">
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
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 font-medium">
                            <LogOut className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            <span>退出登录</span>
                          </div>
                          <span className="text-[10px] text-rose-300">注销会话</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isLoading ? (
                <div className="h-8 w-8 sm:w-20 rounded-full bg-slate-800 animate-pulse border border-white/10 shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 h-8 w-8 sm:h-auto sm:w-auto sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-200 shadow-2xs hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-cyan-950/40 transition-all cursor-pointer"
                  title="登录 / 注册"
                  aria-label="登录或注册"
                >
                  <User className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">登录 / 注册</span>
                </button>
              )}

              {/* 搜索命令面板按钮 */}
              <button
                type="button"
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 h-8 w-8 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 text-sm text-slate-300 shadow-2xs hover:text-white hover:border-white/20 hover:bg-slate-800/80 transition-all"
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
                aria-label="打开搜索菜单"
                title="搜索与快捷指令"
              >
                <Command className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />
                <span className="hidden sm:inline text-xs font-medium">菜单</span>
                <span className="hidden rounded-full border border-white/10 bg-white/5 px-1.5 py-0.2 text-[10px] text-slate-400 sm:inline">
                  Ctrl K
                </span>
              </button>

              {/* 移动端/平板端汉堡抽屉菜单按钮 */}
              <button
                type="button"
                className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900/60 text-slate-300 shadow-2xs hover:text-white xl:hidden"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={mobileMenuOpen ? "关闭导航" : "展开导航"}
                aria-expanded={mobileMenuOpen}
                aria-controls="site-navigation"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* 移动端全站导航下拉抽屉 */}
          {mobileMenuOpen && (
            <div
              id="site-navigation"
              className="glass-panel border-white/10 mt-2 max-h-[75dvh] overflow-y-auto rounded-[22px] p-3 shadow-2xl transition-all duration-300 xl:hidden"
            >
              {/* 核心主页面 */}
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  全站主导航
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {navigation
                    .filter((item) =>
                      ["/", "/chat", "/workflow", "/market", "/projects", "/build-log", "/news", "/about"].includes(
                        item.href
                      )
                    )
                    .map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                            active
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                              : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
              </div>

              {/* 前沿极客工坊 */}
              <div className="mb-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <FlaskConical className="h-3 w-3 text-cyan-400" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      极客工坊 (9款高互动实验)
                    </p>
                  </div>
                  <Link
                    href="/experiments"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[10px] text-cyan-400 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <span>全部</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <Link
                    href="/experiments/ziwei"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 border border-amber-500/25 sm:col-span-2"
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">天纪 · 紫微斗数 (AI 命盘精批与双人合盘)</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 font-bold shrink-0">天纪</span>
                  </Link>

                  <Link
                    href="/experiments/image-studio"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 border border-purple-500/25 sm:col-span-2"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">AI 创意视觉与生图工坊 (FLUX 极速生图)</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-purple-500/20 font-bold shrink-0">FLUX</span>
                  </Link>

                  <Link
                    href="/experiments/gods-eye"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 border border-cyan-500/25"
                  >
                    <Globe2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">上帝之眼 (Cesium 3D 遥感)</span>
                  </Link>

                  <Link
                    href="/experiments/fluid"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 border border-violet-500/25"
                  >
                    <Droplets className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    <span className="truncate">霓虹流体 (WebGL 涡流)</span>
                  </Link>

                  <Link
                    href="/experiments/cyber-hack"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 border border-emerald-500/25"
                  >
                    <Terminal className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">赛博黑客终端 (攻防渗透)</span>
                  </Link>

                  <Link
                    href="/experiments/pelican"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium bg-sky-500/10 text-sky-200 hover:bg-sky-500/20 border border-sky-500/25"
                  >
                    <Trophy className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">鹈鹕盲测 (大模型竞技)</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
