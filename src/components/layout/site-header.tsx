"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    const handleScroll = () => {
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
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
          "fixed inset-x-0 top-0 z-50 max-w-full overflow-x-clip transition-transform duration-300 ease-in-out",
          !isVisible && !mobileMenuOpen ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className="container-shell pt-3 sm:pt-4">
          <div
            className={cn(
              "flex min-w-0 items-center justify-between gap-2 sm:gap-3 rounded-[22px] px-2.5 py-2 sm:px-4 sm:py-2.5 md:rounded-[24px] transition-all duration-500",
              showGlass ? "glass-panel" : "bg-transparent border-transparent shadow-none"
            )}
          >
            {/* 左侧 Brand Logo 与站点名称 */}
            <Link href="/" className="flex min-w-0 shrink items-center gap-2 md:gap-3 group">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-900/8 bg-white/80 shadow-2xs group-hover:scale-105 transition-transform sm:h-9 sm:w-9">
                <Sparkles className="h-4 w-4 text-brand-cyan" />
              </span>
              <div className="min-w-0">
                <p className="whitespace-nowrap text-xs font-bold tracking-[0.14em] text-foreground/90 sm:text-sm sm:tracking-[0.18em]">
                  {siteConfig.title}
                </p>
                <p className="hidden text-[11px] text-muted-foreground md:block truncate">
                  个人技术展示与项目记录
                </p>
              </div>
            </Link>

            {/* 桌面端居中主导航体系（>= xl 屏幕展示，呼吸感充裕） */}
            <nav className="hidden shrink-0 items-center gap-0.5 xl:flex" aria-label="主导航">
              {navigation
                .filter((item) => ["/", "/chat", "/workflow", "/projects", "/build-log", "/news"].includes(item.href))
                .map((item) => {
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex shrink-0 whitespace-nowrap justify-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-slate-900/[0.08] text-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:bg-slate-900/[0.04] hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}

              {/* 前沿极客实验室下拉胶囊 */}
              <div className="relative" ref={experimentsMenuRef}>
                <button
                  type="button"
                  onClick={() => setExperimentsOpen(!experimentsOpen)}
                  className={cn(
                    "inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all cursor-pointer",
                    experimentsOpen || isExperimentActive
                      ? "bg-sky-500/10 text-sky-700 border border-sky-500/30 font-semibold shadow-2xs"
                      : "text-muted-foreground hover:bg-slate-900/[0.04] hover:text-foreground"
                  )}
                  aria-expanded={experimentsOpen}
                  aria-label="前沿极客实验室"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                  </span>
                  <span>极客工坊</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-muted-foreground transition-transform duration-200",
                      experimentsOpen && "rotate-180"
                    )}
                  />
                </button>

                {experimentsOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        前沿交互与空间玩具 (7款)
                      </span>
                      <Link
                        href="/experiments"
                        onClick={() => setExperimentsOpen(false)}
                        className="text-[10px] font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-0.5"
                      >
                        <span>门户大厅</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>

                    <div className="space-y-1 max-h-[360px] overflow-y-auto no-scrollbar pr-0.5">
                      <Link
                        href="/experiments/gods-eye"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-sky-50/80 hover:text-sky-900 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-sky-100/60 text-sky-700 group-hover:scale-105 transition-transform">
                          <Globe2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-sky-900">
                              上帝之眼
                            </span>
                            <span className="text-[9px] font-mono text-sky-600 bg-sky-100/50 px-1.5 rounded">
                              3D 遥感
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            Cesium 4K 全球遥感与态势感知
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/fluid"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-purple-50/80 hover:text-purple-900 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-purple-100/60 text-purple-700 group-hover:scale-105 transition-transform">
                          <Droplets className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-purple-900">
                              霓虹流体
                            </span>
                            <span className="text-[9px] font-mono text-purple-600 bg-purple-100/50 px-1.5 rounded">
                              物理动力学
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            触控丝绸光束与流体涡流画布
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/cyber-hack"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-900 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-emerald-100/60 text-emerald-700 group-hover:scale-105 transition-transform">
                          <Terminal className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-emerald-900">
                              赛博黑客终端
                            </span>
                            <span className="text-[9px] font-mono text-emerald-600 bg-emerald-100/50 px-1.5 rounded">
                              攻防渗透
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            拟真命令行节点漏洞爆破与数字雨
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/ai-town"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-amber-50/80 hover:text-amber-900 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-amber-100/60 text-amber-700 group-hover:scale-105 transition-transform">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-amber-900">
                              AI 智能小镇
                            </span>
                            <span className="text-[9px] font-mono text-amber-600 bg-amber-100/50 px-1.5 rounded">
                              像素沙盒
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            NPC 居民自主漫游八卦与全镇广播
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/geo-detective"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-sky-50/80 hover:text-sky-900 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-sky-100/60 text-sky-700 group-hover:scale-105 transition-transform">
                          <Compass className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-sky-900">
                              地理大侦探
                            </span>
                            <span className="text-[9px] font-mono text-sky-600 bg-sky-100/50 px-1.5 rounded">
                              街景探案
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            实景环境勘查与世界地图插旗竞猜
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/gesture"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-violet-50/80 hover:text-violet-900 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-violet-100/60 text-brand-violet group-hover:scale-105 transition-transform">
                          <Hand className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-violet-900">
                              手势互动
                            </span>
                            <span className="text-[9px] font-mono text-violet-600 bg-violet-100/50 px-1.5 rounded">
                              视觉跟踪
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            摄像头手掌张开与拳头力场粒子
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/experiments/pelican"
                        onClick={() => setExperimentsOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:bg-cyan-50/80 hover:text-cyan-900 transition-colors group"
                      >
                        <div className="p-1 rounded-lg bg-cyan-100/60 text-cyan-700 group-hover:scale-105 transition-transform">
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-cyan-900">
                              鹈鹕盲测
                            </span>
                            <span className="text-[9px] font-mono text-cyan-600 bg-cyan-100/50 px-1.5 rounded">
                              ARENA
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            大语言模型性能双盲对抗竞技
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* 右侧操作区：全站统一控制（移动端小巧紧凑防爆边，桌面端舒展大方） */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {/* 全局账户登录 / 用户状态胶囊 */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 p-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs hover:bg-cyan-500/20 transition-all cursor-pointer"
                    aria-label={`用户菜单: ${user.username}`}
                    title={user.username}
                  >
                    <span className="flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-[10px] font-bold text-white uppercase shadow-2xs">
                      {user.username.slice(0, 1)}
                    </span>
                    <span className="hidden sm:inline max-w-[80px] md:max-w-[110px] truncate font-mono text-xs">
                      {user.username}
                    </span>
                    <ChevronDown
                      className={cn(
                        "hidden sm:inline h-3.5 w-3.5 text-slate-500 transition-transform duration-200",
                        userMenuOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                      {/* 用户头部信息卡片 */}
                      <div className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-slate-50 to-cyan-50/60 border border-slate-100 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-xs font-bold text-white uppercase shadow-2xs">
                            {user.username.slice(0, 1)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 truncate font-mono text-sm leading-tight">
                              {user.username}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[10px] text-emerald-700 font-medium">全站专属资产已绑定</span>
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
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-700 hover:bg-cyan-50/80 hover:text-cyan-800 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-cyan-600 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">自动化小说与分镜工作流</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">书架</span>
                        </Link>
                        <Link
                          href="/chat"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-700 hover:bg-cyan-50/80 hover:text-cyan-800 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Bot className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">贾维斯专属 AI 对话记忆</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">记忆</span>
                        </Link>
                        <Link
                          href="/market"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-700 hover:bg-cyan-50/80 hover:text-cyan-800 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">量化投研与策略中心</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">多空</span>
                        </Link>
                        <Link
                          href="/gesture"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-700 hover:bg-cyan-50/80 hover:text-cyan-800 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Hand className="h-3.5 w-3.5 text-violet-600 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">3D 手势视效空间</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">交互</span>
                        </Link>
                      </div>

                      {/* 退出登录操作区 */}
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100">
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
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 font-medium">
                            <LogOut className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            <span>退出登录</span>
                          </div>
                          <span className="text-[10px] text-rose-400 group-hover:text-rose-600">注销会话</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isLoading ? (
                <div className="h-8 w-8 sm:w-20 rounded-full bg-slate-200/40 animate-pulse border border-slate-200/40 shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-900/8 bg-white/70 h-8 w-8 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-2xs hover:border-cyan-500/40 hover:text-cyan-700 transition-all cursor-pointer"
                  title="登录 / 注册"
                  aria-label="登录或注册"
                >
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">登录 / 注册</span>
                </button>
              )}

              {/* 搜索命令面板按钮：移动端纯圆形图标，桌面端展开快捷键 */}
              <button
                type="button"
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-900/8 bg-white/70 h-8 w-8 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 text-sm text-muted-foreground shadow-2xs hover:text-foreground hover:bg-white"
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-menu"))}
                aria-label="打开搜索菜单"
                title="搜索与快捷指令"
              >
                <Command className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs font-medium">菜单</span>
                <span className="hidden rounded-full border border-slate-900/8 px-1.5 py-0.2 text-[10px] text-foreground/70 sm:inline">
                  Ctrl K
                </span>
              </button>

              {/* 移动端/平板端汉堡抽屉菜单按钮（仅在 < xl 时出现，彻底释放桌面端空间） */}
              <button
                type="button"
                className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-slate-900/8 bg-white/70 text-muted-foreground shadow-2xs hover:text-foreground xl:hidden"
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
              className="glass-panel mt-2 max-h-[75dvh] overflow-y-auto rounded-[22px] p-3 shadow-xl transition-all duration-300 xl:hidden"
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
                              ? "bg-slate-900/[0.08] text-foreground font-semibold"
                              : "text-muted-foreground hover:bg-slate-900/[0.04] hover:text-foreground"
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
              </div>

              {/* 前沿极客工坊 */}
              <div className="mb-2 pt-2 border-t border-slate-900/8">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <FlaskConical className="h-3 w-3 text-sky-600" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      极客工坊 (7款高互动实验)
                    </p>
                  </div>
                  <Link
                    href="/experiments"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[10px] text-sky-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <span>全部</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <Link
                    href="/experiments/gods-eye"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium bg-sky-500/5 text-sky-700 hover:bg-sky-500/10 border border-sky-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">上帝之眼 (3D 遥感)</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-sky-500/10 shrink-0">3D</span>
                  </Link>

                  <Link
                    href="/experiments/fluid"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium bg-purple-500/5 text-purple-700 hover:bg-purple-500/10 border border-purple-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <Droplets className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">霓虹流体 (物理粒子)</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-purple-500/10 shrink-0">PHYS</span>
                  </Link>

                  <Link
                    href="/experiments/cyber-hack"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">赛博黑客 (渗透终端)</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/10 shrink-0">HACK</span>
                  </Link>

                  <Link
                    href="/experiments/ai-town"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 border border-amber-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">AI 智能小镇 (像素沙盒)</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-amber-500/10 shrink-0">AGENT</span>
                  </Link>

                  <Link
                    href="/experiments/geo-detective"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium bg-sky-500/5 text-sky-700 hover:bg-sky-500/10 border border-sky-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">地理大侦探 (街景寻踪)</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-sky-500/10 shrink-0">GEO</span>
                  </Link>

                  <Link
                    href="/gesture"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium bg-violet-500/5 text-brand-violet hover:bg-violet-500/10 border border-violet-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <Hand className="h-3.5 w-3.5 text-brand-violet shrink-0" />
                      <span className="truncate">手势互动 (视效空间)</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-violet-500/10 shrink-0">VISION</span>
                  </Link>

                  <Link
                    href="/experiments/pelican"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium bg-cyan-500/5 text-cyan-700 hover:bg-cyan-500/10 border border-cyan-500/20 sm:col-span-2"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                      <span className="truncate">鹈鹕盲测 (大模型对抗竞技)</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-cyan-500/10 shrink-0">ARENA</span>
                  </Link>
                </div>
              </div>

              {/* 移动端账户快捷面板 */}
              <div className="pt-2 border-t border-slate-900/8 px-0.5">
                {user ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-white text-[11px] font-bold">
                        {user.username.slice(0, 1)}
                      </span>
                      <span className="font-mono text-xs text-slate-800 truncate max-w-[140px]">
                        {user.username}
                      </span>
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

      {/* 移动端抽屉打开时的全屏背景遮罩（点击即可顺滑关闭） */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs xl:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
