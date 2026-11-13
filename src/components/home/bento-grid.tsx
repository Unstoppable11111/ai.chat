"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";

const items = [
  {
    index: "01",
    href: "/experiments",
    title: "实验记录",
    description: "用于归档网站视觉、页面构建、品牌画面和提示词学习资料的实验记录。",
  },
  {
    index: "02",
    href: "/build-log",
    title: "技术白皮书",
    description: "系统性梳理大模型推理架构、Agent 协议、RAG 混合检索与全栈工程实战报告。",
  },
  {
    index: "03",
    href: "/prompts",
    title: "学习笔记",
    description: "用于产品视觉、发布物料与创意工作流的提示词学习资料。",
  },
  {
    index: "04",
    href: "/projects",
    title: "项目案例",
    description: "精选的产品、系统、界面与实验案例，展示它们如何变成结果。",
  },
  {
    index: "05",
    href: "/stack",
    title: "工具整理",
    description: "整理支撑个人项目、网站开发、内容记录与自动化的常用工具。",
  },
  {
    index: "06",
    href: "/about",
    title: "关于我",
    description: "不是自我包装，而是一份围绕持续构建展开的个人工作画像。",
  },
];

export function BentoGrid() {
  const [featured, ...secondaryItems] = items;

  return (
    <section className="studio-section">
      <SectionHeading
        eyebrow="站点地图 // CORE DIRECTORY"
        title="核心入口"
        description="这里整理了个人项目、构建日志、学习资料和开发实验入口。"
      />
      <div className="grid gap-4">
        <Reveal delay={0} once>
          <Link
            href={featured.href}
            className="group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-[28px] border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white shadow-[0_22px_68px_-14px_rgba(15,23,42,0.22)] transition-transform duration-300 hover:-translate-y-1 md:min-h-[268px] md:p-8"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-[radial-gradient(closest-side,rgba(14,165,233,0.22),transparent)]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-sky-300/90">
                  {`${featured.index} // FLAGSHIP ENTRANCE`}
                </p>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-white/75">
                  INTERACTIVE LABS
                </span>
              </div>
              <h3 className="mt-6 max-w-[12ch] text-4xl font-semibold tracking-tight md:mt-7 md:text-5xl">
                {featured.title}
              </h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
                {featured.description}
              </p>
            </div>
            <span className="relative z-10 mt-8 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all duration-300 group-hover:scale-105 group-hover:bg-white group-hover:text-slate-950">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </Reveal>

        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {secondaryItems.map((item, index) => (
            <Reveal key={item.href} delay={(index + 1) * 0.03} once>
              <Link
                href={item.href}
                className="group luminous-surface hover-lift flex h-full flex-col justify-between gap-5 rounded-[22px] p-5 sm:p-6 hover:border-sky-300/80 hover:shadow-[0_16px_38px_-10px_rgba(14,165,233,0.14)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-slate-400 group-hover:text-sky-600 transition-colors">
                    {`${item.index} // ENTRY`}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-slate-500 transition-all duration-300 group-hover:border-sky-200 group-hover:bg-sky-50 group-hover:text-sky-600">
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground group-hover:text-sky-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
