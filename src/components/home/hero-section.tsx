"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, Bot, Cpu, Hand, Sparkles, TrendingUp } from "lucide-react";
import { HoverPrefetchLink } from "@/components/shared/hover-prefetch-link";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { cn } from "@/lib/utils";

const subscribeDesktop = (callback: () => void) => {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
const getDesktopSnapshot = () => window.matchMedia("(min-width: 768px)").matches;
const getDesktopServerSnapshot = () => false;

const HERO_LINES = [
  { text: "CHEN", accent: false },
  { text: "TECH", accent: false },
  { text: "STUDIO", accent: true },
] as const;

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getDesktopServerSnapshot);
  const enableScrollMotion = !reduceMotion && isDesktop;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [dockInteractive, setDockInteractive] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const titleScale = useTransform(scrollYProgress, [0, 0.72], [1, 0.36]);
  const titleY = useTransform(scrollYProgress, [0, 0.72], ["0vh", "-8vh"]);
  const chromeOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const chromeY = useTransform(scrollYProgress, [0, 0.45], [0, -18]);
  const dockOpacity = useTransform(scrollYProgress, [0.18, 0.48], [0, 1]);
  const dockScale = useTransform(scrollYProgress, [0.18, 0.48], [0.96, 1]);
  const dockLinkY = useTransform(scrollYProgress, [0.24, 0.56], [24, 0]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const next = enableScrollMotion && latest > 0.28;
    setDockInteractive((prev) => (prev === next ? prev : next));
  });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] w-full bg-transparent overflow-x-clip md:min-h-[155vh]"
    >
      {/* Subtle botanical & cool slate architectural ambient highlight */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-8%] left-[18%] w-[64vw] h-[54vh] bg-[radial-gradient(closest-side,rgba(224,231,217,0.55),transparent)]" />
        <div className="absolute top-[18%] right-[-4%] w-[52vw] h-[54vh] bg-[radial-gradient(closest-side,rgba(38,56,68,0.06),transparent)]" />
      </div>

      <div
        className="sticky top-0 h-[100svh] flex flex-col justify-between p-4 sm:p-6 md:h-screen md:p-12 pt-20 sm:pt-28 z-10"
      >
        {/* Top Luminous Info Bar */}
        <motion.div
          style={enableScrollMotion ? { opacity: chromeOpacity, y: chromeY } : undefined}
          className="flex justify-between items-center z-20 w-full max-w-7xl mx-auto pointer-events-none"
        >
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#E0E7D9] bg-[#FFFFFF]/92 px-3.5 py-1.5 shadow-[0_2px_10px_rgba(4,35,40,0.06)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#33DD18] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#33DD18]" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#184120] font-semibold">
              STUDIO OS v4.0 // EDITORIAL SYSTEM
            </span>
          </div>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.28em] text-[#263844] font-mono hidden sm:block">
            BUILD · EXPERIMENT · RECORD
          </p>
        </motion.div>

        {/* Central Hero Block */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 w-full relative">
          {/* Desktop Symmetrical Floating Telemetry Cards */}
          <div className="pointer-events-auto hidden lg:block">
            <HoverPrefetchLink
              href="/market"
              className="absolute left-[5%] top-[16%] flex items-center gap-3 rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF]/95 px-4 py-2.5 shadow-[0_12px_32px_-8px_rgba(4,35,40,0.08)] hover:-translate-y-1 hover:border-[#184120]/40 transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E0E7D9] border border-[#184120]/20 text-[#184120]">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#184120] font-semibold">
                  QUANT ARENA
                </p>
                <p className="text-xs font-semibold text-[#0F0F0F]">三大实盘策略在线</p>
              </div>
            </HoverPrefetchLink>

            <HoverPrefetchLink
              href="/build-log"
              className="absolute right-[5%] top-[18%] flex items-center gap-3 rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF]/95 px-4 py-2.5 shadow-[0_12px_32px_-8px_rgba(4,35,40,0.08)] hover:-translate-y-1 hover:border-[#263844]/40 transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F2F7F9] border border-[#263844]/20 text-[#263844]">
                <Cpu className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#263844] font-semibold">
                  RAG ENGINE
                </p>
                <p className="text-xs font-semibold text-[#0F0F0F]">65+ 深度技术白皮书</p>
              </div>
            </HoverPrefetchLink>

            <HoverPrefetchLink
              href="/workflow"
              className="absolute left-[7%] bottom-[14%] flex items-center gap-3 rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF]/95 px-4 py-2.5 shadow-[0_12px_32px_-8px_rgba(4,35,40,0.08)] hover:-translate-y-1 hover:border-[#042328]/35 transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFFFF2] border border-[#E0E7D9] text-[#282828]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#5C6873] font-semibold">
                  AI WORKFLOW
                </p>
                <p className="text-xs font-semibold text-[#0F0F0F]">小说 & 影视分镜流水线</p>
              </div>
            </HoverPrefetchLink>

            <HoverPrefetchLink
              href="/chat"
              className="absolute right-[7%] bottom-[16%] flex items-center gap-3 rounded-2xl border border-[#E4E4E8] bg-[#FFFFFF]/95 px-4 py-2.5 shadow-[0_12px_32px_-8px_rgba(4,35,40,0.08)] hover:-translate-y-1 hover:border-[#042328] transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#042328] text-[#E1F209]">
                <Bot className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#042328] font-semibold">
                  JARVIS AGENT
                </p>
                <p className="text-xs font-semibold text-[#0F0F0F]">全库知识流式对话</p>
              </div>
            </HoverPrefetchLink>
          </div>

          {/* Main Display Title (Zero interval re-renders, pure GPU staggered reveal) */}
          <motion.h1
            aria-label="CHEN TECH STUDIO"
            style={enableScrollMotion ? { lineHeight: 0.9, scale: titleScale, y: titleY } : { lineHeight: 0.9 }}
            className="text-[16vw] sm:text-[14vw] md:text-[8.8vw] font-semibold tracking-tighter text-foreground text-center uppercase will-change-transform flex flex-col select-none pointer-events-none"
          >
            {HERO_LINES.map((line, idx) => (
              <motion.span
                key={line.text}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{
                  duration: 0.48,
                  delay: idx * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={
                  line.accent
                    ? "block bg-gradient-to-r from-[#042328] via-[#184120] to-[#263844] bg-clip-text text-transparent"
                    : "block text-[#0F0F0F]"
                }
              >
                {line.text}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle & Quick Launch Pills */}
          <motion.div
            style={enableScrollMotion ? { opacity: chromeOpacity, y: chromeY } : undefined}
            className="z-20"
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.48, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 sm:mt-8 flex flex-col items-center gap-3.5"
            >
            <p className="text-[11px] sm:text-xs text-[#263844] font-medium tracking-wide text-center max-w-[320px] sm:max-w-lg">
              个人全栈工程 · A股量化竞技场 · WebGL 交互实验 · RAG 知识库
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-xs sm:max-w-2xl">
              <MagneticButton strength={0.22}>
                <HoverPrefetchLink
                  href="/projects"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E4E4E8] bg-[#FFFFFF] text-[11px] sm:text-xs font-medium text-[#282828] shadow-2xs hover:border-[#184120]/35 hover:bg-[#E0E7D9]/45 hover:text-[#042328] transition-all"
                >
                  <span>精选项目</span>
                </HoverPrefetchLink>
              </MagneticButton>
              <MagneticButton strength={0.22}>
                <HoverPrefetchLink
                  href="/experiments"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E4E4E8] bg-[#FFFFFF] text-[11px] sm:text-xs font-medium text-[#282828] shadow-2xs hover:border-[#263844]/35 hover:bg-[#F2F7F9] hover:text-[#042328] transition-all"
                >
                  <span>极客工坊</span>
                </HoverPrefetchLink>
              </MagneticButton>
              <MagneticButton strength={0.22}>
                <HoverPrefetchLink
                  href="/market"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#042328] bg-[#042328] text-[11px] sm:text-xs font-semibold text-[#FFFFF2] shadow-2xs hover:bg-[#184120] transition-all"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#33DD18]" />
                  <span>量化投研</span>
                </HoverPrefetchLink>
              </MagneticButton>
              <MagneticButton strength={0.22}>
                <HoverPrefetchLink
                  href="/build-log"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E4E4E8] bg-[#FFFFFF] text-[11px] sm:text-xs font-medium text-[#282828] shadow-2xs hover:border-[#184120]/35 hover:bg-[#E0E7D9]/45 hover:text-[#042328] transition-all"
                >
                  <span>技术白皮书</span>
                </HoverPrefetchLink>
              </MagneticButton>
              <MagneticButton strength={0.22}>
                <HoverPrefetchLink
                  href="/gesture"
                  className="shimmer-beam inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E4E4E8] bg-[#FFFFFF] text-[11px] sm:text-xs font-medium text-[#282828] shadow-2xs hover:border-[#263844]/35 hover:bg-[#F2F7F9] hover:text-[#042328] transition-all"
                >
                  <Hand className="h-3 w-3 text-[#263844]" />
                  <span>3D 手势交互</span>
                </HoverPrefetchLink>
              </MagneticButton>
            </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Hint */}
        <motion.div
          style={enableScrollMotion ? { opacity: chromeOpacity, y: chromeY } : undefined}
          className="flex flex-col items-center gap-2 pb-2 z-20"
        >
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#E0E7D9] bg-[#FFFFFF]/95 shadow-2xs">
            <ArrowDown className="h-3 w-3 text-[#184120] animate-bounce" />
            <p className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-[#263844]">
              SCROLL TO EXPLORE
            </p>
          </div>
        </motion.div>

        {/* Luminous Command Dock (Reveals smoothly on desktop scroll) */}
        <motion.div
          style={enableScrollMotion ? { opacity: dockOpacity, scale: dockScale } : { opacity: 0 }}
          className="absolute inset-0 hidden items-center justify-center z-30 pointer-events-none px-4 sm:px-6 md:flex"
        >
          <div className="translate-y-[8vh] container-shell w-full max-w-4xl rounded-3xl border border-[#E0E7D9] bg-[#FFFFFF]/96 p-6 sm:p-8 shadow-[0_24px_72px_-12px_rgba(4,35,40,0.14)]">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
              {[
                { label: "PROJECTS", zh: "项目案例", href: "/projects" },
                { label: "EXPERIMENTS", zh: "极客工坊", href: "/experiments" },
                { label: "WORKFLOW", zh: "内容流", href: "/workflow" },
                { label: "QUANT", zh: "量化投研", href: "/market" },
                { label: "BUILD LOGS", zh: "白皮书", href: "/build-log" },
                { label: "AI CHAT", zh: "智能对话", href: "/chat" },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  style={enableScrollMotion ? { y: dockLinkY } : undefined}
                >
                  <HoverPrefetchLink
                    href={item.href}
                    className={cn(
                      "workspace-link block group rounded-2xl border border-[#E4E4E8] bg-[#F8F8F4] px-3 py-3 hover:border-[#184120]/35 hover:bg-[#E0E7D9]/40 transition-all",
                      dockInteractive ? "pointer-events-auto" : "pointer-events-none"
                    )}
                  >
                    <span className="block text-[10px] font-mono tracking-[0.16em] text-[#5C6873] group-hover:text-[#184120] transition-colors">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-[#042328]">
                      {item.zh}
                    </span>
                  </HoverPrefetchLink>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
