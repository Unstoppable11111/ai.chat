import type { Metadata } from "next";
import { Mail, MessagesSquare, Sparkles, Workflow, Terminal, Cpu, Layers, ArrowUpRight } from "lucide-react";
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
    text: "目前重点在三个方向：全栈 AI 与 RAG 系统、量化投研工作台，以及内容系统和学习资料的结构化管理。",
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
    accent: "text-cyan-300 bg-cyan-950/50 border-cyan-500/35",
  },
  {
    icon: Workflow,
    badge: "AUTOMATION",
    title: "工作流设计",
    text: "不只做页面，也把背后的生产流程、内容结构和全链路自动化一起理顺。",
    accent: "text-purple-300 bg-purple-950/50 border-purple-500/35",
  },
  {
    icon: MessagesSquare,
    badge: "AGILE SYNC",
    title: "合作方式",
    text: "偏直接、清晰、快迭代式协作，不拖泥带水，以可见工程产出为第一度量。",
    accent: "text-emerald-300 bg-emerald-950/50 border-emerald-500/35",
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          level={1}
          eyebrow="PROFILE // ENGINEERING MATRIX"
          title="关于我 · Engineer Dossier"
          description="这不是一页传统简历，更像是一份关于我如何思考、如何构建、如何实验的工程画像与系统控制台。"
        />

        <div className="grid items-stretch gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Reveal once>
            <section className="arch-frame relative flex h-full flex-col justify-between overflow-hidden rounded-xl">
              <div className="hud-header">
                <span className="text-cyan-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  ARCHITECTURE & PHILOSOPHY
                </span>
                <span>STATUS: ACTIVE</span>
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-base sm:text-xl font-bold leading-relaxed text-white">
                    我希望这个网站传递的不是“我会什么”，而是“我现在正在把什么做出来”。
                  </p>
                  <p className="mt-3 text-sm leading-8 text-slate-300">
                    如果你正在了解我的项目、学习记录和全栈开发过程，这里基本就是最真实的代码与设计切面。
                  </p>

                  <div className="mt-5 rounded-lg border border-cyan-500/30 bg-cyan-950/25 p-4 text-xs sm:text-sm leading-relaxed text-slate-300">
                    <span className="font-semibold text-cyan-300">技术规范提示：</span>
                    本网站展示个人技术项目，并提供 AI 对话与需要登录的个人投研工作台。账户数据和外部模型处理范围见
                    <Link href="/privacy" className="underline text-cyan-300 ml-1 hover:text-white font-medium">
                      隐私与数据说明
                    </Link>
                    。
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {highlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="rounded-lg border border-white/10 bg-[#04060b]/80 p-4 hover:border-cyan-400/40 transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`p-2 rounded-lg border ${item.accent}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">
                            {item.badge}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{item.title}</h3>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.08} once>
            <aside className="arch-frame relative flex h-full flex-col justify-between overflow-hidden rounded-xl">
              <div className="hud-header">
                <span className="text-emerald-400">COMM CHANNEL // DIRECT</span>
                <span>OPEN TO CONNECT</span>
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    一起做点有质感的东西
                  </h2>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-300">
                    如果你想聊个人项目、全栈开发、AI 工作流、着色器视觉系统，或者只是想探讨一个刚刚萌芽的技术方案，欢迎随时通过邮件联系。
                  </p>

                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="mt-6 group inline-flex items-center gap-2.5 rounded-lg bg-cyan-400 text-slate-950 px-5 py-3 text-xs sm:text-sm font-bold hover:bg-cyan-300 transition-all"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="font-mono">{siteConfig.email}</span>
                    <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>

                <div className="mt-8 space-y-2.5 pt-6 border-t border-white/10 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#04060b]/80 border border-white/10">
                    <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>偏好合作：短周期、快迭代、以运行代码与可用界面检验成效。</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#04060b]/80 border border-white/10">
                    <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>适配方向：个人工程工作台、视觉实验室、自动化生产流。</span>
                  </div>
                </div>
              </div>
            </aside>
          </Reveal>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4 font-mono text-xs text-cyan-300 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>CORE DIMENSIONS // 核心思考维度</span>
          </div>

          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sections.map((section, index) => (
              <Reveal key={section.title} delay={index * 0.04} once>
                <section className="arch-frame group flex h-full flex-col justify-between rounded-xl overflow-hidden">
                  <div className="hud-header">
                    <span className="text-cyan-300">{section.id}</span>
                    <span>{section.tag}</span>
                  </div>
                  <div className="p-5 flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {section.title}
                    </h3>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-400">
                      {section.text}
                    </p>
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
