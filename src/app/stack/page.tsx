import type { Metadata } from "next";
import { PageIntro } from "@/components/shared/page-intro";
import { PageShell } from "@/components/shared/page-shell";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { stackCategories } from "@/data/site";

export const metadata: Metadata = {
  title: "工具整理",
  description: "整理支撑个人项目、网站开发、内容记录与自动化的常用工具。",
};

export default function StackPage() {
  return (
    <PageShell>
      <PageIntro>
        <SectionHeading
          eyebrow="工作系统"
          title="工具整理"
          description="整理支撑个人项目、网站开发、内容记录与自动化的常用工具。"
        />
        <div className="space-y-6">
          {stackCategories.map((category, index) => (
            <Reveal key={category.title} delay={index * 0.05} once>
              <section className="glass-panel rounded-[28px] p-6">
                <div className="mb-6 max-w-2xl">
                  <h2 className="text-2xl font-semibold">{category.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {category.tools.map((tool, toolIndex) => (
                    <Reveal key={tool.name} delay={toolIndex * 0.03} once>
                      <div className="flex h-full flex-col rounded-[22px] border border-slate-900/8 bg-white/78 p-4 shadow-sm">
                        <p className="text-base font-medium text-foreground">{tool.name}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {tool.detail}
                        </p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>
      </PageIntro>
    </PageShell>
  );
}
