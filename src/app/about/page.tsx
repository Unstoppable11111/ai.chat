import type { Metadata } from "next";
import { Mail, MessagesSquare, Sparkles, Workflow, Terminal, Cpu, Layers, ArrowUpRight, Activity } from "lucide-react";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { siteConfig } from "@/data/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "关于我",
  description: "一个围绕网站开发、项目记录、视觉实验与技术学习展开的个人介绍页面。",
  alternates: { canonical: "/about" },
};

const sections = [
  {
    id: "01",
    tag: "IDENTITY",
    title: "我是谁",
    text: "我在做的不是传统意义上的个人主页，而是一个持续更新的个人技术展示网站。这里会记录我如何用设计和代码，把一个想法推进成页面、项目与学习资料。",
  },
  {
    id: "02",
    tag: "MISSION",
    title: "我在构建什么",
    text: "我正在整理一个个人项目与学习记录系统：一边记录视觉实验和页面开发过程，一边把有效方法沉淀成可复用的资料。这个站点本身，也是持续练习的一部分。",
  },
  {
    id: "03",
    tag: "VALUE",
    title: "我在意什么",
    text: "我更在意能长期复用的结构，而不是一次性的漂亮结果。好的内容、好的界面、好的产品，对我来说都不是孤立作品，而是能不断叠加的系统资产。",
  },
  {
    id: "04",
    tag: "METHOD",
    title: "我怎么工作",
    text: "我的工作节奏偏轻量迭代：先快速验证，再记录过程，再把有效方法抽出来，做成下一轮还能继续用的模块。",
  },
  {
    id: "05",
    tag: "FOCUS",
    title: "现在的重点",
    text: "目前重点在三个方向：网站开发与视觉语言、个人项目与工作台，以及内容系统和学习资料的结构化管理。",
  },
  {
    id: "06",
    tag: "COLLABORATION",
    title: "我开放什么合作",
    text: "如果你在做个人网站、品牌官网、视觉系统，或者独立项目实验，这里会很对路。尤其适合需要把想法整理成可见页面和项目记录的阶段。",
  },
];

const highlights = [
  {
    icon: Sparkles,
    badge: "CREATIVE CODING",
    title: "视觉实验",
    text: "把提示词、构图、光线和品牌气质打磨成可复用的视觉与着色器模块。",
    accent: "text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20",
  },
  {
    icon: Workflow,
    badge: "AUTOMATION",
    title: "工作流设计",
    text: "不只做页面，也把背后的生产流程、内容结构和全链路自动化一起理顺。",
    accent: "text-brand-violet bg-brand-violet/10 border-brand-violet/20",
  },
  {
    icon: MessagesSquare,
    badge: "AGILE SYNC",
    title: "合作方式",
    text: "偏直接、清晰、快迭代式协作，不拖泥带水，以可见工程产出为第一度量。",
    accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageIntro>
        {/* 顶部标题与实时状态雷达 */}
        <div className="relative mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-mono font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan" />
              </span>
              <span>LIVE PROFILE // ENGINEERING MATRIX</span>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-muted-foreground border border-slate-900/10 rounded-full px-3.5 py-1 bg-white/60 backdrop-blur-xs">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <Activity className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
                <span>STATUS: ACTIVE BUILDING</span>
              </span>
              <span className="text-slate-300">|</span>
              <span>DEV VER: 2026.09</span>
            </div>
          </div>

          <SectionHeading
            level={1}
            eyebrow="个人画像与工程哲学"
            title="关于我"
            description="这不是一页传统简历，更像是一份关于我如何思考、如何构建、如何实验的工程画像与系统控制台。"
          />
        </div>

        {/* 核心画像主体与联系卡片 */}
        <div className="grid items-stretch gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Reveal once>
            <section className="glass-panel relative flex h-full flex-col justify-between overflow-hidden rounded-[32px] p-7 sm:p-9 border border-slate-900/10 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
              {/* 背景装饰微发光 */}
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand-cyan/[0.04] blur-[90px] rounded-full pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-4 uppercase tracking-widest">
                  <Terminal className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>ARCHITECTURE & PHILOSOPHY</span>
                </div>

                <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground">
                  我希望这个网站传递的不是“我会什么”，而是“我现在正在把什么做出来”。
                </p>
                <p className="mt-3 text-sm leading-8 text-muted-foreground">
                  如果你正在了解我的项目、学习记录和全栈开发过程，这里基本就是最真实的代码与设计切面。
                </p>

                <div className="mt-5 rounded-2xl border border-brand-cyan/20 bg-brand-cyan/[0.03] p-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">技术规范提示：</span>
                  本网站展示个人技术项目，并提供 AI 对话与需要登录的个人投研工作台。账户数据和外部模型处理范围见
                  <Link href="/privacy" className="underline text-brand-cyan ml-1 hover:text-brand-cyan/80 font-medium">
                    隐私与数据说明
                  </Link>。
                </div>
              </div>

              {/* 三大工程支柱 */}
              <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-3">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Reveal key={item.title} delay={index * 0.05} once>
                      <div className="group flex h-full flex-col justify-between rounded-2xl border border-slate-900/8 bg-white/70 hover:bg-white p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`p-2 rounded-xl border ${item.accent}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                              {item.badge}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-foreground group-hover:text-brand-cyan transition-colors">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.08} once>
            <aside className="glass-panel relative flex h-full flex-col justify-between overflow-hidden rounded-[32px] p-7 sm:p-9 border border-slate-900/10 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
              {/* 背景微光 */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-violet/[0.04] blur-[80px] rounded-full pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono uppercase tracking-[0.24em] text-brand-cyan font-semibold">
                    GET IN TOUCH
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    OPEN TO CONNECT
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  一起做点有质感的东西
                </h2>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  如果你想聊个人项目、全栈开发、品牌官网、着色器视觉系统，或者只是想探讨一个刚刚萌芽的技术方案，欢迎随时通过邮件联系。
                </p>

                <a
                  href={`mailto:${siteConfig.email}`}
                  className="mt-6 group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white px-5 py-3 text-xs sm:text-sm font-semibold shadow-lg shadow-slate-900/10 hover:scale-[1.02] transition-all"
                >
                  <Mail className="h-4 w-4 text-brand-cyan" />
                  <span className="font-mono">{siteConfig.email}</span>
                  <ArrowUpRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>

              <div className="relative z-10 mt-8 space-y-3 pt-6 border-t border-slate-900/5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/[0.03] border border-slate-900/5">
                  <Cpu className="w-4 h-4 text-brand-cyan shrink-0" />
                  <span>偏好合作：短周期、快迭代、以运行代码与可用界面检验成效。</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/[0.03] border border-slate-900/5">
                  <Layers className="w-4 h-4 text-brand-violet shrink-0" />
                  <span>适配方向：个人工程工作台、视觉实验室、自动化生产流。</span>
                </div>
              </div>
            </aside>
          </Reveal>
        </div>

        {/* 6 大工程思考维度卡片矩阵 */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
            <span>CORE DIMENSIONS // 核心思考维度</span>
          </div>

          <div className="grid items-stretch gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sections.map((section, index) => (
              <Reveal key={section.title} delay={index * 0.04} once>
                <section className="glass-panel group relative flex h-full flex-col justify-between rounded-2xl sm:rounded-3xl p-6 border border-slate-900/8 hover:border-brand-cyan/30 hover:shadow-lg hover:shadow-brand-cyan/5 transition-all duration-300 hover:-translate-y-1 bg-white/70 hover:bg-white">
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs font-mono text-muted-foreground">
                      <span className="font-bold text-brand-cyan group-hover:text-brand-violet transition-colors">
                        {section.id}
                      </span>
                      <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                        {section.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-brand-cyan transition-colors">
                      {section.title}
                    </h3>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {section.text}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-900/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>INDEXED</span>
                    <span className="w-2 h-2 rounded-full border border-slate-300 group-hover:border-brand-cyan group-hover:bg-brand-cyan/20 transition-colors" />
                  </div>
                </section>
              </Reveal>
            ))}
          </div>
        </div>
      </PageIntro>
    </PageShell>
  );
}
