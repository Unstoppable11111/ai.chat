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
  return (
    <section className="studio-section">
      <SectionHeading
        eyebrow="工作室地图"
        title="核心入口"
        description="这不是传统博客目录，更像是我如何真正展开工作的控制面板。"
      />
      <div className="grid gap-4 md:grid-cols-4">
        {items.map((item, index) => (
          <Reveal key={item.href} delay={index * 0.04} once>
            <Link
              href={item.href}
              className={`glass-panel group flex h-full flex-col rounded-[28px] p-6 hover:-translate-y-1 ${item.span ?? ""}`}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">入口</p>
              <div className="mt-6 flex flex-1 items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <span className="rounded-full border border-slate-900/8 bg-white/70 p-2 text-muted-foreground group-hover:text-foreground">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
