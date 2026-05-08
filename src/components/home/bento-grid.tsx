import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";

const items = [
  {
    href: "/ai-lab",
    title: "AI Lab",
    description: "用于归档海报、网站视觉、品牌画面和提示词研究的实验库。",
    span: "md:col-span-2",
  },
  {
    href: "/build-log",
    title: "构建日志",
    description: "记录我如何在 AI、设计、代码与创业压力之间持续把东西做出来。",
  },
  {
    href: "/prompts",
    title: "提示词库",
    description: "用于产品视觉、发布物料与创意工作流的可复用提示词库。",
  },
  {
    href: "/projects",
    title: "项目案例",
    description: "精选的产品、系统、界面与实验案例，展示它们如何变成结果。",
    span: "md:col-span-2",
  },
  {
    href: "/stack",
    title: "工具栈",
    description: "支撑整个工作室的 AI、设计、开发、内容与自动化工具。",
  },
  {
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
        eyebrow="工作室地图"
        title="核心入口"
        description="这不是传统博客目录，更像是我如何真正展开工作的控制面板。"
      />
      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        <Reveal delay={0} once>
          <Link
            href={featured.href}
            className="group flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[28px] border border-slate-900/8 bg-slate-950 p-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] hover:-translate-y-1"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/54">主入口</p>
              <h3 className="mt-8 max-w-[12ch] text-4xl font-semibold tracking-tight md:text-5xl">
                {featured.title}
              </h3>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/68">
                {featured.description}
              </p>
            </div>
            <span className="mt-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/10 text-white/80 group-hover:bg-white group-hover:text-slate-950">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </Reveal>

        <div className="grid gap-3">
          {secondaryItems.map((item, index) => (
            <Reveal key={item.href} delay={(index + 1) * 0.04} once>
            <Link
              href={item.href}
              className="group grid gap-4 border-b border-slate-900/8 bg-white/36 px-1 py-4 transition hover:bg-white/66 md:grid-cols-[140px_1fr_auto] md:items-center md:px-5"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">入口</p>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/8 bg-white/70 text-muted-foreground group-hover:text-foreground">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
