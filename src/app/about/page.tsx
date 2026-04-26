import type { Metadata } from "next";
import { Mail, MessagesSquare, Sparkles, Workflow } from "lucide-react";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "关于我",
  description: "一个围绕 AI 构建、设计与产品实验展开的个人工作画像。",
};

const sections = [
  {
    title: "我是谁",
    text: "我在做的不是传统意义上的个人主页，而是一个真实运转中的个人工作室。这里会持续公开我如何用 AI、设计和代码，把一个模糊想法推进成视觉、页面、产品与系统。",
  },
  {
    title: "我在构建什么",
    text: "我正在搭一个 AI Native Studio：一边产出视觉实验和提示词资产，一边把有效方法沉淀成可复用工作流。这个站点本身，也是那个系统的一部分。",
  },
  {
    title: "我在意什么",
    text: "我更在意能长期复用的结构，而不是一次性的漂亮结果。好的内容、好的界面、好的产品，对我来说都不是孤立作品，而是能不断叠加的系统资产。",
  },
  {
    title: "我怎么工作",
    text: "我的工作节奏很像一间轻量创业工作室：先快速验证，再记录过程，再把有效方法抽出来，做成下一轮还能继续用的模块。",
  },
  {
    title: "现在的重点",
    text: "目前重点在三个方向：AI 生图与视觉语言、个人产品与工作台，以及内容系统和提示词资产的结构化管理。",
  },
  {
    title: "我开放什么合作",
    text: "如果你在做 AI 产品、创意工具、品牌官网、视觉系统，或者独立产品实验，这里会很对路。尤其适合需要把想法快速变成可见成果的阶段。",
  },
];

const highlights = [
  {
    icon: Sparkles,
    title: "视觉实验",
    text: "把提示词、构图、光线和品牌气质打磨成可复用的视觉模块。",
  },
  {
    icon: Workflow,
    title: "工作流设计",
    text: "不只做页面，也把背后的生产流程、内容结构和自动化一起理顺。",
  },
  {
    icon: MessagesSquare,
    title: "合作方式",
    text: "偏直接、清晰、快迭代式协作，不拖泥带水，也不空谈概念。",
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          eyebrow="个人画像"
          title="关于我"
          description="这不是一页传统简历，更像是一份关于我如何思考、如何构建、如何实验的工作画像。"
        />

        <div className="grid items-stretch gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Reveal once>
            <section className="glass-panel flex h-full flex-col rounded-[30px] p-7 md:p-8">
              <p className="text-sm leading-8 text-muted-foreground">
                我希望这个网站传递的不是“我会什么”，而是“我现在正在把什么做出来”。
                如果你正在找一个会把 AI、设计、前端和产品思维放到同一张桌子上工作的人，这里基本就是最真实的切面。
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Reveal key={item.title} delay={index * 0.05} once>
                      <div className="flex h-full flex-col rounded-[22px] border border-slate-900/8 bg-slate-900/[0.03] p-5">
                        <Icon className="h-5 w-5 text-brand-cyan" />
                        <h2 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h2>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.08} once>
            <aside className="glass-panel flex h-full flex-col rounded-[30px] p-7 md:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-brand-cyan">联系</p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground">一起做点东西</h2>
              <p className="mt-4 text-sm leading-8 text-muted-foreground">
                如果你想聊合作、产品实验、品牌官网、AI 视觉系统，或者只是想交流一个还没成形的想法，都可以直接发我邮件。
              </p>
              <a
                href={`mailto:${siteConfig.email}`}
                className="mt-6 inline-flex items-center gap-2 self-start rounded-full border border-slate-900/8 bg-white px-5 py-3 text-sm font-medium text-foreground shadow-sm hover:-translate-y-0.5"
              >
                <Mail className="h-4 w-4 text-brand-cyan" />
                {siteConfig.email}
              </a>
              <div className="mt-8 grid flex-1 gap-3 text-sm text-muted-foreground">
                <div className="rounded-[20px] border border-slate-900/8 bg-slate-900/[0.03] p-4">
                  偏好的合作方式：短周期、快同步、边做边看结果。
                </div>
                <div className="rounded-[20px] border border-slate-900/8 bg-slate-900/[0.03] p-4">
                  更适合的话题：AI 产品、视觉实验、内容系统、工作流工具。
                </div>
              </div>
            </aside>
          </Reveal>
        </div>

        <div className="mt-5 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section, index) => (
            <Reveal key={section.title} delay={index * 0.05} once>
              <section className="glass-panel flex h-full flex-col rounded-[28px] p-6">
                <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
                <p className="mt-4 text-sm leading-8 text-muted-foreground">{section.text}</p>
              </section>
            </Reveal>
          ))}
        </div>
      </PageIntro>
    </PageShell>
  );
}
